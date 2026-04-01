import { createClient } from "@/lib/supabase/server";
import { BILLING_ENABLED } from "@/lib/billing/config";
import { getUserSubscription } from "@/lib/billing/subscriptions";
import { createCheckoutSession } from "@/lib/billing/checkout";

export async function POST(request: Request) {
  if (!BILLING_ENABLED) {
    return Response.json(
      { error: { code: "BILLING_DISABLED", message: "Billing is not enabled" } },
      { status: 503 }
    );
  }

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

  // Duplicate subscription guard
  const subscription = await getUserSubscription(user.id);
  if (subscription.subscriptionStatus === "active") {
    return Response.json(
      {
        error: {
          code: "ALREADY_SUBSCRIBED",
          message: "You already have an active subscription",
        },
      },
      { status: 409 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const url = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      stripeCustomerId: subscription.stripeCustomerId,
      returnUrl: origin,
    });
    return Response.json({ url });
  } catch {
    return Response.json(
      { error: { code: "CHECKOUT_FAILED", message: "Failed to create checkout session" } },
      { status: 500 }
    );
  }
}
