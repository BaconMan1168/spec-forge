"use server";

import { createClient } from "@/lib/supabase/server";
import {
  parseFileToText,
  isSupportedMimeType,
  countWords,
} from "@/lib/parse/parse-file";
import { canAddFile as checkCanAddFile, getUserPlan } from "@/lib/billing/limits";
import { FILE_SIZE_LIMITS, FILE_TYPE_LABEL, formatBytes } from "@/lib/billing/config";
import type { FeedbackFile } from "@/lib/types/database";

function sanitizeSourceLabel(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9 \-]/g, "").slice(0, 60);
}

// file.type is empty string on some browsers/OS combos (common for PDFs on Windows).
// Fall back to extension-based detection so uploads don't silently fail.
const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
};

function resolveMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? "";
}

export type UploadResult = {
  succeeded: FeedbackFile[];
  failed: { name: string; error: string }[];
};

export async function uploadFeedbackFiles(
  formData: FormData
): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const projectId = formData.get("project_id") as string;
  if (!projectId) throw new Error("Project ID is required");

  const limitResult = await checkCanAddFile(user.id, projectId);
  if (!limitResult.allowed) {
    throw new Error(limitResult.reason);
  }

  // remaining tells us how many more files this project can accept
  let slotsLeft = limitResult.remaining ?? 0;

  const plan = await getUserPlan(user.id);

  const sourceType = sanitizeSourceLabel(
    (formData.get("source_type") as string) ?? ""
  );
  if (!sourceType) throw new Error("Source label is required");

  const files = formData.getAll("files") as File[];
  const succeeded: FeedbackFile[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const file of files) {
    if (slotsLeft <= 0) {
      failed.push({ name: file.name, error: limitResult.reason || "File limit reached for this project" });
      continue;
    }
    const mimeType = resolveMimeType(file);
    const sizeLimit = FILE_SIZE_LIMITS[mimeType]?.[plan];
    if (sizeLimit !== undefined && file.size > sizeLimit) {
      const typeLabel = FILE_TYPE_LABEL[mimeType] ?? "This file type";
      const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
      failed.push({
        name: file.name,
        error: `${typeLabel} files are limited to ${formatBytes(sizeLimit)} on the ${planLabel} plan`,
      });
      continue;
    }
    if (!isSupportedMimeType(mimeType)) {
      failed.push({ name: file.name, error: "Unsupported file type" });
      continue;
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = await parseFileToText(buffer, mimeType, file.name);
      // Sanitize filename to prevent storage path issues with spaces/special chars
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `projects/${projectId}/${crypto.randomUUID()}-${safeName}`;

      const { error: storageError } = await supabase.storage
        .from("feedback-uploads")
        .upload(storagePath, buffer, { contentType: mimeType });

      if (storageError) {
        failed.push({ name: file.name, error: storageError.message });
        continue;
      }

      const { data: record, error: dbError } = await supabase
        .from("feedback_files")
        .insert({
          project_id: projectId,
          file_name: file.name,
          source_type: sourceType,
          content,
          storage_url: storagePath,
          mime_type: mimeType,
          input_method: "upload",
          word_count: countWords(content),
        })
        .select()
        .single();

      if (dbError || !record) {
        failed.push({
          name: file.name,
          error: dbError?.message ?? "DB insert failed",
        });
        continue;
      }
      succeeded.push(record as FeedbackFile);
      slotsLeft--;
    } catch (err) {
      failed.push({
        name: file.name,
        error: err instanceof Error ? err.message : "Parse failed",
      });
    }
  }

  return { succeeded, failed };
}

export async function pasteFeedbackText(data: {
  projectId: string;
  sourceType: string;
  content: string;
}): Promise<FeedbackFile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const limitResult = await checkCanAddFile(user.id, data.projectId);
  if (!limitResult.allowed) {
    throw new Error(limitResult.reason);
  }

  const sourceType = sanitizeSourceLabel(data.sourceType);
  const content = data.content.trim();
  if (!sourceType) throw new Error("Source label is required");
  if (!content) throw new Error("Content is required");

  const { data: record, error } = await supabase
    .from("feedback_files")
    .insert({
      project_id: data.projectId,
      file_name: "Pasted text",
      source_type: sourceType,
      content,
      storage_url: null,
      mime_type: null,
      input_method: "paste",
      word_count: countWords(content),
    })
    .select()
    .single();

  if (error || !record) throw new Error(error?.message ?? "Failed to save");
  return record as FeedbackFile;
}

export async function getFeedbackFiles(
  projectId: string
): Promise<FeedbackFile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FeedbackFile[];
}

export async function deleteFeedbackBatch(
  projectId: string,
  sourceType: string
): Promise<void> {
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("feedback_files")
    .select("storage_url")
    .eq("project_id", projectId)
    .eq("source_type", sourceType);

  const { error } = await supabase
    .from("feedback_files")
    .delete()
    .eq("project_id", projectId)
    .eq("source_type", sourceType);

  if (error) throw new Error(error.message);

  const paths = (files ?? [])
    .map((f) => f.storage_url)
    .filter((p): p is string => p !== null);

  if (paths.length > 0) {
    await supabase.storage.from("feedback-uploads").remove(paths);
  }
}
