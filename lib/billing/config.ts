export const PLANS = {
  free: {
    name: "Free",
    priceUsd: 0,
  },
  pro: {
    name: "Pro",
    priceUsd: 29,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
} as const;
