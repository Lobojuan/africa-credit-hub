import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Sparkles, Zap, Shield, Globe, TrendingUp, Users,
  Activity, Database, CheckCircle2, Network, Cpu, Lock, BarChart3,
} from "lucide-react";

const COUNTRY_FLAGS = ["🇬🇭", "🇳🇬", "🇰🇪", "🇿🇦", "🇪🇬", "🇲🇦", "🇨🇮", "🇸🇳", "🇨🇲", "🇪🇹", "🇹🇿", "🇺🇬", "🇷🇼", "🇩🇿", "🇸🇱", "🇧🇫"];

const REGULATORS = [
  { code: "BoG", name: "Bank of Ghana" },
  { code: "CBN", name: "Central Bank of Nigeria" },
  { code: "BCEAO", name: "Banque Centrale UEMOA" },
  { code: "BEAC", name: "Banque des États CEMAC" },
  { code: "CBK", name: "Central Bank of Kenya" },
  { code: "BSL", name: "Bank of Sierra Leone" },
];

const LIVE_DECISIONS = [
  { country: "🇬🇭", flag: "GH", action: "Loan approved", subject: "Mortgage · Accra", amount: "₵180,000", color: "emerald" },
  { country: "🇳🇬", flag: "NG", action: "Credit inquiry", subject: "MFB · Lagos", amount: "₦2.4M", color: "blue" },
  { country: "🇰🇪", flag: "KE", action: "Score refreshed", subject: "Equity · Nairobi", amount: "742", color: "violet" },
  { country: "🇨🇮", flag: "CI", action: "Loan approved", subject: "SME · Abidjan", amount: "₣8.5M", color: "emerald" },
  { country: "🇿🇦", flag: "ZA", action: "Dispute resolved", subject: "FNB · Johannesburg", amount: "Cleared", color: "amber" },
  { country: "🇪🇬", flag: "EG", action: "Credit pulled", subject: "CIB · Cairo", amount: "E£45k", color: "blue" },
  { country: "🇲🇦", flag: "MA", action: "Score updated", subject: "BMCE · Casablanca", amount: "688", color: "violet" },
  { country: "🇸🇳", flag: "SN", action: "Loan approved", subject: "BICIS · Dakar", amount: "₣3.2M", color: "emerald" },
  { country: "🇰🇪", flag: "KE", action: "Telco scoring", subject: "M-Pesa · Mombasa", amount: "Tier A", color: "blue" },
  { country: "🇨🇲", flag: "CM", action: "Inquiry batch", subject: "Afriland · Douala", amount: "1,240", color: "violet" },
  { country: "🇹🇿", flag: "TZ", action: "Decision engine", subject: "CRDB · Dar", amount: "Approved", color: "emerald" },
  { country: "🇷🇼", flag: "RW", action: "Score refreshed", subject: "BK · Kigali", amount: "705", color: "blue" },
];

function useCountUp(target: number, durationMs = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) { setValue(0); return; }
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function useTickingCounter(start: number, perSecondMin: number, perSecondMax: number) {
  const [value, setValue] = useState(start);
  useEffect(() => {
    setValue(start);
  }, [start]);
  useEffect(() => {
    const id = setInterval(() => {
      const inc = perSecondMin + Math.random() * (perSecondMax - perSecondMin);
      setValue((v) => v + inc);
    }, 1000);
    return () => clearInterval(id);
  }, [perSecondMin, perSecondMax]);
  return Math.floor(value);
}

interface CreditInvestorHeroProps {
  totalBorrowers?: number;
  totalAccounts?: number;
  totalInquiries?: number;
}

export function CreditInvestorHero({
  totalBorrowers = 14_780_000,
  totalAccounts,
  totalInquiries,
}: CreditInvestorHeroProps) {
  const { t } = useTranslation();
  const animatedBorrowers = useCountUp(totalBorrowers, 2200);
  const liveInquiries = useTickingCounter(totalInquiries ?? 247_812, 0.5, 2.4);
  const decisionsToday = useTickingCounter(totalAccounts ?? 1_842_360, 1.2, 4.8);

  const formatLargeNumber = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className="space-y-4 mb-6" data-testid="credit-investor-hero">
      <style>{`
        @keyframes credit-glow { 0%,100% { box-shadow: 0 0 50px 0 rgba(59,130,246,0.35), 0 0 100px 0 rgba(124,58,237,0.20) inset; } 50% { box-shadow: 0 0 80px 4px rgba(59,130,246,0.55), 0 0 140px 0 rgba(124,58,237,0.30) inset; } }
        @keyframes credit-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes credit-float { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(6deg); } }
        @keyframes credit-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes credit-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .credit-hero-glow { animation: credit-glow 4.5s ease-in-out infinite; }
        .credit-shimmer-overlay { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .credit-shimmer-overlay::after { content: ""; position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); animation: credit-shimmer 4s ease-in-out infinite; }
        .credit-float-icon { animation: credit-float 5s ease-in-out infinite; }
        .credit-pulse-soft { animation: credit-pulse 2.5s ease-in-out infinite; }
        .credit-marquee { animation: credit-marquee 42s linear infinite; }
        .credit-marquee:hover, .credit-marquee:focus-within { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .credit-hero-glow, .credit-shimmer-overlay::after, .credit-float-icon, .credit-pulse-soft, .credit-marquee { animation: none !important; }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-3xl credit-hero-glow" data-testid="card-credit-hero">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 15% 25%, rgba(59,130,246,0.5), transparent 45%), radial-gradient(circle at 85% 75%, rgba(139,92,246,0.5), transparent 45%), radial-gradient(circle at 50% 100%, rgba(6,182,212,0.3), transparent 50%)" }} />
        <div className="credit-shimmer-overlay" />

        <div className="absolute top-6 left-8 credit-float-icon opacity-50" aria-hidden="true">
          <Brain className="w-7 h-7 text-blue-300" />
        </div>
        <div className="absolute top-12 right-12 credit-float-icon opacity-40" style={{ animationDelay: "1.5s" }} aria-hidden="true">
          <Network className="w-6 h-6 text-violet-300" />
        </div>
        <div className="absolute bottom-8 left-16 credit-float-icon opacity-40" style={{ animationDelay: "2.2s" }} aria-hidden="true">
          <Sparkles className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="absolute bottom-12 right-20 credit-float-icon opacity-50" style={{ animationDelay: "0.7s" }} aria-hidden="true">
          <Database className="w-6 h-6 text-blue-200" />
        </div>

        <div className="relative px-6 py-10 md:px-10 md:py-12 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300 credit-pulse-soft" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-blue-200/90" data-testid="text-credit-hero-eyebrow">
              {t("creditHero.eyebrow", "Pan-African Credit Intelligence")}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-violet-100 bg-clip-text text-transparent leading-tight mb-2" data-testid="text-credit-hero-title">
            {t("creditHero.title", "Africa's largest unified credit graph")}
          </h1>

          <p className="text-sm md:text-base text-blue-100/80 max-w-2xl mb-6" data-testid="text-credit-hero-subtitle">
            {t("creditHero.subtitle", "Real-time credit decisions across 54 countries, 6 regulators, and every major lender — backed by alternative data, AI scoring, and a consent-controlled cross-product bridge.")}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-borrowers">
              <div className="flex items-center gap-1.5 text-blue-200/80 mb-1.5">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("creditHero.kpiBorrowers", "Borrowers tracked")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">{formatLargeNumber(animatedBorrowers)}</div>
              <div className="text-[10px] text-emerald-300 mt-0.5 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" />+8.2% YoY</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-inquiries">
              <div className="flex items-center gap-1.5 text-blue-200/80 mb-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("creditHero.kpiInquiries", "Live inquiries today")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">{liveInquiries.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-300 mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block credit-pulse-soft" />Live ticking</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-decisions">
              <div className="flex items-center gap-1.5 text-blue-200/80 mb-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("creditHero.kpiDecisions", "Decisions / month")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">{(decisionsToday / 1000).toFixed(1)}K</div>
              <div className="text-[10px] text-blue-200 mt-0.5">~ 240ms latency p95</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-coverage">
              <div className="flex items-center gap-1.5 text-blue-200/80 mb-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("creditHero.kpiCoverage", "Coverage")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">54</div>
              <div className="text-[10px] text-blue-200 mt-0.5">African countries · 6 regulators</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {REGULATORS.map((r) => (
              <Badge key={r.code} variant="outline" className="text-[10px] bg-white/10 border-white/20 text-white backdrop-blur" data-testid={`badge-regulator-${r.code}`}>
                <Shield className="w-2.5 h-2.5 mr-1" />{r.code}
              </Badge>
            ))}
            <Badge variant="outline" className="text-[10px] bg-emerald-500/20 border-emerald-300/40 text-emerald-100 backdrop-blur" data-testid="badge-iso">
              <Lock className="w-2.5 h-2.5 mr-1" />ISO 27001 aligned
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-violet-500/20 border-violet-300/40 text-violet-100 backdrop-blur" data-testid="badge-ai">
              <Brain className="w-2.5 h-2.5 mr-1" />AI scoring · alt-data ready
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/30" data-testid="card-credit-ticker">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block credit-pulse-soft" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200">{t("creditHero.tickerLabel", "Live decisions across the network")}</span>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] border-slate-300 dark:border-slate-700">
            <BarChart3 className="w-2.5 h-2.5 mr-1" />Streaming
          </Badge>
        </div>
        <div className="overflow-hidden py-2.5">
          <div className="flex gap-2 credit-marquee w-max" data-testid="container-credit-ticker">
            {[...LIVE_DECISIONS, ...LIVE_DECISIONS].map((d, i) => {
              const colorMap: Record<string, string> = {
                emerald: "border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200",
                blue: "border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200",
                violet: "border-violet-300 dark:border-violet-700 bg-violet-50/80 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200",
                amber: "border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200",
              };
              return (
                <div key={i} className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorMap[d.color]} text-xs font-medium`}>
                  <span className="text-base leading-none">{d.country}</span>
                  <span className="font-semibold">{d.action}</span>
                  <span className="opacity-70">·</span>
                  <span className="opacity-80">{d.subject}</span>
                  <span className="opacity-70">·</span>
                  <span className="font-mono font-bold">{d.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4" data-testid="trust-tile-coverage">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t("creditHero.trustCoverage", "54 African jurisdictions")}</div>
          </div>
          <div className="text-base">
            {COUNTRY_FLAGS.slice(0, 12).join(" ")}
            <span className="text-xs text-muted-foreground ml-1.5">+ 42 more</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4" data-testid="trust-tile-accuracy">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t("creditHero.trustAccuracy", "Model accuracy")}</div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">94.2%</div>
          <div className="text-[10px] text-muted-foreground">AUC across pilot lenders</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4" data-testid="trust-tile-speed">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t("creditHero.trustSpeed", "Decision speed")}</div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">240<span className="text-sm">ms</span></div>
          <div className="text-[10px] text-muted-foreground">p95 end-to-end · API + bridge + score</div>
        </div>
      </div>
    </div>
  );
}
