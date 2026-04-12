import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/billing/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id || profile.subscription_status !== "active") {
    return Response.json(
      { error: { code: "NO_ACTIVE_SUBSCRIPTION", message: "No active subscription to cancel" } },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();

    // Cancel at period end — user retains access until billing cycle ends
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Eagerly write the cancel date to the profile so the UI updates immediately
    // without waiting for the webhook. cancel_at is set by Stripe when
    // cancel_at_period_end is true — it equals the current period end.
    const cancelAt = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null;
    const serviceSupabase = createServiceClient();
    await serviceSupabase
      .from("profiles")
      .update({
        subscription_cancel_at: cancelAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return Response.json({ cancelAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel subscription";
    return Response.json(
      { error: { code: "CANCEL_FAILED", message } },
      { status: 500 }
    );
  }
}
