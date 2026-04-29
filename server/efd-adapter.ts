/**
 * Fiscal Device Adapter — pluggable interface that decouples the rest of
 * the platform from any specific Electronic Fiscal Device (EFD) vendor.
 *
 * Today we ship `SimulatedEfd`, an in-process implementation used by the
 * merchant POS simulator. It produces real cryptographically-signed
 * receipts using the same `KeyVault` primitives a production deployment
 * would use against a certified vendor — which means demos exercise the
 * exact same verification pipeline as production scans.
 *
 * `CertifiedEfdAdapter` is a documented stub whose method shapes match
 * the published call surface of common East / West African EFD vendor
 * APIs (HTTP + serial + signature). Wiring it to a live vendor is a
 * vendor-specific integration (procurement / certification) and is
 * explicitly out of scope for this task — the adapter contract is what
 * lets us drop the real implementation in later without changing any
 * business logic.
 */
import {
  canonicalReceiptPayload,
  signReceiptPayload,
  getKeyVault,
  coerceKeyVaultBackend,
  type KeyVault,
} from "./key-vault";

export interface IssueReceiptInput {
  /** Active fiscal device id (loto_fiscal_devices.id). */
  deviceId: string;
  /** Vendor-stamped device serial (publicly visible, on the QR payload). */
  deviceSerial: string;
  /** Merchant VAT/fiscal id — included in the canonical signed payload. */
  merchantVatId: string;
  /** Currency code as stored on the receipt row. */
  currency: string;
  /** Receipt total in major units, as a stringified decimal. */
  amountTotal: string;
  /** Wall-clock issuance time. */
  issuedAt: Date;
  /** Pre-allocated fiscal code (the row PK in human-readable form). */
  fiscalCode: string;
}

export interface SignedReceipt {
  fiscalCode: string;
  signature: string;
  deviceSerial: string;
  /** Canonical signed-string payload (returned for debug / re-verification). */
  canonical: string;
  /** Compact QR payload string the consumer scans. */
  qrPayload: string;
  issuedAtUnix: number;
}

/** Build the compact JSON QR payload string. */
export function buildQrPayload(parts: {
  fiscalCode: string;
  signature: string;
  deviceSerial: string;
}): string {
  // We intentionally use a short field naming convention so the QR is
  // small enough to scan reliably from a low-quality phone camera.
  return JSON.stringify({
    f: parts.fiscalCode,
    s: parts.signature,
    d: parts.deviceSerial,
    v: 1,
  });
}

/** Parse a QR payload back into its structured parts. Returns null on shape mismatch. */
export function parseQrPayload(raw: string): {
  fiscalCode: string;
  signature: string;
  deviceSerial: string;
} | null {
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    const fiscalCode = typeof obj.f === "string" ? obj.f : null;
    const signature = typeof obj.s === "string" ? obj.s : null;
    const deviceSerial = typeof obj.d === "string" ? obj.d : null;
    if (!fiscalCode || !signature || !deviceSerial) return null;
    if (!/^[A-Za-z0-9_\-]+$/.test(fiscalCode)) return null;
    if (!/^[a-f0-9]{32,128}$/i.test(signature)) return null;
    if (!/^[A-Za-z0-9_\-]+$/.test(deviceSerial)) return null;
    return { fiscalCode, signature, deviceSerial };
  } catch {
    return null;
  }
}

export interface FiscalDeviceAdapter {
  /** Human-readable name of the underlying fiscal device backend. */
  readonly name: string;
  /** Sign a payload using the device's key, returning a hex HMAC. */
  signPayload(input: {
    deviceEncryptedKey: string;
    keyVaultBackend: string;
    canonical: string;
  }): Promise<string>;
  /** End-to-end issuance: build canonical payload + signature + QR string. */
  issueReceipt(
    input: IssueReceiptInput,
    deviceEncryptedKey: string,
    keyVaultBackend: string,
  ): Promise<SignedReceipt>;
}

/**
 * In-process EFD that signs receipts with a per-device key managed by
 * the `KeyVault`. Used by the POS simulator and by the test suite.
 */
export class SimulatedEfd implements FiscalDeviceAdapter {
  readonly name = "SimulatedEfd";
  private vault: KeyVault;
  constructor(vault?: KeyVault) {
    this.vault = vault ?? getKeyVault();
  }

  async signPayload(input: {
    deviceEncryptedKey: string;
    keyVaultBackend: string;
    canonical: string;
  }): Promise<string> {
    const raw = await this.vault.getKey({
      backend: coerceKeyVaultBackend(input.keyVaultBackend),
      encryptedKey: input.deviceEncryptedKey,
    });
    if (!raw) throw new Error("device_key_unavailable");
    return signReceiptPayload(raw, input.canonical);
  }

  async issueReceipt(
    input: IssueReceiptInput,
    deviceEncryptedKey: string,
    keyVaultBackend: string,
  ): Promise<SignedReceipt> {
    const issuedAtUnix = Math.floor(input.issuedAt.getTime() / 1000);
    const canonical = canonicalReceiptPayload({
      fiscalCode: input.fiscalCode,
      merchantVatId: input.merchantVatId,
      issuedAtUnix,
      amountTotal: input.amountTotal,
      currency: input.currency,
    });
    const signature = await this.signPayload({
      deviceEncryptedKey,
      keyVaultBackend,
      canonical,
    });
    return {
      fiscalCode: input.fiscalCode,
      signature,
      deviceSerial: input.deviceSerial,
      canonical,
      qrPayload: buildQrPayload({
        fiscalCode: input.fiscalCode,
        signature,
        deviceSerial: input.deviceSerial,
      }),
      issuedAtUnix,
    };
  }
}

/**
 * Spec stub for a certified vendor adapter. Intentionally not wired —
 * a production rollout swaps this for a real client (HTTP / serial /
 * vendor SDK) targeting the country's certified EFD manufacturer
 * (e.g. KRA-approved OSCU/CSU device under eTIMS, FIRS-approved
 * fiscaliser under e-Invoice). The adapter must still produce the
 * canonical signed-payload + signature shape so the verifier code
 * never has to change.
 */
export class CertifiedEfdAdapter implements FiscalDeviceAdapter {
  readonly name = "CertifiedEfdAdapter";
  async signPayload(): Promise<string> {
    // Real implementation would call into the vendor's signing
    // hardware (e.g. PKCS#11 token, vendor REST API, serial port).
    throw new Error("CertifiedEfdAdapter requires vendor wiring (procurement + certification)");
  }
  async issueReceipt(): Promise<SignedReceipt> {
    throw new Error("CertifiedEfdAdapter requires vendor wiring (procurement + certification)");
  }
}

/** Singleton accessor used by routes / POS simulator. */
let _simulated: SimulatedEfd | null = null;
export function getSimulatedEfd(): SimulatedEfd {
  if (!_simulated) _simulated = new SimulatedEfd();
  return _simulated;
}
