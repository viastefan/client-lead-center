import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { ApiError, jsonError } from "@/lib/api/errors";
import { assertSameOrigin, enforceMemoryRateLimit } from "@/lib/api/origin";
import { requireApiAdmin } from "@/lib/api/require-user";
import { readJsonBody } from "@/lib/api/website-auth";
import { htmlFromText } from "@/lib/email/html";
import { resolveSmtpAccount, sendSmtpMail, verifySmtp } from "@/lib/email/ionos";
import { smtpUserMessage } from "@/lib/email/smtp-errors";
import { renderMailPlaceholders } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import { mailBroadcastSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const maxDuration = 60;

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    enforceMemoryRateLimit(`mail-broadcast:${clientKey(request)}`, 3, 10 * 60 * 1000);

    const parsed = mailBroadcastSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid broadcast payload.", parsed.error.flatten());
    }

    const unique = new Map<string, (typeof parsed.data.recipients)[number]>();
    for (const recipient of parsed.data.recipients) {
      unique.set(recipient.email.toLowerCase(), recipient);
    }
    const recipients = [...unique.values()];

    const rendered = recipients.map((recipient) => {
      const input = {
        company: recipient.company,
        contact: recipient.contact || recipient.company,
        email: recipient.email,
        domain: recipient.domain,
      };
      const subject = renderMailPlaceholders(parsed.data.subject, input);
      const text = renderMailPlaceholders(parsed.data.text, input);
      return { email: recipient.email, company: recipient.company, subject, text };
    });

    if (parsed.data.dryRun) {
      logger.info("mail.broadcast_preview", { requestId, total: rendered.length });
      return Response.json({
        success: true,
        dryRun: true,
        total: rendered.length,
        sent: 0,
        failed: [],
        rendered: rendered.slice(0, 3),
      });
    }

    const account = resolveSmtpAccount(parsed.data);
    if (!account) {
      throw new ApiError(
        400,
        "BAD_REQUEST",
        "1&1/IONOS SMTP is not configured. Connect the mailbox or set IONOS_SMTP_USER and IONOS_SMTP_PASSWORD.",
      );
    }

    await verifySmtp(account);

    const failed: Array<{ email: string; message: string }> = [];
    let sent = 0;
    for (const item of rendered) {
      try {
        await sendSmtpMail(account, {
          to: item.email,
          subject: item.subject,
          text: item.text,
          html: htmlFromText(item.text, item.company),
        });
        sent += 1;
      } catch (error) {
        failed.push({
          email: item.email,
          message: smtpUserMessage(error),
        });
      }
      await pause(80);
    }

    logger.info("mail.broadcast", { requestId, sent, failed: failed.length, total: rendered.length });
    return Response.json({
      success: failed.length === 0,
      dryRun: false,
      total: rendered.length,
      sent,
      failed,
      rendered: rendered.slice(0, 1),
    });
  } catch (error) {
    if (error instanceof ApiError) return jsonError(error, requestId);
    logger.error("mail.broadcast_failed", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonError(new ApiError(500, "INTERNAL_ERROR", smtpUserMessage(error)), requestId);
  }
}
