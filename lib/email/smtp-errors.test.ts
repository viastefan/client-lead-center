import assert from "node:assert/strict";
import { test } from "node:test";
import { looksLikeIonosDeveloperKey, smtpUserMessage } from "./smtp-errors";

test("developer portal secrets are not mailbox passwords", () => {
  assert.equal(
    looksLikeIonosDeveloperKey("c776545a112f4ea1ba4918c1a5503b0a.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
    true,
  );
  assert.equal(looksLikeIonosDeveloperKey("Webmail-Passwort-2024"), false);
});

test("auth failures tell the user to use webmail password", () => {
  const message = smtpUserMessage({ code: "EAUTH", responseCode: 535, message: "Invalid login" });
  assert.match(message, /Webmail-Passwort/);
  assert.doesNotMatch(message, /Invalid login/);
});
