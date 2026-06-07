import { SalesPlaybookPage } from "@/components/sales-playbook-page";

export default function GhanaPlaybookPage() {
  return (
    <SalesPlaybookPage
      title="Ghana Demo Playbook"
      marketLabel="Ghana sales briefing"
      description="A 20-minute pitch path for Ghana financial-sector prospects, focused on NPL pressure, Bank of Ghana compliance, alternative data coverage, and a practical 30-day onboarding close."
      contentEndpoint="/api/sales/ghana-playbook/content"
      patchEndpoint="/api/sales/ghana-playbook/content"
      pdfEndpoint="/api/sales/ghana-playbook/pdf"
      downloadFileName="UCH-Ghana-Demo-Playbook.pdf"
      statsEndpoint="/api/sales/ghana-playbook/stats"
      viewEndpoint="/api/sales/ghana-playbook/view"
      sourceHint="Detailed talk track, demo steps, tough questions, and closing script."
      briefingStats={[
        { label: "NPL pressure", value: "18%", detail: "Ghana banking sector ratio", icon: "target" },
        { label: "Mobile money reach", value: "22M+", detail: "wallets for alternative data", icon: "users" },
        { label: "Go-live path", value: "30 days", detail: "sandbox to production pitch", icon: "calendar" },
      ]}
      talkingPoints={[
        "We score 40% more Ghanaians than a traditional bureau can.",
        "BoG consent, audit, and export controls are built in from day one.",
        "A founding Ghana partner can be live in 30 days.",
      ]}
    />
  );
}
