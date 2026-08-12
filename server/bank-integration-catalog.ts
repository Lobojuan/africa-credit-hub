export type BankIntegrationReadiness = {
  id: string;
  name: string;
  purpose: string;
  status: "configured" | "needs_configuration" | "contract_required";
  detail: string;
  nextStep: string;
};

/**
 * Deliberately reports capability only. It must never disclose URLs, keys, or
 * permit a UI action to initiate a live banking connection.
 */
export function getBankIntegrationReadiness(): BankIntegrationReadiness[] {
  const monoConfigured = Boolean(process.env.MONO_API_KEY && process.env.MONO_PUBLIC_KEY);
  const stitchConfigured = Boolean(process.env.STITCH_CLIENT_ID && process.env.STITCH_CLIENT_SECRET);
  const okraConfigured = Boolean(process.env.OKRA_SECRET_KEY);
  const xdsConfigured = Boolean(process.env.XDS_GHANA_API_URL && process.env.XDS_GHANA_API_KEY);
  const smsConfigured = Boolean(
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
    || (process.env.AT_USERNAME && process.env.AT_API_KEY),
  );

  return [
    {
      id: "core-banking",
      name: "Core banking & loan tape",
      purpose: "NPL early warning, payment history, and controlled case handoffs.",
      status: "contract_required",
      detail: "No bank core connection is enabled by default.",
      nextStep: "Agree the data contract, sandbox endpoint, service account, and reconciliation ownership with the bank.",
    },
    {
      id: "payment-rails",
      name: "Payments & transaction events",
      purpose: "Fraud screening and failed-transaction resolution.",
      status: "contract_required",
      detail: "UCH can assess and record cases; it does not connect to, reverse, hold, or release funds by default.",
      nextStep: "Agree an event schema, signed webhook, idempotency policy, and bank-owned reversal process.",
    },
    {
      id: "open-banking",
      name: "Open banking data",
      purpose: "Affordability and cash-flow evidence with customer consent.",
      status: monoConfigured || stitchConfigured || okraConfigured ? "configured" : "needs_configuration",
      detail: monoConfigured || stitchConfigured || okraConfigured
        ? "At least one supported provider credential set is present. Live use still requires the bank's consent and provider onboarding."
        : "Mono, Stitch, and Okra adapters exist but no provider credential set is configured.",
      nextStep: "Complete provider onboarding, configure a sandbox credential set, and run consent-led link-session tests.",
    },
    {
      id: "credit-bureau",
      name: "Ghana credit-bureau access",
      purpose: "Credit-report requests and regulated bureau workflows.",
      status: xdsConfigured ? "configured" : "needs_configuration",
      detail: xdsConfigured ? "XDS Ghana credentials are present." : "No XDS Ghana credential set is configured.",
      nextStep: "Obtain the bureau agreement and sandbox credentials, then verify consent, query, and audit evidence end-to-end.",
    },
    {
      id: "customer-notifications",
      name: "Customer notifications",
      purpose: "Consent requests and controlled operational communication.",
      status: smsConfigured ? "configured" : "needs_configuration",
      detail: smsConfigured ? "An SMS provider credential set is present." : "No SMS provider credential set is configured.",
      nextStep: "Configure a sandbox sender and test delivery, expiry, and customer-response evidence.",
    },
  ];
}
