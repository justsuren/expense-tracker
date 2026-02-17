import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "receipts";

export async function uploadReceipt(
  supabase: SupabaseClient,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = getExtension(mimeType);
  const timestamp = Date.now();
  const randomHex = Math.random().toString(16).slice(2, 10);
  const filePath = `${timestamp}-${randomHex}.${ext}`;

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
