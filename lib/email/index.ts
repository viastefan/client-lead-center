import { gmailAdapter } from "@/lib/email/providers/gmail";
import { microsoftAdapter } from "@/lib/email/providers/microsoft";
import type { MailboxAdapter, MailboxProvider } from "@/lib/email/types";

export type {
  MailboxAdapter,
  MailboxConnection,
  MailboxProvider,
} from "@/lib/email/types";
export { NotImplementedMailboxError } from "@/lib/email/types";

export function getMailboxAdapter(provider: MailboxProvider): MailboxAdapter {
  if (provider === "gmail") {
    return gmailAdapter;
  }
  return microsoftAdapter;
}
