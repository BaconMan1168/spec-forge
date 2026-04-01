import Stripe from "stripe";
import { BILLING_ENABLED } from "./config";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!BILLING_ENABLED) {
    throw new Error("Billing is not enabled");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
