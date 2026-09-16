import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { logger } from "@/lib/logger";

const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/api/health",
  "/api/leads",
  "/icon",
  "/apple-icon",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    if (!isPublicPath(request.nextUrl.pathname) && request.nextUrl.pathname !== "/") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        if (headers) {
          Object.entries(headers).forEach(([headerName, headerValue]) => {
            supabaseResponse.headers.set(headerName, headerValue);
          });
        }
      },
    },
  });

  let user: { sub?: string } | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    user = data?.claims ?? null;
  } catch (error) {
    logger.warn("auth.claims_unavailable", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return supabaseResponse;
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
