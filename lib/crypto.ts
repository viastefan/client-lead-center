import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { getEncryptionKey } from "@/lib/env";

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf8").digest("hex");
}

export function generateApiKey(): string {
  return `clc_${randomBytes(24).toString("hex")}`;
}

export function hashesMatch(expectedHash: string, providedKey: string): boolean {
  const actual = hashApiKey(providedKey);
  const expected = Buffer.from(expectedHash);
  const given = Buffer.from(actual);
  if (expected.length !== given.length) {
    return false;
  }
  return timingSafeEqual(expected, given);
}

function encryptionMaterial(): Buffer {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error("ENCRYPTION_KEY is not configured.");
  }
  return createHash("sha256").update(key, "utf8").digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid encrypted payload.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionMaterial(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hmacSign(value: string): string {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error("ENCRYPTION_KEY is not configured.");
  }
  return createHmac("sha256", key).update(value).digest("hex");
}
