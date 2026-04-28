import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Joyride, STATUS, ACTIONS, type EventData, type Step } from "react-joyride";

type CallBackProps = EventData;

const STORAGE_KEY = "demo_tour_state";

type DemoRole = "secured_creditor" | "registry_authority" | "super_admin";

interface DemoTourState {
  role: DemoRole;
  stage: number;
}

interface TourPage {
  path: string;
  steps: Step[];
}

const baseStep = (extra: Partial<Step> = {}): Partial<Step> => ({
  disableBeacon: true,
  spotlightPadding: 6,
  ...extra,
});

const flows: Record<DemoRole, TourPage[]> = {
  secured_creditor: [
    {
      path: "/dashboard",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Welcome — Secured Creditor demo",
          content:
            "You're signed in as a lender (Test Bank Ltd). This 60-second tour will showcase the credit registry's key capabilities. You can skip at any time.",
          ...baseStep(),
        } as Step,
        {
          target: '[data-testid="text-dashboard-title"]',
          title: "Lender Dashboard",
          content:
            "Your portfolio overview — outstanding loans, exposure, alerts, and key risk indicators across all your borrowers.",
          ...baseStep(),
        } as Step,
        {
          target: "main",
          placement: "center",
          title: "Concentration risk alerts",
          content:
            "Scroll the dashboard and you'll see automatic warnings when your portfolio is over-exposed to a sector, region, or single borrower — all calculated in real time.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Next: Collateral Registry",
          content:
            "Click Continue and we'll head to the Pan-African collateral registry — where you file pledged-asset registrations and search liens against any borrower.",
          ...baseStep(),
        } as Step,
      ],
    },
    {
      path: "/collateral-registry",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Collateral Registry",
          content:
            "This is the PPSR-style Pan-African pledged-asset registry. You can register new collateral, search for existing liens by borrower, and manage discharges — all backed by certificates with QR verification.",
          ...baseStep(),
        } as Step,
        {
          target: "main",
          placement: "center",
          title: "Three actions on this page",
          content:
            "1) Register new collateral against a borrower • 2) Search for existing liens (cross-institution) • 3) Manage your existing filings — including discharge and amendments.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Next: Generate a credit report",
          content:
            "Click Continue and we'll go to the Credit Report Search — where you can generate a full report on any borrower in seconds.",
          ...baseStep(),
        } as Step,
      ],
    },
    {
      path: "/search",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Generate a Credit Report",
          content:
            "Search by national ID, business reg number, or name. The system runs fuzzy entity matching across all data providers and generates a full credit report with score, history, alerts, and AI risk narrative.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "AI Portfolio Intelligence",
          content:
            "Bonus capability — Portfolio Intelligence uses AI to find concentration risks, predict defaults, and recommend portfolio rebalancing across your entire book. Find it in the sidebar after the tour.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Tour complete!",
          content:
            "You've seen the lender highlights: dashboard, collateral registry, credit reports, and AI intelligence. Use the sidebar to explore freely — disputes, batch upload, regulatory exports, and more are all available.",
          ...baseStep(),
        } as Step,
      ],
    },
  ],
  registry_authority: [
    {
      path: "/dashboard",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Welcome — Registry Authority demo",
          content:
            "You're signed in as the Ghana Collateral Registry Authority. Your role is to review and approve filings submitted by lenders. This tour walks you through the approval workflow.",
          ...baseStep(),
        } as Step,
        {
          target: '[data-testid="text-dashboard-title"]',
          title: "Authority dashboard",
          content:
            "Your overview of registry activity — pending filings, approvals, discharges, and audit trail across every secured creditor in your jurisdiction.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Next: Registry Authority Portal",
          content:
            "Click Continue and we'll go to the approval portal where you'll review pending filings.",
          ...baseStep(),
        } as Step,
      ],
    },
    {
      path: "/registry-authority-portal",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Registry Authority Portal",
          content:
            "Every collateral filing in your country flows through here for review. You can approve, reject with reason, or request more information — and your decision is permanently recorded with a tamper-evident audit log.",
          ...baseStep(),
        } as Step,
        {
          target: "main",
          placement: "center",
          title: "Pending filings queue",
          content:
            "Filings appear here automatically when lenders submit them. Click any row to see borrower details, asset description, supporting documents, and act on the request.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Tamper-evident audit trail",
          content:
            "Every decision you make is anchored to an immutable audit trail with blockchain-style verification — supporting regulatory inspections and dispute resolution. Find it in the sidebar.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Tour complete!",
          content:
            "You've seen the registry authority workflow. Explore the sidebar for regulatory dashboards, compliance tools, and cross-border agreements.",
          ...baseStep(),
        } as Step,
      ],
    },
  ],
  super_admin: [
    {
      path: "/command-center",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Welcome — Super Admin demo",
          content:
            "You're signed in as the platform operator. The Command Center gives you a god's-eye view of every institution, deployment, revenue stream, and system health metric across the platform.",
          ...baseStep(),
        } as Step,
        {
          target: "main",
          placement: "center",
          title: "Command Center",
          content:
            "Manage client deployments, monitor revenue and billing, track system health, and review configuration changes — all from one console.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Multi-tenant organizations",
          content:
            "Every lender, regulator, and partner is a separate tenant with isolated data, custom branding, and per-org billing. Click Continue and we'll see them.",
          ...baseStep(),
        } as Step,
      ],
    },
    {
      path: "/organizations",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Organizations",
          content:
            "Every institution on the platform — banks, microfinance, telcos, regulators. You can onboard new ones, review usage, configure white-label branding, and set their fee schedule from here.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Next: Platform Metrics",
          content:
            "Real-time platform telemetry: active users, API calls, queries per second, revenue, and error rates. Click Continue to see it.",
          ...baseStep(),
        } as Step,
      ],
    },
    {
      path: "/platform-metrics",
      steps: [
        {
          target: "body",
          placement: "center",
          title: "Platform Metrics",
          content:
            "Live telemetry across the entire platform — usage, revenue, performance, and reliability metrics that update in real time.",
          ...baseStep(),
        } as Step,
        {
          target: "body",
          placement: "center",
          title: "Tour complete!",
          content:
            "You've seen the operator highlights. Use the sidebar to explore audit trails, regulatory tools, billing, AI intelligence, and the dozens of other capabilities of the platform.",
          ...baseStep(),
        } as Step,
      ],
    },
  ],
};

function readState(): DemoTourState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoTourState;
  } catch {
    return null;
  }
}

function writeState(s: DemoTourState | null) {
  if (!s) sessionStorage.removeItem(STORAGE_KEY);
  else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function startDemoTour(role: DemoRole) {
  writeState({ role, stage: 0 });
}

export function DemoTour() {
  const [location, setLocation] = useLocation();
  const [state, setState] = useState<DemoTourState | null>(() => readState());
  const [run, setRun] = useState(false);
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);

  const stopTour = useCallback(() => {
    writeState(null);
    setState(null);
    setRun(false);
    setActiveSteps([]);
  }, []);

  const advanceStage = useCallback(() => {
    if (!state) {
      setRun(false);
      return;
    }
    const flow = flows[state.role];
    const nextStage = state.stage + 1;
    if (nextStage >= flow.length) {
      stopTour();
    } else {
      setRun(false);
      const ns: DemoTourState = { role: state.role, stage: nextStage };
      writeState(ns);
      setState(ns);
      setLocation(flow[nextStage].path);
    }
  }, [state, setLocation, stopTour]);

  useEffect(() => {
    if (!state) {
      setRun(false);
      setActiveSteps([]);
      return;
    }
    const flow = flows[state.role];
    if (!flow || !flow[state.stage]) {
      stopTour();
      return;
    }
    const stage = flow[state.stage];
    if (location !== stage.path) {
      setRun(false);
      return;
    }
    setActiveSteps(stage.steps);
    const t = setTimeout(() => setRun(true), 700);
    return () => clearTimeout(t);
  }, [state, location, stopTour]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action } = data;

    if (status === STATUS.SKIPPED) {
      stopTour();
      return;
    }

    if (status === STATUS.FINISHED) {
      advanceStage();
      return;
    }

    if (action === ACTIONS.CLOSE) {
      stopTour();
    }
  };

  if (!state || activeSteps.length === 0) return null;

  return (
    <Joyride
      key={`${state.role}-${state.stage}`}
      steps={activeSteps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      hideCloseButton={false}
      scrollToFirstStep
      disableScrollParentFix
      onEvent={handleCallback}
      locale={{
        back: "Back",
        close: "Close",
        last: "Continue →",
        next: "Next",
        skip: "Skip tour",
      }}
      styles={{
        options: {
          primaryColor: "hsl(215, 55%, 50%)",
          zIndex: 10000,
          textColor: "hsl(215, 30%, 18%)",
          arrowColor: "#ffffff",
          backgroundColor: "#ffffff",
          overlayColor: "rgba(15, 23, 42, 0.55)",
        },
        tooltip: {
          borderRadius: 14,
          padding: 18,
          fontSize: 14,
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 6,
        },
        buttonNext: {
          borderRadius: 10,
          padding: "8px 14px",
          fontWeight: 600,
        },
        buttonBack: {
          color: "hsl(215, 20%, 45%)",
        },
        buttonSkip: {
          color: "hsl(215, 15%, 50%)",
        },
      }}
    />
  );
}
