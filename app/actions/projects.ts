// app/actions/projects.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canCreateProject, getUserPlan } from "@/lib/billing/limits";

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

  const plan = await getUserPlan(user.id);
  // Free-plan projects expire after 7 days; paid plans have indefinite persistence.
  const expiresAt =
    plan === "free"
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, user_id: user.id, expires_at: expiresAt })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  redirect(`/projects/${data.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id); // only delete own projects

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
