import Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { PLANS } from "@/lib/billing/config";

function planFromPriceId(priceId: string): "pro" | "max" | null {
  if (priceId === PLANS.pro.stripePriceId) return "pro";
  if (priceId === PLANS.max.stripePriceId) return "max";
  return null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json(
      { error: { code: "MISSING_SIGNATURE" } },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    return Response.json(
      { error: { code: "INVALID_SIGNATURE", message } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan === "max" ? "max" : "pro";
      if (!userId || !session.customer || !session.subscription) break;

      // Retrieve subscription to get period dates
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const item = subscription.items.data[0];
      await supabase.from("profiles").upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: "active",
        subscription_plan: plan,
        subscription_period_start: item?.current_period_start
          ? new Date(item.current_period_start * 1000).toISOString()
          : null,
        subscription_period_end: item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        subscription_cancel_at: null,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const item = subscription.items.data[0];
      const priceId = item?.price?.id ?? "";
      const plan = planFromPriceId(priceId);

      const periodEnd = item?.current_period_end;
      const cancelAt = subscription.cancel_at_period_end && periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null;

      // Fetch current profile to check if a pending downgrade just took effect
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("subscription_pending_plan")
        .eq("id", userId)
        .single();

      const pendingPlan = existingProfile?.subscription_pending_plan ?? null;
      const downgradeFulfilled = pendingPlan !== null && plan === pendingPlan;

      await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status,
          ...(plan !== null ? { subscription_plan: plan } : {}),
          subscription_period_start: item?.current_period_start
            ? new Date(item.current_period_start * 1000).toISOString()
            : null,
          subscription_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
          subscription_cancel_at: cancelAt,
          // Clear pending downgrade once it's been applied
          ...(downgradeFulfilled
            ? { subscription_pending_plan: null, subscription_schedule_id: null }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;
      await supabase
        .from("profiles")
        .update({
          stripe_subscription_id: null,
          subscription_status: "canceled",
          subscription_plan: null,
          subscription_period_start: null,
          subscription_period_end: null,
          subscription_cancel_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
