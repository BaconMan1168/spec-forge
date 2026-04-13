import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/config";

export async function POST(request: Request) {
  void request;
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
    .select("stripe_customer_id, stripe_subscription_id, subscription_plan")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id || !profile?.stripe_subscription_id) {
    return Response.json(
      { error: { code: "NO_SUBSCRIPTION", message: "No active subscription found" } },
      { status: 400 }
    );
  }

  if (profile.subscription_plan === "max") {
    return Response.json(
      { error: { code: "ALREADY_MAX", message: "You are already on the Max plan" } },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();

    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return Response.json(
        { error: { code: "NO_SUBSCRIPTION_ITEM", message: "Could not find subscription item" } },
        { status: 500 }
      );
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItemId,
          price: PLANS.max.stripePriceId,
          quantity: 1,
        },
      ],
      cancel_at_period_end: false,
    });

    const serviceSupabase = createServiceClient();
    await serviceSupabase
      .from("profiles")
      .update({
        subscription_plan: "max",
        subscription_cancel_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upgrade subscription";
    return Response.json(
      { error: { code: "UPGRADE_FAILED", message } },
      { status: 500 }
    );
  }
}
