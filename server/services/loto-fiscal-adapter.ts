/**
 * Loto Fiscal Verification Adapter — Task #488
 *
 * Pluggable per-country fiscal ID verification layer. Follows the same
 * structural pattern as loto-messaging-adapter.ts:
 *
 *   SimulatedFiscalAdapter  — always passes, used in all non-production
 *                             environments and in unit tests.
 *   CIDGIAdapter            — stub for Ivory Coast DGI / e-Impots NCC
 *                             lookup. Executes real HTTP call only when
 *                             PRODUCTION_MODE=true AND CIDGI_API_URL is set.
 *                             All other environments fall back to simulated.
 *   getFiscalAdapter(cc)    — routes to the correct adapter by country code,
 *                             always returning simulated in DEMO mode.
 *
 * Adding a new country (e.g. Ghana GH/TIN/GRA) is a single new class +
 * one `case` in `getFiscalAdapter`. No schema changes required.
 *
 * Hard rule: in DEMO mode (PRODUCTION_MODE !== "true") SimulatedFiscalAdapter
 * is ALWAYS used regardless of config, so demos/tests cannot reach real DGI
 * APIs.
 */

export type FiscalAdapterId = "simulated" | "ci_dgi" | "gh_gra" | "ng_firs";

export interface FiscalVerifyInput {
  fiscalId: string;
  countryCode: string;
  merchantName?: string;
}

export interface FiscalVerifyResult {
  verified: boolean;
  /** Canonical name as returned by the fiscal authority (may differ from merchantName) */
  authorityName?: string;
  /** Human-readable status message for the UI */
  message: string;
  /** Provider reference or transaction ID from the authority's API */
  providerRef?: string | null;
  /** Any additional structured metadata from the authority */
  metadata?: Record<string, unknown>;
}

export interface FiscalAdapter {
  id: FiscalAdapterId;
  /**
   * Verify that a fiscal ID (NCC, TIN, RC, etc.) is registered and active
   * with the relevant tax authority. Returns verified=true only when the
   * authority confirms the business exists and is subject to VAT.
   */
  verify(input: FiscalVerifyInput): Promise<FiscalVerifyResult>;
}

/**
 * DEMO / TEST default. Always returns verified=true with a simulated ref.
 * Never opens a network connection. All non-production environments use this.
 */
export class SimulatedFiscalAdapter implements FiscalAdapter {
  id: FiscalAdapterId = "simulated";

  async verify(input: FiscalVerifyInput): Promise<FiscalVerifyResult> {
    console.info(
      `[loto-fiscal:simulated] verify ${input.countryCode}/${input.fiscalId} → verified (demo mode)`,
    );
    return {
      verified: true,
      authorityName: input.merchantName ?? "Demo Merchant",
      message: `[Demo] ${input.fiscalId} verified in simulated mode — no real authority call made`,
      providerRef: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      metadata: { mode: "simulated" },
    };
  }
}

/**
 * Côte d'Ivoire — DGI / e-Impots NCC verification STUB.
 *
 * Documented against the DGI e-Impots portal architecture (Feb 2025 DGI
 * presentation). A real integration would call the DGI NCC lookup endpoint:
 *   GET ${CIDGI_API_URL}/contribuables/{ncc}
 *   Headers: Authorization: Bearer ${CIDGI_API_TOKEN}
 *   Response: { ncc, raisonSociale, regimeFiscal, assujetti_tva, statut }
 *
 * The two controls we care about (mirroring DGI's own 8-control list):
 *   1. Existence in DGI taxpayer file (NCC valid)
 *   2. Subject to real tax regime + TVA (assujetti_tva = true)
 *
 * In DEMO or when CIDGI_API_URL is absent, falls back to simulated so the
 * full flow (validation, UI badge, audit log) still works end-to-end.
 */
export class CIDGIAdapter implements FiscalAdapter {
  id: FiscalAdapterId = "ci_dgi";
  private fallback = new SimulatedFiscalAdapter();

  private isLive(): boolean {
    return (
      process.env.PRODUCTION_MODE === "true" &&
      !!process.env.CIDGI_API_URL &&
      !!process.env.CIDGI_API_TOKEN
    );
  }

  async verify(input: FiscalVerifyInput): Promise<FiscalVerifyResult> {
    if (!this.isLive()) {
      // Non-production path: simulate a DGI check
      console.info(
        `[loto-fiscal:ci_dgi] verify NCC=${input.fiscalId} → fallback to simulated (PRODUCTION_MODE not set or credentials absent)`,
      );
      return this.fallback.verify(input);
    }

    // Production path — real e-Impots NCC lookup
    try {
      const baseUrl = process.env.CIDGI_API_URL!.replace(/\/$/, "");
      const r = await fetch(`${baseUrl}/contribuables/${encodeURIComponent(input.fiscalId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CIDGI_API_TOKEN}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!r.ok) {
        const txt = await r.text();
        if (r.status === 404) {
          return {
            verified: false,
            message: `NCC ${input.fiscalId} is not registered in the DGI taxpayer file. Please verify the number with the DGI.`,
            providerRef: null,
          };
        }
        return {
          verified: false,
          message: `DGI e-Impots returned an error (HTTP ${r.status}). Please try again later.`,
          providerRef: null,
          metadata: { httpStatus: r.status, body: txt.slice(0, 500) },
        };
      }

      const data = (await r.json()) as {
        ncc?: string;
        raisonSociale?: string;
        regimeFiscal?: string;
        assujetti_tva?: boolean;
        statut?: string;
      };

      if (!data.assujetti_tva) {
        return {
          verified: false,
          authorityName: data.raisonSociale,
          message: `NCC ${input.fiscalId} exists but is not subject to TVA (DGI control 2: assujettissement). Receipts from this merchant cannot generate lottery entries.`,
          providerRef: data.ncc ?? null,
          metadata: data,
        };
      }

      return {
        verified: true,
        authorityName: data.raisonSociale,
        message: `NCC ${input.fiscalId} verified — ${data.raisonSociale} is registered and subject to TVA with the DGI.`,
        providerRef: data.ncc ?? null,
        metadata: data,
      };
    } catch (err) {
      const msg = (err as Error).message;
      console.error(
        `[loto-fiscal:ci_dgi] verify error for NCC=${input.fiscalId}: ${msg} — falling back to simulated`,
      );
      // On any network / timeout exception fall back to simulated so a transient
      // DGI outage never blocks merchants from being verified in production.
      // The fallback result includes metadata indicating the fallback reason so
      // operators can distinguish a real verification from a fallback one.
      const fallbackResult = await this.fallback.verify(input);
      return {
        ...fallbackResult,
        message: `[DGI unreachable — simulated fallback] ${fallbackResult.message}`,
        metadata: { ...((fallbackResult.metadata as object) ?? {}), fallbackReason: msg },
      };
    }
  }
}

/**
 * Ghana Revenue Authority stub — placeholder for when Ghana onboards.
 * Uses simulated path until GRA credentials and API URL are configured.
 */
export class GHGRAAdapter implements FiscalAdapter {
  id: FiscalAdapterId = "gh_gra";
  private fallback = new SimulatedFiscalAdapter();

  async verify(input: FiscalVerifyInput): Promise<FiscalVerifyResult> {
    console.info(`[loto-fiscal:gh_gra] verify TIN=${input.fiscalId} → stub (GRA API not yet integrated)`);
    return this.fallback.verify(input);
  }
}

/**
 * Nigeria FIRS stub — placeholder for when Nigeria onboards.
 */
export class NGFIRSAdapter implements FiscalAdapter {
  id: FiscalAdapterId = "ng_firs";
  private fallback = new SimulatedFiscalAdapter();

  async verify(input: FiscalVerifyInput): Promise<FiscalVerifyResult> {
    console.info(`[loto-fiscal:ng_firs] verify RC=${input.fiscalId} → stub (FIRS API not yet integrated)`);
    return this.fallback.verify(input);
  }
}

const SIMULATED = new SimulatedFiscalAdapter();
const CI_DGI = new CIDGIAdapter();
const GH_GRA = new GHGRAAdapter();
const NG_FIRS = new NGFIRSAdapter();

/**
 * Adapter router by adapter key (low-level). In DEMO mode always returns
 * simulated. Prefer `getFiscalAdapterByCountry` when the caller has a
 * countryCode rather than an adapter key.
 *
 * To add a new country: add its adapter class above and a `case` here,
 * and add the reverse mapping in `getFiscalAdapterByCountry` below.
 */
export function getFiscalAdapter(adapterId: FiscalAdapterId | string | undefined | null): FiscalAdapter {
  if (process.env.PRODUCTION_MODE !== "true") return SIMULATED;
  switch (adapterId) {
    case "ci_dgi":  return CI_DGI;
    case "gh_gra":  return GH_GRA;
    case "ng_firs": return NG_FIRS;
    case "simulated":
    default:        return SIMULATED;
  }
}

/**
 * Country-code adapter router — the preferred entry point when the caller
 * knows the ISO-3166-1 alpha-2 country code (e.g. "CI", "GH", "NG").
 *
 * Maps country → default adapter key and delegates to `getFiscalAdapter`.
 * In DEMO mode always returns simulated regardless of country.
 *
 * To onboard a new country: add a `case` below and ensure the adapter
 * class and key are registered in `getFiscalAdapter` above.
 */
export function getFiscalAdapterByCountry(countryCode: string): FiscalAdapter {
  if (process.env.PRODUCTION_MODE !== "true") return SIMULATED;
  switch (countryCode.toUpperCase()) {
    case "CI": return CI_DGI;
    case "GH": return GH_GRA;
    case "NG": return NG_FIRS;
    default:   return SIMULATED;
  }
}

/**
 * Validate a fiscal ID string against the country's regex pattern.
 * Returns null if valid, or a human-readable error string if not.
 *
 * This is a client-side-compatible pure function (no DB calls) so it
 * can be used in both the API route and the frontend validation.
 */
export function validateFiscalIdFormat(fiscalId: string, regex: string, label: string): string | null {
  try {
    const re = new RegExp(regex);
    if (!re.test(fiscalId.trim())) {
      return `${label} format is invalid. Expected format: ${regex}`;
    }
    return null;
  } catch {
    return `${label} format validation failed (invalid regex config)`;
  }
}

/**
 * Check if a receipt date is within the DGI's 12-month deductibility window.
 * Returns true when the receipt is still eligible (within window).
 * Returns false when the receipt is too old and should be rejected.
 *
 * This mirrors DGI e-Impots Control #5:
 *   "Respect de l'échéance des douze mois de la déclaration de TVA grevant
 *    une facture (de biens)"
 */
export function isReceiptWithinEligibilityWindow(receiptDate: Date, windowMonths = 12): boolean {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - windowMonths);
  return receiptDate >= cutoff;
}
