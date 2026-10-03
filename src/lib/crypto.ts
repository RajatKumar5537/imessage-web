import crypto from "crypto";

const ALGORITHM_CBC = "aes-256-cbc";
const ALGORITHM_GCM = "aes-256-gcm";
const PREFIX = "enc:";

const KEY_SALT = "personal-tracker-salt";

// Messages written before a real secret existed can still be read.
// New ciphertext is never produced with this key.
const LEGACY_KEY = crypto.scryptSync(
  "default-fallback-personal-tracker-key-2808",
  KEY_SALT,
  32
);

let primaryKey: Buffer | null = null;

function deriveKey(secret: string): Buffer {
  return crypto.scryptSync(secret, KEY_SALT, 32);
}

// ENCRYPTION_SECRET is set in hosting but was never used by this module.
// Existing rows were sealed with NEXTAUTH_SECRET, so that derivation stays.
function getPrimaryKey(): Buffer {
  if (primaryKey) return primaryKey;
  if (process.env.ENCRYPTION_KEY) {
    try {
      const buf = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
      if (buf.length === 32) {
        primaryKey = buf;
        return primaryKey;
      }
    } catch {
      // Not a hex key; fall through to passphrase derivation.
    }
  }
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing ENCRYPTION_KEY or NEXTAUTH_SECRET. Refusing to encrypt with a public fallback key."
    );
  }
  primaryKey = deriveKey(secret);
  return primaryKey;
}

/* =========================================================
   1. Standard String Field Encryption (Used by Expenses)
   ========================================================= */

function decryptWithKey(
  algorithm: "aes-256-cbc" | "aes-256-gcm",
  key: Buffer,
  iv: Buffer,
  encryptedText: string,
  authTag?: Buffer
): string {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  if (authTag) {
    (decipher as crypto.DecipherGCM).setAuthTag(authTag);
  }
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encrypt(text: string): string {
  if (text === null || text === undefined) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM_CBC, getPrimaryKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${PREFIX}${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text || typeof text !== "string" || !text.startsWith(PREFIX)) {
    return text; // Return as-is if not encrypted (supports existing plaintext data)
  }
  try {
    const parts = text.substring(PREFIX.length).split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    try {
      return decryptWithKey(ALGORITHM_CBC, getPrimaryKey(), iv, encryptedText);
    } catch {
      return decryptWithKey(ALGORITHM_CBC, LEGACY_KEY, iv, encryptedText);
    }
  } catch (err) {
    console.error("Decryption failed:", err);
    return text; // Fallback to raw string
  }
}

export function isEncrypted(text: string): boolean {
  return typeof text === "string" && text.startsWith(PREFIX);
}

/* =========================================================
   2. Secret Chat AES-256-GCM Encryption (Used by Chat)
   ========================================================= */

export interface EncryptedData {
  content: string;
  iv: string;
  authTag: string;
}

export function encryptMessage(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM_GCM, getPrimaryKey(), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    content: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptMessage(data: { content?: string; iv?: string; authTag?: string }): string {
  try {
    if (!data.content || !data.iv || !data.authTag) return "";
    const iv = Buffer.from(data.iv, "hex");
    const authTag = Buffer.from(data.authTag, "hex");
    try {
      return decryptWithKey(ALGORITHM_GCM, getPrimaryKey(), iv, data.content, authTag);
    } catch {
      return decryptWithKey(ALGORITHM_GCM, LEGACY_KEY, iv, data.content, authTag);
    }
  } catch (err) {
    console.error("Failed to decrypt message:", err);
    return "[Encrypted Message - Unable to Decrypt]";
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
