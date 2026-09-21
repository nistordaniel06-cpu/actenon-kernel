import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey() {
  const encoded = process.env.ENCRYPTION_KEY;
  if (!encoded) throw new Error("ENCRYPTION_KEY lipsește.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY trebuie să fie o cheie de 32 bytes în base64.");
  }
  return key;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(payload: string) {
  const [version, ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".");
  if (version !== "v1" || !ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error("Secret criptat invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivEncoded, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
