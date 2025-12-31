import { supabaseBrowser } from "../supabase/client";

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * Uses the 'booking-photos' bucket by default.
 */
export async function uploadMedia(file: File, bucket = "booking-photos"): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `chat-media/${fileName}`;

    if (!supabaseBrowser) {
        throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.");
    }

    const { error: uploadError, data } = await supabaseBrowser.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseBrowser.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
}
