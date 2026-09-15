import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/api/errors";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;

export async function enforceRateLimit(websiteId: string) {
  const supabase = createAdminClient();
  const bucketStart = new Date(
    Math.floor(Date.now() / (WINDOW_SECONDS * 1000)) * WINDOW_SECONDS * 1000,
  ).toISOString();

  const { data: existing, error: readError } = await supabase
    .from("api_rate_limits")
    .select("request_count")
    .eq("website_id", websiteId)
    .eq("bucket_start", bucketStart)
    .maybeSingle();

  if (readError) {
    throw new ApiError(500, "INTERNAL_ERROR", "Rate limit check failed.");
  }

  const current = existing?.request_count ?? 0;
  if (current >= MAX_REQUESTS) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please retry later.");
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("api_rate_limits")
      .update({ request_count: current + 1 })
      .eq("website_id", websiteId)
      .eq("bucket_start", bucketStart);

    if (updateError) {
      throw new ApiError(500, "INTERNAL_ERROR", "Rate limit update failed.");
    }
    return;
  }

  const { error: insertError } = await supabase.from("api_rate_limits").insert({
    website_id: websiteId,
    bucket_start: bucketStart,
    request_count: 1,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return enforceRateLimit(websiteId);
    }
    throw new ApiError(500, "INTERNAL_ERROR", "Rate limit insert failed.");
  }
}
