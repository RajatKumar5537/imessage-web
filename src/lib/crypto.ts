import crypto from "crypto";

const ALGORITHM_GCM = "aes-256-gcm";

const getSecretKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || "prime-chat-default-aes-secret-salt-2808";
  return crypto.scryptSync(secret, "prime-chat-salt-2026", 32);
};

const SECRET_KEY = getSecretKey();

export interface EncryptedPayload {
  content: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts a message using AES-256-GCM.
 */
export function encryptMessage(text: string): EncryptedPayload {
  if (text === null || text === undefined) {
    return { content: "", iv: "", authTag: "" };
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM_GCM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    content: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM payload.
 */
export function decryptMessage(data: { content?: string; iv?: string; authTag?: string }): string {
  try {
    if (!data.content || !data.iv || !data.authTag) return "";
    const iv = Buffer.from(data.iv, "hex");
    const authTag = Buffer.from(data.authTag, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM_GCM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.content, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt prime-chat message:", err);
    return "[Encrypted Message]";
  }
}

/**
 * Encrypts any sensitive string field into an `enc:iv:authTag:content` token for safe DB storage.
 */
export function encryptField(plainText?: string | null): string {
  if (!plainText) return "";
  const { content, iv, authTag } = encryptMessage(plainText);
  return `enc:${iv}:${authTag}:${content}`;
}

/**
 * Decrypts a field stored in `enc:iv:authTag:content` format. If not encrypted, returns original string.
 */
export function decryptField(ciphertextOrPlain?: string | null): string {
  if (!ciphertextOrPlain) return "";
  if (!ciphertextOrPlain.startsWith("enc:")) {
    return ciphertextOrPlain; // Legacy or plaintext
  }
  const parts = ciphertextOrPlain.split(":");
  if (parts.length < 4) return ciphertextOrPlain;
  const [, iv, authTag, content] = parts;
  return decryptMessage({ content, iv, authTag });
}
