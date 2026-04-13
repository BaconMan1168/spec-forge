import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/config";

export async function GET() {
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

    const preview = await stripe.invoices.createPreview({
      customer: profile.stripe_customer_id,
      subscription: profile.stripe_subscription_id,
      subscription_details: {
        items: [
          {
            id: subscriptionItemId,
            price: PLANS.max.stripePriceId,
          },
        ],
      },
    });

    return Response.json({
      amountDue: preview.amount_due,
      currency: preview.currency,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch preview";
    return Response.json(
      { error: { code: "PREVIEW_FAILED", message } },
      { status: 500 }
    );
  }
}
