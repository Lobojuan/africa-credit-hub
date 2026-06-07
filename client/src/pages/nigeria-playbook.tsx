import { SalesPlaybookPage } from "@/components/sales-playbook-page";

export default function NigeriaPlaybookPage() {
  return (
    <SalesPlaybookPage
      title="Nigeria Demo Playbook"
      marketLabel="Nigeria sales briefing"
      description="A market-ready pitch for Nigeria banks, MFBs, CBN stakeholders, and investors, centered on BVN identity resolution, NDPA consent, eNaira/mobile-wallet signals, and faster credit decisions."
      contentEndpoint="/api/sales/nigeria-playbook/content"
      patchEndpoint="/api/sales/nigeria-playbook/content"
      pdfEndpoint="/api/sales/nigeria-playbook/pdf"
      downloadFileName="UCH-Nigeria-Demo-Playbook.pdf"
      sourceHint="Detailed talk track, BVN-linked demo steps, market facts, and Nigerian regulatory objections."
      briefingStats={[
        { label: "Addressable market", value: "220M+", detail: "population and borrower base", icon: "users" },
        { label: "Mobile wallet signal", value: "35M+", detail: "accounts plus eNaira rails", icon: "target" },
        { label: "Go-live path", value: "30 days", detail: "sandbox to CBN-ready pilot", icon: "calendar" },
      ]}
      talkingPoints={[
        "BVN, NIN, and CAC matching create one unified borrower profile across institutions.",
        "NDPA lawful-basis controls and CBN reporting are part of the core workflow.",
        "Alternative data can expand Nigeria lending coverage without loosening risk standards.",
      ]}
    />
  );
}
