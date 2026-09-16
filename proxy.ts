import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    logger.error("proxy.unhandled", {
      path: request.nextUrl.pathname,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
