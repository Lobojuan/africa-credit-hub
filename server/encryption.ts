import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

let _cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (_cachedKey) return _cachedKey;

  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) {
    const fallback = process.env.SESSION_SECRET;
    if (!fallback) {
      throw new Error("CRITICAL: Neither PII_ENCRYPTION_KEY nor SESSION_SECRET is set. Cannot encrypt/decrypt PII data.");
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[SECURITY] WARNING: PII_ENCRYPTION_KEY not set. Using SESSION_SECRET as fallback. Set a dedicated PII_ENCRYPTION_KEY for production.");
    }
    _cachedKey = crypto.scryptSync(fallback, "cdh-pii-salt-v1", 32);
    return _cachedKey;
  }
  _cachedKey = crypto.scryptSync(key, "cdh-pii-salt-v1", 32);
  return _cachedKey;
}

export function encryptPII(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (plaintext.startsWith("enc:")) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptPII(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  if (!ciphertext.startsWith("enc:")) return ciphertext;

  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 4) return ciphertext;

    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const encrypted = parts[3];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return ciphertext;
  }
}

const PII_FIELDS = [
  "nationalId", "tinNumber", "passportNumber", "votersId",
  "ssnitNumber", "driversLicense", "ghanaCardNumber", "ezwichNumber",
  "otherIdNumber", "dateOfBirth", "mobileMoneyNumber",
];

export function encryptBorrowerPII(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const field of PII_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = encryptPII(result[field]);
    }
  }
  return result;
}

export function decryptBorrowerPII(data: Record<string, any>): Record<string, any> {
  if (!data) return data;
  const result = { ...data };
  for (const field of PII_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = decryptPII(result[field]);
    }
  }
  return result;
}

export function decryptBorrowerArray(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(decryptBorrowerPII);
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashForIntegrity(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
