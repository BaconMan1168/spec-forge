"use server";

import { createClient } from "@/lib/supabase/server";
import {
  parseFileToText,
  isSupportedMimeType,
  countWords,
} from "@/lib/parse/parse-file";
import type { FeedbackFile } from "@/lib/types/database";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeSourceLabel(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9 \-]/g, "").slice(0, 60);
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
  const sourceType = sanitizeSourceLabel(
    (formData.get("source_type") as string) ?? ""
  );
  if (!sourceType) throw new Error("Source label is required");
  if (!projectId) throw new Error("Project ID is required");

  const files = formData.getAll("files") as File[];
  const succeeded: FeedbackFile[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      failed.push({ name: file.name, error: "File exceeds 10 MB limit" });
      continue;
    }
    if (!isSupportedMimeType(file.type)) {
      failed.push({ name: file.name, error: "Unsupported file type" });
      continue;
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = await parseFileToText(buffer, file.type, file.name);
      const storagePath = `projects/${projectId}/${crypto.randomUUID()}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from("feedback-uploads")
        .upload(storagePath, buffer, { contentType: file.type });

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
          mime_type: file.type,
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
