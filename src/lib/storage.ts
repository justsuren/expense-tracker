import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "receipts";

function sanitize(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);
}

export async function uploadReceipt(
  supabase: SupabaseClient,
  buffer: Buffer,
  mimeType: string,
  opts?: { date?: string | null; senderName?: string | null; merchant?: string | null }
): Promise<string> {
  const ext = getExtension(mimeType);

  // Build filename: YYYYMMDD_SenderName_Merchant.ext
  const datePart = opts?.date
    ? opts.date.replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const senderPart = sanitize(opts?.senderName ?? "Unknown");
  const merchantPart = sanitize(opts?.merchant ?? "Unknown");
  const randomSuffix = Math.random().toString(16).slice(2, 6);
  const filePath = `${datePart}_${senderPart}_${merchantPart}_${randomSuffix}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
  };
  return map[mimeType] ?? "bin";
}
