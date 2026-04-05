import { createClient } from "@/lib/supabase/server";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | string | null;

export interface UserSubscription {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, subscription_status")
    .eq("id", userId)
    .single();

  return {
    stripeCustomerId: data?.stripe_customer_id ?? null,
    stripeSubscriptionId: data?.stripe_subscription_id ?? null,
    subscriptionStatus: data?.subscription_status ?? null,
  };
}
