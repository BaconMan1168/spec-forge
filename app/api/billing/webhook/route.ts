import Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

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
      await supabase.from("profiles").upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status: "active",
        subscription_plan: plan,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;
      const { data: existing } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .single();
      if (existing?.subscription_status === subscription.status) break;
      await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status,
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
