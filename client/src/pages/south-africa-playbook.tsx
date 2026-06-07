import { SalesPlaybookPage } from "@/components/sales-playbook-page";

export default function SouthAfricaPlaybookPage() {
  return (
    <SalesPlaybookPage
      title="South Africa Demo Playbook"
      marketLabel="South Africa sales briefing"
      description="A South Africa pitch for NCR, SARB, FSCA, and lender stakeholders, focused on positive reporting, POPIA consent, affordability governance, and bureau-grade auditability."
      contentEndpoint="/api/sales/south-africa-playbook/content"
      patchEndpoint="/api/sales/south-africa-playbook/content"
      pdfEndpoint="/api/sales/south-africa-playbook/pdf"
      downloadFileName="UCH-South-Africa-Demo-Playbook.pdf"
      sourceHint="Detailed talk track, POPIA objections, NCR positioning, and positive-reporting demo steps."
      briefingStats={[
        { label: "Credit-active market", value: "28M+", detail: "consumers under POPIA controls", icon: "users" },
        { label: "Provider network", value: "3,000+", detail: "NCR-registered credit providers", icon: "target" },
        { label: "Go-live path", value: "30 days", detail: "pilot to compliance review", icon: "calendar" },
      ]}
      talkingPoints={[
        "POPIA consent, audit logs, and adverse-decision explainability are visible in the workflow.",
        "Positive reporting fields and NCR-aligned risk narratives support compliance teams.",
        "UCH is an upgrade path for mature bureaus, not only a greenfield registry story.",
      ]}
    />
  );
}
