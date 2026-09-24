import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { ApiError, jsonError } from "@/lib/api/errors";
import { assertSameOrigin, enforceMemoryRateLimit } from "@/lib/api/origin";
import { requireApiAdmin } from "@/lib/api/require-user";
import { readJsonBody } from "@/lib/api/website-auth";
import { resolveSmtpAccount, sendSmtpMail, verifySmtp } from "@/lib/email/ionos";
import { smtpUserMessage } from "@/lib/email/smtp-errors";
import { logger } from "@/lib/logger";
import { mailSendSchema, mailTestSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const maxDuration = 30;

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    enforceMemoryRateLimit(`mail-send:${clientKey(request)}`, 8, 10 * 60 * 1000);

    const parsed = mailSendSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid mail payload.", parsed.error.flatten());
    }

    const account = resolveSmtpAccount(parsed.data);
    if (!account) {
      throw new ApiError(
        400,
        "BAD_REQUEST",
        "1&1/IONOS SMTP is not configured. Enter mailbox details or set IONOS_SMTP_USER and IONOS_SMTP_PASSWORD.",
      );
    }

    await sendSmtpMail(account, {
      to: parsed.data.to,
      subject: parsed.data.subject,
      text: parsed.data.text,
      html: parsed.data.html,
    });

    logger.info("mail.sent", { requestId, to: parsed.data.to });
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    logger.error("mail.send_failed", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonError(new ApiError(500, "INTERNAL_ERROR", smtpUserMessage(error)), requestId);
  }
}

export async function PUT(request: NextRequest) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    enforceMemoryRateLimit(`mail-test:${clientKey(request)}`, 6, 10 * 60 * 1000);
    const parsed = mailTestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid mailbox payload.", parsed.error.flatten());
    }
    const account = resolveSmtpAccount(parsed.data);
    if (!account) {
      throw new ApiError(400, "BAD_REQUEST", "Mailbox username and password are required.");
    }
    await verifySmtp(account);
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    logger.error("mail.test_failed", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonError(new ApiError(500, "INTERNAL_ERROR", smtpUserMessage(error)), requestId);
  }
}
