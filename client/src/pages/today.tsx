import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  AlertTriangle,
  BellRing,
  ClipboardCheck,
  FileCheck2,
  Landmark,
  LayoutGrid,
  LineChart,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import type { WorkspaceId } from "@/lib/workspaces";

type Action = {
  title: string;
  description: string;
  href: string;
  icon: typeof LineChart;
};

type RoleHome = {
  eyebrow: string;
  title: string;
  description: string;
  actions: Action[];
};

const lenderHome: RoleHome = {
  eyebrow: "Credit operations",
  title: "Focus on the portfolio decisions that need you today.",
  description: "Monitor risk, complete lending work, and move overdue cases forward without hunting through the platform.",
  actions: [
    { title: "NPL early warning", description: "Assign repayment-stress signals before they become losses.", href: "/npl-early-warning", icon: AlertTriangle },
    { title: "Credit accounts", description: "Review facilities, repayment status, and borrower exposure.", href: "/credit-accounts", icon: Landmark },
    { title: "Collections", description: "Prioritise overdue cases and recovery assignments.", href: "/collections", icon: ClipboardCheck },
  ],
};

const regulatorHome: RoleHome = {
  eyebrow: "Regulatory oversight",
  title: "See the exceptions and evidence that require oversight.",
  description: "Start with institution performance, data quality, and compliance evidence—not a long module list.",
  actions: [
    { title: "Regulatory dashboard", description: "Monitor system-wide exposure, NPLs, and reporting quality.", href: "/regulatory-dashboard", icon: LineChart },
    { title: "Compliance evidence", description: "Review submissions, controls, and regulatory exceptions.", href: "/regulatory-compliance", icon: FileCheck2 },
    { title: "Audit trail", description: "Trace privileged activity and approval history.", href: "/audit", icon: ShieldCheck },
  ],
};

const operatorHome: RoleHome = {
  eyebrow: "Operations control",
  title: "Run today’s approvals, risks, and operational priorities.",
  description: "Use this as your operating desk; specialist tools remain available when you need them.",
  actions: [
    { title: "Pending approvals", description: "Resolve maker-checker decisions and unblock controlled work.", href: "/approvals", icon: ClipboardCheck },
    { title: "Portfolio intelligence", description: "Find deteriorating risk before it turns into loss.", href: "/portfolio-intelligence", icon: LineChart },
    { title: "Borrower alerts", description: "Review data and risk alerts requiring follow-up.", href: "/borrower-alerts", icon: BellRing },
  ],
};

const fiscalHome: RoleHome = {
  eyebrow: "Fiscal intelligence",
  title: "Start with fiscal activity that needs review.",
  description: "Keep receipt intelligence, tax visibility, and operational administration in one focused workspace.",
  actions: [
    { title: "Loto Fiscal", description: "Open the verified receipt and credit-building workspace.", href: "/loto-fiscal", icon: Landmark },
    { title: "Fiscal administration", description: "Review the fiscal dashboard and operational controls.", href: "/admin/loto-fiscal", icon: ShieldCheck },
    { title: "Pending requests", description: "Resolve cross-workspace requests and approvals.", href: "/pending-approvals", icon: ClipboardCheck },
  ],
};

const consumerHome: RoleHome = {
  eyebrow: "My credit",
  title: "Manage and understand your credit profile.",
  description: "View your credit information, manage permissions, and get help in one place.",
  actions: [
    { title: "My credit profile", description: "Open your consumer portal and credit information.", href: "/my-credit", icon: Users },
    { title: "Consent and sharing", description: "Review who may use your data and why.", href: "/data-sharing", icon: ShieldCheck },
    { title: "Get help", description: "Raise or follow up on a support request.", href: "/helpdesk", icon: ClipboardCheck },
  ],
};

function homeForRole(role?: string): RoleHome {
  if (role === "regulator") return regulatorHome;
  if (["dgi_officer", "tax_auditor", "tax_authority_admin"].includes(role || "")) return fiscalHome;
  if (role === "consumer") return consumerHome;
  if (["lender", "loan_officer", "underwriter", "viewer"].includes(role || "")) return lenderHome;
  return operatorHome;
}

export default function TodayPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { setWorkspace } = useActiveWorkspace();
  const home = useMemo(() => homeForRole(user?.role), [user?.role]);

  useEffect(() => {
    document.title = `Today — ${PLATFORM_COMPANY_NAME}`;
  }, []);

  // The Today page has no workspace path prefix. Preserve a restricted user's
  // sole permitted context so the sidebar and its links never default to a
  // workspace they cannot use after sign-in.
  useEffect(() => {
    const allowed = (user as any)?.allowedProducts as string[] | null | undefined;
    if (!allowed || allowed.length !== 1) return;
    const onlyWorkspace = allowed[0];
    if (["credit", "collateral", "loto"].includes(onlyWorkspace)) {
      setWorkspace(onlyWorkspace as WorkspaceId);
    }
  }, [user]); // setWorkspace is intentionally event-backed and stable in effect.

  return (
    <main className="max-w-6xl mx-auto w-full px-4 md:px-8 py-8 md:py-12" data-testid="today-command-centre">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary" data-testid="text-today-eyebrow">{home.eyebrow}</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-today-title">
            {user?.fullName ? `${user.fullName.split(" ")[0]}, ` : ""}{home.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed" data-testid="text-today-description">{home.description}</p>
        </div>
        <Button variant="outline" className="gap-2 self-start md:self-auto" onClick={() => navigate("/choose-workspace")} data-testid="button-change-workspace">
          <LayoutGrid className="w-4 h-4" />
          Change workspace
        </Button>
      </div>

      <section className="mt-8" aria-labelledby="today-actions-heading">
        <h2 id="today-actions-heading" className="sr-only">Today&apos;s priority actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {home.actions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.href} className="group border-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <CardTitle className="pt-4 text-lg">{action.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={action.href}>
                    <Button variant="ghost" className="px-0 h-auto font-semibold hover:bg-transparent" data-testid={`link-today-${action.href.slice(1).replaceAll("/", "-")}`}>
                      Open {action.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-xl border bg-muted/30 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-testid="today-all-tools">
        <div>
          <h2 className="font-semibold">Need something else?</h2>
          <p className="text-sm text-muted-foreground">Specialist tools are grouped by workspace so the everyday view stays focused.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/choose-workspace")} data-testid="button-browse-workspaces">Browse workspaces</Button>
      </section>
    </main>
  );
}
