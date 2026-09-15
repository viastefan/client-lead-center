function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function getSupabaseUrl(): string | undefined {
  return read("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return read("SUPABASE_SERVICE_ROLE_KEY");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function getAppUrl(): string {
  return (
    read("APP_URL") ??
    read("NEXT_PUBLIC_APP_URL") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://client-lead-center.vercel.app")
  );
}

export function getEncryptionKey(): string | undefined {
  return read("ENCRYPTION_KEY");
}

export function hasResendKey(): boolean {
  return Boolean(read("RESEND_API_KEY"));
}

export function hasClaudeKey(): boolean {
  return Boolean(read("CLAUDE_API_KEY"));
}

export function hasGoogleOAuth(): boolean {
  return Boolean(read("GOOGLE_CLIENT_ID") && read("GOOGLE_CLIENT_SECRET"));
}

export function hasMicrosoftOAuth(): boolean {
  return Boolean(read("MICROSOFT_CLIENT_ID") && read("MICROSOFT_CLIENT_SECRET"));
}

export function requireSupabasePublicEnv(): { url: string; key: string } {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase URL or anon/publishable key is not configured.");
  }
  return { url, key };
}

export function requireSupabaseAdminEnv(): { url: string; key: string } {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) {
    throw new Error("Supabase service role key is not configured.");
  }
  return { url, key };
}
