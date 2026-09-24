const API_KEY_HINT =
  "Das ist kein Webmail-Passwort. Der Schlüssel aus dem IONOS Entwicklerportal (X-API-Key) kann keine E-Mails senden. Bitte das Passwort der Adresse aus IONOS Webmail verwenden.";

export function looksLikeIonosDeveloperKey(password: string): boolean {
  const value = password.trim();
  if (!value) return false;
  if (/^[a-f0-9]{32}\.[A-Za-z0-9+/=_-]{20,}$/i.test(value)) return true;
  return value.length >= 50 && /^[A-Za-z0-9+/=_-]+$/.test(value);
}

export function isSmtpAuthFailure(error: unknown): boolean {
  const code = errorCode(error);
  const responseCode = errorResponseCode(error);
  const message = errorMessage(error);
  return (
    code === "EAUTH" ||
    responseCode === 535 ||
    responseCode === 534 ||
    /invalid login|authentication failed|535|username and password not accepted/i.test(message)
  );
}

export function isSmtpConnectionFailure(error: unknown): boolean {
  const code = errorCode(error);
  const message = errorMessage(error);
  return (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    /timeout|timed out|connect econn|socket/i.test(message)
  );
}

export function smtpUserMessage(error: unknown): string {
  const message = errorMessage(error);
  if (looksLikeIonosDeveloperKey(message)) return API_KEY_HINT;
  if (isSmtpAuthFailure(error)) {
    return "Anmeldung abgelehnt. Benutzername ist die volle E-Mail-Adresse, Passwort das Webmail-Passwort dieser Adresse — nicht der API-Schlüssel aus dem IONOS Entwicklerportal.";
  }
  if (isSmtpConnectionFailure(error)) {
    return "Keine Verbindung zu smtp.ionos.de. Port 465 (SSL) und 587 (STARTTLS) wurden versucht.";
  }
  if (/certificate|unable to verify|self[- ]signed/i.test(message)) {
    return "TLS-Zertifikat konnte nicht geprüft werden. SMTP-Host muss smtp.ionos.de sein.";
  }
  if (/sender address rejected|553|550/i.test(message)) {
    return "IONOS hat den Absender abgelehnt. Die From-Adresse muss zum verbundenen Postfach gehören.";
  }
  const compact = message.replace(/\s+/g, " ").trim().slice(0, 240);
  return compact ? `SMTP-Fehler: ${compact}` : "SMTP-Verbindung fehlgeschlagen.";
}

export function ionosApiKeyHint(): string {
  return API_KEY_HINT;
}

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "";
}

function errorResponseCode(error: unknown): number | undefined {
  if (error && typeof error === "object" && "responseCode" in error && typeof error.responseCode === "number") {
    return error.responseCode;
  }
  return undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}
