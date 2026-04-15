import { cache } from "react";
import { createClient } from "./server";

/**
 * Returns the current authenticated user, deduped per server render via
 * React cache(). Multiple server components calling this in the same request
 * (e.g. layout + page) share one Supabase auth round-trip instead of N.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
