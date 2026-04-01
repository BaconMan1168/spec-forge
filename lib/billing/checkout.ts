import { getStripe } from "./stripe";
import { PLANS } from "./config";

export async function createCheckoutSession({
  userId,
  userEmail,
  stripeCustomerId,
  returnUrl,
}: {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    line_items: [{ price: PLANS.pro.stripePriceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?checkout=success`,
    cancel_url: `${returnUrl}/pricing`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  if (!session.url) throw new Error("No session URL returned from Stripe");
  return session.url;
}
