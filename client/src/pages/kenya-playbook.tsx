import { SalesPlaybookPage } from "@/components/sales-playbook-page";

export default function KenyaPlaybookPage() {
  return (
    <SalesPlaybookPage
      title="Kenya Demo Playbook"
      marketLabel="Kenya sales briefing"
      description="A 20-minute Kenya pitch for CBK-regulated lenders, SACCOs, and fintechs, focused on M-Pesa alternative data, CRB consolidation, explainable scoring, and KDPA consent."
      contentEndpoint="/api/sales/kenya-playbook/content"
      patchEndpoint="/api/sales/kenya-playbook/content"
      pdfEndpoint="/api/sales/kenya-playbook/pdf"
      downloadFileName="UCH-Kenya-Demo-Playbook.pdf"
      sourceHint="Detailed talk track, M-Pesa demo flow, CBK positioning, and Kenya-specific buyer questions."
      briefingStats={[
        { label: "M-Pesa reach", value: "32M+", detail: "active users as data signal", icon: "users" },
        { label: "NPL pressure", value: "16.5%", detail: "CBK Q4 2024 ratio", icon: "target" },
        { label: "Go-live path", value: "30 days", detail: "sandbox to pilot launch", icon: "calendar" },
      ]}
      talkingPoints={[
        "M-Pesa, SACCO, and utility signals make thin-file borrowers scoreable.",
        "KDPA consent and CBK-ready reporting are visible in the demo, not hidden in back office.",
        "UCH can extend credit to Kenya's next five million borrowers while protecting NPL quality.",
      ]}
    />
  );
}
