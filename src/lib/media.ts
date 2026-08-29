import { supabase } from "./supabase";

const MEDIA_BUCKET = "campus-media";

export async function uploadMediaFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false });
  if (error) {
    if (error.message?.toLowerCase().includes("not found") || (error as any).statusCode === "404") {
      throw new Error(
        `Storage bucket '${MEDIA_BUCKET}' does not exist in your Supabase project. Please create a public bucket named '${MEDIA_BUCKET}' in your Supabase Dashboard -> Storage, or run the migration SQL.`
      );
    }
    throw new Error(error.message || "Upload failed. Please try again.");
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteMediaFile(publicUrl: string): Promise<void> {
  const path = publicUrl.split(`/object/public/${MEDIA_BUCKET}/`)[1];
  if (!path) return;
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}