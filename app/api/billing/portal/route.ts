import { createClient } from "@/lib/supabase/server";
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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return Response.json(
      { error: { code: "NO_CUSTOMER", message: "No Stripe customer found" } },
      { status: 400 }
    );
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings`;

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });
    return Response.json({ url: session.url });
  } catch {
    return Response.json(
      { error: { code: "PORTAL_FAILED", message: "Failed to create portal session" } },
      { status: 500 }
    );
  }
}
