/**
 * KeyVault — small abstraction over how device-signing key material is
 * stored. The default implementation envelope-encrypts the per-device
 * secret using the existing application encryption key (AES-256-GCM).
 *
 * Production deployments can swap this out for AWS KMS / GCP KMS /
 * HashiCorp Vault by implementing the same interface and returning a
 * `keyVaultBackend` other than `db_envelope` plus an opaque
 * `keyReference` (e.g. the KMS arn). The verifier never inspects the
 * backend — it only ever calls `getKey()` to obtain the raw bytes for
 * HMAC verification.
 *
 * Critical guarantees:
 *   - Raw key bytes are never logged.
 *   - The serialized envelope payload is never logged.
 *   - Errors thrown from this module never include the ciphertext.
 */
import crypto from "crypto";
import { encryptPII, decryptPII } from "./encryption";

export type KeyVaultBackend = "db_envelope" | "aws_kms" | "gcp_kms" | "hashicorp_vault";

const KEY_VAULT_BACKENDS: readonly KeyVaultBackend[] = [
  "db_envelope", "aws_kms", "gcp_kms", "hashicorp_vault",
] as const;

export function isKeyVaultBackend(value: unknown): value is KeyVaultBackend {
  return typeof value === "string" && (KEY_VAULT_BACKENDS as readonly string[]).includes(value);
}

/**
 * Coerce an arbitrary string (typically read off a database row) into a
 * known {@link KeyVaultBackend}. Falls back to `db_envelope` for legacy
 * rows so we never propagate `unknown` into security-critical paths.
 */
export function coerceKeyVaultBackend(value: unknown): KeyVaultBackend {
  return isKeyVaultBackend(value) ? value : "db_envelope";
}

export interface StoredKey {
  /** Identifier of the storage backend that produced this stored key. */
  backend: KeyVaultBackend;
  /** Opaque payload to store in the database. */
  encryptedKey: string;
  /** Optional external reference (e.g. KMS arn). */
  keyReference?: string | null;
}

export interface KeyVault {
  backend: StoredKey["backend"];
  /** Generate a fresh symmetric key and return the storable envelope. */
  generateKey(): Promise<{ stored: StoredKey; raw: Buffer }>;
  /** Wrap an externally-provided raw key (32 bytes recommended). */
  wrapKey(raw: Buffer): Promise<StoredKey>;
  /** Unwrap to raw bytes. Returns `null` on tamper / decryption failure. */
  getKey(stored: StoredKey): Promise<Buffer | null>;
}

/**
 * Default backend: AES-256-GCM envelope on top of the existing PII
 * encryption key. The envelope ciphertext is then stored as a single
 * text column on `loto_fiscal_devices.encrypted_key`.
 */
class DbEnvelopeKeyVault implements KeyVault {
  backend = "db_envelope" as const;

  async generateKey() {
    const raw = crypto.randomBytes(32);
    const stored = await this.wrapKey(raw);
    return { stored, raw };
  }

  async wrapKey(raw: Buffer): Promise<StoredKey> {
    const ciphertext = encryptPII(raw.toString("base64"));
    return { backend: this.backend, encryptedKey: ciphertext, keyReference: null };
  }

  async getKey(stored: StoredKey): Promise<Buffer | null> {
    try {
      const decoded = decryptPII(stored.encryptedKey);
      if (!decoded || decoded === stored.encryptedKey) return null;
      return Buffer.from(decoded, "base64");
    } catch {
      return null;
    }
  }
}

/**
 * Documented stub for an HSM/KMS-backed implementation. A production
 * deployment would wire this up to AWS KMS / GCP KMS / HashiCorp Vault
 * and return the resulting key arn / handle as `keyReference`. The
 * verifier never has to change.
 */
export class HsmKeyVaultStub implements KeyVault {
  backend: StoredKey["backend"];
  constructor(backend: "aws_kms" | "gcp_kms" | "hashicorp_vault") {
    this.backend = backend;
  }
  async generateKey(): Promise<{ stored: StoredKey; raw: Buffer }> {
    throw new Error(`HsmKeyVaultStub(${this.backend}) is not wired in this environment`);
  }
  async wrapKey(): Promise<StoredKey> {
    throw new Error(`HsmKeyVaultStub(${this.backend}) is not wired in this environment`);
  }
  async getKey(): Promise<Buffer | null> {
    throw new Error(`HsmKeyVaultStub(${this.backend}) is not wired in this environment`);
  }
}

/**
 * Resolve the active KeyVault. Today we always return the DB envelope
 * vault. To switch a deployment to AWS KMS, set `LOTO_KEYVAULT=aws_kms`
 * and provide the corresponding implementation.
 */
let _activeVault: KeyVault | null = null;
export function getKeyVault(): KeyVault {
  if (_activeVault) return _activeVault;
  const which = (process.env.LOTO_KEYVAULT || "db_envelope").toLowerCase();
  if (which === "db_envelope") {
    _activeVault = new DbEnvelopeKeyVault();
  } else if (which === "aws_kms" || which === "gcp_kms" || which === "hashicorp_vault") {
    _activeVault = new HsmKeyVaultStub(which);
  } else {
    // Unknown backend → fail closed by using the audited default rather
    // than instantiating an HSM stub with an arbitrary string.
    _activeVault = new DbEnvelopeKeyVault();
  }
  return _activeVault;
}

/** Helper to compute the canonical signature payload for a receipt. */
export function canonicalReceiptPayload(parts: {
  fiscalCode: string;
  merchantVatId: string;
  issuedAtUnix: number;
  amountTotal: string;
  currency: string;
}): string {
  return [
    parts.fiscalCode,
    parts.merchantVatId,
    String(parts.issuedAtUnix),
    parts.amountTotal,
    parts.currency,
  ].join("|");
}

/** Compute the hex-encoded HMAC-SHA256 signature. */
export function signReceiptPayload(rawKey: Buffer, payload: string): string {
  return crypto.createHmac("sha256", rawKey).update(payload).digest("hex");
}

/** Constant-time signature comparison. */
export function verifyReceiptPayload(rawKey: Buffer, payload: string, signature: string): boolean {
  const expected = signReceiptPayload(rawKey, payload);
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
