import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cable, CheckCircle2, FileWarning, LockKeyhole } from "lucide-react";

type Integration = {
  id: string;
  name: string;
  purpose: string;
  status: "configured" | "needs_configuration" | "contract_required";
  detail: string;
  nextStep: string;
};

const statusLabel: Record<Integration["status"], string> = {
  configured: "Configured",
  needs_configuration: "Needs configuration",
  contract_required: "Bank contract required",
};

function statusStyle(status: Integration["status"]) {
  if (status === "configured") return "bg-emerald-600 hover:bg-emerald-700";
  if (status === "contract_required") return "bg-amber-600 hover:bg-amber-700";
  return "bg-slate-600 hover:bg-slate-700";
}

export default function BankIntegrationReadinessPage() {
  const { data, isLoading } = useQuery<{ integrations: Integration[] }>({ queryKey: ["/api/bank-integration-readiness"] });
  const integrations = data?.integrations || [];
  const configured = integrations.filter((item) => item.status === "configured").length;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8" data-testid="bank-integration-readiness">
      <header className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="flex items-center gap-2 text-primary"><Cable className="size-5" /><p className="text-xs font-semibold uppercase tracking-widest">Bank integration gateway</p></div>
        <h1 className="mt-3 text-3xl font-bold">Integration readiness</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">See what UCH can safely connect today and what still needs a bank-owned contract. This page never reveals credentials and does not activate a live connector.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={<CheckCircle2 className="text-emerald-600" />} value={configured} label="Configured capabilities" />
        <Metric icon={<FileWarning className="text-amber-600" />} value={integrations.filter((item) => item.status === "contract_required").length} label="Bank contracts required" />
        <Metric icon={<LockKeyhole className="text-primary" />} value="0" label="Live funds permissions" />
      </section>

      <Card>
        <CardHeader><CardTitle>Connection inventory</CardTitle><CardDescription>Start every integration in a bank-provided sandbox. Production activation requires a signed data contract, least-privilege service account, named owner, and reconciliation evidence.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <p className="text-muted-foreground">Checking capability status…</p> : integrations.map((item) => (
            <article key={item.id} className="rounded-lg border p-4" data-testid={`integration-${item.id}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><h2 className="font-semibold">{item.name}</h2><p className="mt-1 text-sm text-muted-foreground">{item.purpose}</p></div>
                <Badge className={statusStyle(item.status)}>{statusLabel[item.status]}</Badge>
              </div>
              <p className="mt-3 text-sm">{item.detail}</p>
              <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Next step:</span> {item.nextStep}</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-5"><div>{icon}</div><div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>;
}
