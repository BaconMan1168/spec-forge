export const PLANS = {
  free: {
    name: "Free",
    priceUsd: 0,
  },
  pro: {
    name: "Pro",
    priceUsd: 9,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
  max: {
    name: "Max",
    priceUsd: 19,
    stripePriceId: process.env.STRIPE_MAX_PRICE_ID ?? "",
  },
} as const;
