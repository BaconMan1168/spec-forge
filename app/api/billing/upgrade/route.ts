import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/config";

export async function POST(request: Request) {
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

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const stripe = getStripe();

    // Fetch the subscription to get the current subscription item ID
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

    // Create a billing portal session with subscription_update_confirm flow.
    // This shows the official Stripe confirmation page with the old price, new
    // price, and proration before the user confirms — no double-billing risk.
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
      flow_data: {
        type: "subscription_update_confirm",
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: `${origin}/dashboard?upgrade=success`,
          },
        },
        subscription_update_confirm: {
          subscription: profile.stripe_subscription_id,
          items: [
            {
              id: subscriptionItemId,
              price: PLANS.max.stripePriceId,
              quantity: 1,
            },
          ],
        },
      },
    });

    return Response.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create upgrade session";
    return Response.json(
      { error: { code: "UPGRADE_FAILED", message } },
      { status: 500 }
    );
  }
}
