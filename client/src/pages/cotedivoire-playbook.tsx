import { SalesPlaybookPage } from "@/components/sales-playbook-page";

export default function CoteDivoirePlaybookPage() {
  return (
    <SalesPlaybookPage
      title="Côte d'Ivoire Demo Playbook"
      marketLabel="Côte d'Ivoire sales briefing"
      description="A francophone West Africa pitch for BCEAO, DGI, banks, SFDs, and investors, focused on XOF credit intelligence, mobile-money signals, and Loto Fiscal differentiation."
      contentEndpoint="/api/sales/cotedivoire-playbook/content"
      patchEndpoint="/api/sales/cotedivoire-playbook/content"
      pdfEndpoint="/api/sales/cotedivoire-playbook/pdf"
      downloadFileName="UCH-Cote-DIvoire-Demo-Playbook.pdf"
      sourceHint="Detailed talk track, BCEAO positioning, Loto Fiscal demo steps, and French/English buyer responses."
      credentials={[
        { user: "demo_admin", role: "Platform Owner" },
        { user: "credit_admin", role: "Credit Bureau Admin" },
        { user: "johndoe", role: "Credit + Collateral Registry" },
        { user: "loto_admin", role: "Loto Fiscal Admin" },
      ]}
      briefingStats={[
        { label: "Mobile money reach", value: "20M+", detail: "Orange Money, MTN, Wave", icon: "users" },
        { label: "NPL pressure", value: "9.1%", detail: "BCEAO 2024 ratio", icon: "target" },
        { label: "Go-live path", value: "30 days", detail: "BCEAO/DGI-ready pilot", icon: "calendar" },
      ]}
      talkingPoints={[
        "BCEAO credit intelligence and DGI Loto Fiscal give the pitch a public-sector wedge.",
        "XOF-native reporting and French/English talk tracks make the demo fit the room.",
        "Mobile-money behavior can unlock underserved SFD and agricultural borrowers.",
      ]}
    />
  );
}
