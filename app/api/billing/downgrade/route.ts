import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/config";

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
    .select(
      "stripe_subscription_id, stripe_customer_id, subscription_plan, subscription_status, subscription_schedule_id"
    )
    .eq("id", user.id)
    .single();

  if (
    !profile?.stripe_subscription_id ||
    profile.subscription_status !== "active"
  ) {
    return Response.json(
      {
        error: {
          code: "NO_ACTIVE_SUBSCRIPTION",
          message: "No active subscription found",
        },
      },
      { status: 400 }
    );
  }

  if (profile.subscription_plan !== "max") {
    return Response.json(
      {
        error: {
          code: "NOT_MAX_PLAN",
          message: "Downgrade is only available from the Max plan",
        },
      },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();

    // Retrieve the current subscription to get period end date and item ID
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    const item = subscription.items.data[0];
    if (!item) {
      return Response.json(
        { error: { code: "NO_SUBSCRIPTION_ITEM", message: "Could not find subscription item" } },
        { status: 500 }
      );
    }

    const currentPeriodEnd = item.current_period_end;

    // If a schedule already exists, update it. Otherwise create one.
    let scheduleId: string;

    if (profile.subscription_schedule_id) {
      scheduleId = profile.subscription_schedule_id;
    } else if (subscription.schedule) {
      scheduleId = subscription.schedule as string;
    } else {
      const newSchedule = await stripe.subscriptionSchedules.create({
        from_subscription: profile.stripe_subscription_id,
      });
      scheduleId = newSchedule.id;
    }

    // Update the schedule: current phase (Max) ends at period end, then Pro starts
    await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: PLANS.max.stripePriceId, quantity: 1 }],
          start_date: subscription.start_date,
          end_date: currentPeriodEnd,
        },
        {
          items: [{ price: PLANS.pro.stripePriceId, quantity: 1 }],
          start_date: currentPeriodEnd,
        },
      ],
    });

    // Eagerly mark the pending downgrade in the profile for UI display
    const serviceSupabase = createServiceClient();
    await serviceSupabase
      .from("profiles")
      .update({
        subscription_pending_plan: "pro",
        subscription_schedule_id: scheduleId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    const downgradeAt = new Date(currentPeriodEnd * 1000).toISOString();
    return Response.json({ downgradeAt });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to schedule downgrade";
    return Response.json(
      { error: { code: "DOWNGRADE_FAILED", message } },
      { status: 500 }
    );
  }
}
