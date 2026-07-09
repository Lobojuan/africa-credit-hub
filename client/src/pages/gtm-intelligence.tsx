import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Ban,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GtmSummary = {
  companies: number;
  contacts: number;
  campaigns: number;
  messages: number;
  suppressions: number;
  activities: number;
  messageStatus: {
    draft: number;
    approved: number;
    sent: number;
  };
  safety: {
    firstEmailRequiresApproval: boolean;
    autonomousAiCallingEnabled: boolean;
    suppressionRequiredBeforeSend: boolean;
  };
};

type GtmCompany = {
  id: string;
  name: string;
  country?: string | null;
  segment?: string | null;
  institutionType?: string | null;
  status: string;
  fitScore?: number | null;
  source?: string | null;
  updatedAt?: string | null;
};

type GtmActivity = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  createdAt?: string | null;
};

const emptySummary: GtmSummary = {
  companies: 0,
  contacts: 0,
  campaigns: 0,
  messages: 0,
  suppressions: 0,
  activities: 0,
  messageStatus: { draft: 0, approved: 0, sent: 0 },
  safety: {
    firstEmailRequiresApproval: true,
    autonomousAiCallingEnabled: false,
    suppressionRequiredBeforeSend: true,
  },
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: typeof Target;
  tone: string;
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-normal">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GtmIntelligencePage() {
  const { data: summary = emptySummary, isLoading: summaryLoading } = useQuery<GtmSummary>({
    queryKey: ["/api/gtm/summary"],
    queryFn: () => fetchJson<GtmSummary>("/api/gtm/summary"),
  });
  const { data: companies = [] } = useQuery<GtmCompany[]>({
    queryKey: ["/api/gtm/companies", { limit: 8 }],
    queryFn: () => fetchJson<GtmCompany[]>("/api/gtm/companies?limit=8"),
  });
  const { data: activities = [] } = useQuery<GtmActivity[]>({
    queryKey: ["/api/gtm/activities", { limit: 8 }],
    queryFn: () => fetchJson<GtmActivity[]>("/api/gtm/activities?limit=8"),
  });

  const pipelineReady = summary.safety.firstEmailRequiresApproval && summary.safety.suppressionRequiredBeforeSend;

  return (
    <div className="min-h-screen bg-background" data-testid="page-gtm-intelligence">
      <div className="border-b bg-background/95">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Jarvis GTM Command OS
                </Badge>
                <Badge variant={pipelineReady ? "default" : "secondary"} className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Safe MVP
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-normal text-foreground">Universal Credit Hub GTM Intelligence</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                CRM foundation for verified credit-market leads, human-approved outreach, call prep, and sales activity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" disabled>
                <Phone className="h-4 w-4" />
                Call Prep
              </Button>
              <Button className="gap-2" disabled>
                <Mail className="h-4 w-4" />
                Draft Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="GTM summary">
          <StatTile label="Target companies" value={summaryLoading ? "..." : summary.companies} icon={Building2} tone="bg-blue-50 text-blue-700" />
          <StatTile label="Contacts" value={summaryLoading ? "..." : summary.contacts} icon={Users} tone="bg-emerald-50 text-emerald-700" />
          <StatTile label="Campaigns" value={summaryLoading ? "..." : summary.campaigns} icon={Target} tone="bg-violet-50 text-violet-700" />
          <StatTile label="Messages" value={summaryLoading ? "..." : summary.messages} icon={Mail} tone="bg-amber-50 text-amber-700" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Lead Pipeline</CardTitle>
                <Badge variant="outline">{companies.length} visible</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h2 className="mt-3 text-sm font-semibold">No GTM companies yet</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The foundation is ready. Next we add import, verification, and first target accounts.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Company</th>
                        <th className="px-3 py-2 text-left font-medium">Market</th>
                        <th className="px-3 py-2 text-left font-medium">Segment</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Fit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company) => (
                        <tr key={company.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{company.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{company.country || "Unscoped"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{company.segment || company.institutionType || "Unclassified"}</td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary">{company.status.replace(/_/g, " ")}</Badge>
                          </td>
                          <td className="px-3 py-2 text-right">{company.fitScore ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Safety Rails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-medium">Human approval before first outreach</p>
                  <p className="text-muted-foreground">AI drafts stay in review until approved.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-medium">Suppression before send</p>
                  <p className="text-muted-foreground">{summary.suppressions} blocked emails or phones recorded.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Ban className="mt-0.5 h-4 w-4 text-red-600" />
                <div>
                  <p className="font-medium">Autonomous AI calls disabled</p>
                  <p className="text-muted-foreground">MVP starts with call prep and human notes.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Draft</p>
                  <p className="text-lg font-bold">{summary.messageStatus.draft}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="text-lg font-bold">{summary.messageStatus.approved}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <p className="text-lg font-bold">{summary.messageStatus.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Next Build Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "Add CSV lead import with source/provenance checks.",
                "Add contact verification records for email and phone.",
                "Add AI draft queue using local models first.",
                "Add campaign approval workflow before any real sending.",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3" />
                  {summary.activities}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No GTM activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <Badge variant="secondary">{activity.type.replace(/_/g, " ")}</Badge>
                      </div>
                      {activity.body && <p className="mt-1 text-sm text-muted-foreground">{activity.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
