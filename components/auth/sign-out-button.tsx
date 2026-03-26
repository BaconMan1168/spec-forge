// components/auth/sign-out-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button
      variant="secondary"
      onClick={handleSignOut}
      className="text-sm px-4 py-2"
    >
      Sign out
    </Button>
  );
}
