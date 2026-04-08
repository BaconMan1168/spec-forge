import { getStripe } from "./stripe";
import { PLANS } from "./config";

export async function createCheckoutSession({
  userId,
  userEmail,
  stripeCustomerId,
  returnUrl,
  plan = "pro",
}: {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  returnUrl: string;
  plan?: "pro" | "max";
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    line_items: [{ price: PLANS[plan].stripePriceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}/pricing`,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
  });

  if (!session.url) throw new Error("No session URL returned from Stripe");
  return session.url;
}
