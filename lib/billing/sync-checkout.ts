import Stripe from "stripe";
import { getStripe } from "./stripe";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Syncs a completed Stripe checkout session directly into the profiles table.
 * Used as a fallback when the webhook fails (e.g. infrastructure redirects).
 * Safe to call multiple times — upsert is idempotent.
 */
export async function syncCheckoutSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid") return false;
    if (!session.customer || !session.subscription) return false;

    // Stripe v20 types omit current_period_* — cast to access the API fields
    const subscription = session.subscription as Stripe.Subscription & {
      current_period_start: number;
      current_period_end: number;
    };
    const plan = session.metadata?.plan === "max" ? "max" : "pro";

    const supabase = createServiceClient();
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

    return true;
  } catch {
    return false;
  }
}
