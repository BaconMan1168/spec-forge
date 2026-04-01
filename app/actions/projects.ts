// app/actions/projects.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { canCreateProject } from "@/lib/billing/limits";

export async function createProject(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
    return;
  }

  const limitResult = await canCreateProject(user.id);
  if (!limitResult.allowed) {
    throw new Error(limitResult.reason);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  redirect(`/projects/${data.id}`);
}
