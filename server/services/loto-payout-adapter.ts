/**
 * Loto payout adapter interface.
 *
 * The default `SimulatedPayoutAdapter` lets the platform run real draws and
 * record real winners without depending on any production mobile-money keys.
 * Wave / Orange Money / MTN MoMo / Moov adapters are stubbed against their
 * published sandbox shapes — production credentials drop in behind the same
 * interface without touching the engine, scheduler, or routes.
 */

export interface DisburseInput {
  winnerId: string;
  amount: string;        // decimal as string (matches Drizzle decimal output)
  currency: string;
  countryCode: string;
  consumerUserId: string | null;
}

export interface DisburseResult {
  status: "succeeded" | "failed" | "skipped";
  providerRef: string | null;
  error?: string;
}

export interface PayoutAdapter {
  readonly providerName: string;
  disburse(input: DisburseInput): Promise<DisburseResult>;
  verify(providerRef: string): Promise<{ status: DisburseResult["status"]; raw?: unknown }>;
}

class SimulatedPayoutAdapter implements PayoutAdapter {
  readonly providerName = "simulated";
  async disburse(input: DisburseInput): Promise<DisburseResult> {
    if (!input.consumerUserId) {
      return { status: "skipped", providerRef: null, error: "anonymous_consumer" };
    }
    const providerRef = `sim_${Date.now()}_${input.winnerId.slice(0, 8)}`;
    // eslint-disable-next-line no-console
    console.info("[loto-payout/simulated] disburse", {
      winnerId: input.winnerId, amount: input.amount, currency: input.currency, providerRef,
    });
    return { status: "succeeded", providerRef };
  }
  async verify(providerRef: string) {
    return { status: "succeeded" as const, raw: { providerRef, simulated: true } };
  }
}

class StubMobileMoneyAdapter implements PayoutAdapter {
  constructor(public readonly providerName: string) {}
  async disburse(input: DisburseInput): Promise<DisburseResult> {
    // Sandbox skeleton — real implementation would POST to provider endpoint with
    // OAuth credentials sourced from environment. Until those land we mark the
    // payout as `skipped` with a clear marker so ops can replay manually.
    return {
      status: "skipped",
      providerRef: null,
      error: `${this.providerName}_sandbox_not_configured`,
    };
  }
  async verify(providerRef: string) {
    return { status: "skipped" as const, raw: { providerRef, provider: this.providerName, configured: false } };
  }
}

const REGISTRY: Record<string, PayoutAdapter> = {
  simulated: new SimulatedPayoutAdapter(),
  wave: new StubMobileMoneyAdapter("wave"),
  orange_money: new StubMobileMoneyAdapter("orange_money"),
  mtn_momo: new StubMobileMoneyAdapter("mtn_momo"),
  moov: new StubMobileMoneyAdapter("moov"),
};

export function adapterFor(provider: string | null | undefined): PayoutAdapter {
  if (!provider) return REGISTRY.simulated;
  return REGISTRY[provider] ?? REGISTRY.simulated;
}

export function listSupportedProviders(): string[] {
  return Object.keys(REGISTRY);
}
