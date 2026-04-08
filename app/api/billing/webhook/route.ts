import Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { PLANS } from "@/lib/billing/config";

// Stripe v20 removed current_period_* from TS types but the REST API still
// returns them. We use this helper to access them safely.
interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

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
      ) as unknown as StripeSubscriptionWithPeriod;

      await supabase.from("profiles").upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: "active",
        subscription_plan: plan,
        subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        subscription_cancel_at: null,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as unknown as StripeSubscriptionWithPeriod;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price?.id ?? "";
      const plan = planFromPriceId(priceId);

      const cancelAt = subscription.cancel_at_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status,
          ...(plan !== null ? { subscription_plan: plan } : {}),
          subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          subscription_cancel_at: cancelAt,
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
