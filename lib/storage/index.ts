import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const BUCKET = "attachments";

export type StoredFile = {
  bucket: string;
  path: string;
};

function customerPath(customerId: string, ...parts: string[]): string {
  return [customerId, ...parts].join("/");
}

export const storage = {
  bucket: BUCKET,

  pathFor(customerId: string, leadId: string, filename: string): string {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    return customerPath(customerId, leadId, `${Date.now()}-${safeName}`);
  },

  async upload(path: string, file: Blob | File | Buffer, contentType: string): Promise<StoredFile> {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType,
      upsert: false,
    });
    if (error) {
      logger.error("storage.upload_failed", { path, message: error.message });
      throw error;
    }
    return { bucket: BUCKET, path };
  },

  async download(path: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) {
      logger.error("storage.download_failed", { path, message: error.message });
      throw error;
    }
    return data;
  },

  async remove(path: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      logger.error("storage.remove_failed", { path, message: error.message });
      throw error;
    }
  },

  async ping(): Promise<boolean> {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.storage.getBucket(BUCKET);
      return !error;
    } catch {
      return false;
    }
  },
};
