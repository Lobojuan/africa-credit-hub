export type MacroRiskDriver = {
  id: "inflation" | "interest_rates" | "foreign_exchange" | "sector_cashflow";
  label: string;
  transmission: string;
  control: string;
};

export type SectorSensitivity = {
  sector: string;
  sensitivity: "elevated" | "high";
  rationale: string;
};

export type NplMacroRiskProfile = {
  country: string;
  title: string;
  purpose: string;
  dataStatus: "bank_configuration_required";
  dataStatusMessage: string;
  drivers: MacroRiskDriver[];
  sectorSensitivities: SectorSensitivity[];
  guardrail: string;
};

// These are deliberately qualitative control hypotheses, not economic forecasts
// or regulatory classifications. A bank must approve, date, and evidence its
// own CPI, policy-rate, FX and sector series before UCH can use them in a credit
// decision, pricing calculation, provisioning run, or regulatory submission.
const GHANA_NPL_MACRO_PROFILE: NplMacroRiskProfile = {
  country: "Ghana",
  title: "Ghana NPL macro-risk overlay",
  purpose: "Connect portfolio stress to the macro channels that can weaken repayment capacity.",
  dataStatus: "bank_configuration_required",
  dataStatusMessage: "Scenario guidance only — no bank-approved CPI, policy-rate, FX, or sector data feed is connected yet.",
  drivers: [
    {
      id: "inflation",
      label: "Inflation and real income",
      transmission: "Higher living and operating costs can reduce household and SME repayment capacity.",
      control: "Load a dated, approved inflation series and review affordability exceptions.",
    },
    {
      id: "interest_rates",
      label: "Interest-rate repricing",
      transmission: "Variable-rate facilities may experience higher instalments after repricing.",
      control: "Map each facility's repricing terms before calculating stressed instalments.",
    },
    {
      id: "foreign_exchange",
      label: "Foreign-exchange pressure",
      transmission: "Currency moves can increase local-currency debt service and imported-input costs.",
      control: "Identify currency mismatch and approve the FX scenario used in each review.",
    },
    {
      id: "sector_cashflow",
      label: "Sector cash-flow stress",
      transmission: "Demand, input cost, weather, commodity, and trade shocks affect sectors differently.",
      control: "Assign an accountable sector owner and preserve evidence for every sector override.",
    },
  ],
  sectorSensitivities: [
    { sector: "Import/Export", sensitivity: "high", rationale: "Foreign-currency and imported-input exposure can amplify cash-flow stress." },
    { sector: "Manufacturing", sensitivity: "high", rationale: "Imported inputs, energy and working-capital needs can transmit macro shocks." },
    { sector: "Transportation", sensitivity: "high", rationale: "Fuel and operating-cost movements can quickly reduce repayment capacity." },
    { sector: "Trade", sensitivity: "elevated", rationale: "Inventory funding and household demand can weaken during cost-of-living pressure." },
    { sector: "Agriculture", sensitivity: "elevated", rationale: "Seasonality, weather, input costs and commodity prices require separate evidence." },
  ],
  guardrail: "UCH does not automate a credit, collection, pricing, provisioning, or regulatory decision from this overlay. A bank-approved risk owner must review the evidence and approve every action.",
};

export function getNplMacroRiskProfile(country: string): NplMacroRiskProfile | null {
  return country.trim().toLowerCase() === "ghana" ? GHANA_NPL_MACRO_PROFILE : null;
}

export function getSectorSensitivity(profile: NplMacroRiskProfile, sector: string | null | undefined): SectorSensitivity | null {
  const normalized = (sector || "").trim().toLowerCase();
  if (!normalized) return null;
  return profile.sectorSensitivities.find((item) => {
    const configured = item.sector.toLowerCase();
    return configured === normalized || normalized.includes(configured) || configured.includes(normalized);
  }) || null;
}
