import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Sparkles, Star, Zap, Globe, FileText,
  Anchor, Lock, Award, Building2, Car, Tractor,
  Package, Landmark, Plane, Scale,
} from "lucide-react";

const COUNTRY_FLAGS = ["🇬🇭", "🇳🇬", "🇰🇪", "🇿🇦", "🇪🇬", "🇲🇦", "🇨🇮", "🇸🇳", "🇨🇲", "🇪🇹", "🇹🇿", "🇺🇬", "🇷🇼", "🇩🇿", "🇸🇱", "🇧🇫"];

const LEGAL_REGIMES = [
  { code: "OHADA", name: "OHADA Uniform Act" },
  { code: "UCC-9", name: "UCC Article 9 inspired" },
  { code: "Common Law", name: "Common Law" },
  { code: "Civil Law", name: "Civil Law" },
];

const LIVE_REGISTRATIONS = [
  { country: "🇬🇭", asset: "Real Estate", icon: Building2, subject: "Apartment · East Legon", amount: "₵850,000", color: "amber" },
  { country: "🇳🇬", asset: "Vehicle", icon: Car, subject: "Toyota Hilux · Lagos", amount: "₦18.5M", color: "orange" },
  { country: "🇨🇮", asset: "Equipment", icon: Package, subject: "CNC Machine · Abidjan", amount: "₣32M", color: "amber" },
  { country: "🇰🇪", asset: "Livestock", icon: Tractor, subject: "Dairy Herd · Nakuru", amount: "KSh 4.2M", color: "emerald" },
  { country: "🇿🇦", asset: "Inventory", icon: Package, subject: "Stock · Cape Town", amount: "R 2.1M", color: "blue" },
  { country: "🇪🇬", asset: "Real Estate", icon: Landmark, subject: "Warehouse · Cairo", amount: "E£4.8M", color: "amber" },
  { country: "🇲🇦", asset: "Aircraft", icon: Plane, subject: "Cessna 172 · Casablanca", amount: "$420K", color: "violet" },
  { country: "🇸🇳", asset: "Crops", icon: Tractor, subject: "Cocoa harvest · Ziguinchor", amount: "₣8.2M", color: "emerald" },
  { country: "🇨🇲", asset: "Vehicle", icon: Car, subject: "Truck fleet · Douala", amount: "₣45M", color: "orange" },
  { country: "🇹🇿", asset: "Equipment", icon: Package, subject: "Mining drill · Mwanza", amount: "$180K", color: "amber" },
  { country: "🇷🇼", asset: "Real Estate", icon: Building2, subject: "Office · Kigali", amount: "RWF 320M", color: "amber" },
  { country: "🇧🇫", asset: "Securities", icon: Scale, subject: "Bond pool · Ouaga", amount: "₣12M", color: "violet" },
];

const ASSET_CLASSES = [
  { id: "real_estate", label: "Real Estate", icon: Building2, share: 38, color: "from-amber-500 to-orange-600" },
  { id: "vehicle", label: "Vehicles", icon: Car, share: 22, color: "from-orange-500 to-red-600" },
  { id: "equipment", label: "Equipment", icon: Package, share: 14, color: "from-yellow-500 to-amber-600" },
  { id: "agriculture", label: "Agri & Livestock", icon: Tractor, share: 11, color: "from-emerald-500 to-teal-600" },
  { id: "other", label: "Other", icon: Scale, share: 15, color: "from-slate-400 to-slate-600" },
];

function useCountUp(target: number, durationMs = 2000) {
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
      setValue((v) => v + perSecondMin + Math.random() * (perSecondMax - perSecondMin));
    }, 1000);
    return () => clearInterval(id);
  }, [perSecondMin, perSecondMax]);
  return Math.floor(value);
}

export function CollateralInvestorHero() {
  const { t } = useTranslation();
  const totalValueUSD = 2_437_000_000;
  const animatedValue = useCountUp(totalValueUSD, 2400);
  const liveCertificates = useTickingCounter(48_217, 0.4, 1.8);
  const activeLiens = useTickingCounter(312_840, 0.2, 0.9);

  const formatBigUSD = (n: number) => {
    if (n >= 1_000_000_000) return "$" + (n / 1_000_000_000).toFixed(2) + "B";
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
    return "$" + n.toString();
  };

  return (
    <div className="space-y-4 mb-6" data-testid="collateral-investor-hero">
      <style>{`
        @keyframes coll-glow { 0%,100% { box-shadow: 0 0 60px 0 rgba(251,146,60,0.40), 0 0 120px 0 rgba(217,119,6,0.20) inset; } 50% { box-shadow: 0 0 90px 6px rgba(251,146,60,0.60), 0 0 160px 0 rgba(217,119,6,0.30) inset; } }
        @keyframes coll-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes coll-float { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(-6deg); } }
        @keyframes coll-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes coll-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .coll-hero-glow { animation: coll-glow 4.5s ease-in-out infinite; }
        .coll-shimmer-overlay { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .coll-shimmer-overlay::after { content: ""; position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent); animation: coll-shimmer 4s ease-in-out infinite; }
        .coll-float-icon { animation: coll-float 5.2s ease-in-out infinite; }
        .coll-pulse-soft { animation: coll-pulse 2.5s ease-in-out infinite; }
        .coll-marquee { animation: coll-marquee 44s linear infinite; }
        .coll-marquee:hover, .coll-marquee:focus-within { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .coll-hero-glow, .coll-shimmer-overlay::after, .coll-float-icon, .coll-pulse-soft, .coll-marquee { animation: none !important; }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-3xl coll-hero-glow" data-testid="card-collateral-hero">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-orange-950 to-amber-900" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 25%, rgba(251,146,60,0.5), transparent 45%), radial-gradient(circle at 80% 75%, rgba(217,119,6,0.5), transparent 45%), radial-gradient(circle at 50% 100%, rgba(245,158,11,0.3), transparent 50%)" }} />
        <div className="coll-shimmer-overlay" />

        <div className="absolute top-6 left-8 coll-float-icon opacity-50" aria-hidden="true">
          <ShieldCheck className="w-8 h-8 text-amber-300" />
        </div>
        <div className="absolute top-12 right-12 coll-float-icon opacity-40" style={{ animationDelay: "1.4s" }} aria-hidden="true">
          <Anchor className="w-6 h-6 text-orange-300" />
        </div>
        <div className="absolute bottom-8 left-16 coll-float-icon opacity-40" style={{ animationDelay: "2.1s" }} aria-hidden="true">
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </div>
        <div className="absolute bottom-12 right-20 coll-float-icon opacity-50" style={{ animationDelay: "0.6s" }} aria-hidden="true">
          <Star className="w-6 h-6 text-amber-200" fill="currentColor" />
        </div>

        <div className="relative px-6 py-10 md:px-10 md:py-12 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 coll-pulse-soft" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-amber-200/90" data-testid="text-collateral-hero-eyebrow">
              {t("collateralHero.eyebrow", "Pan-African Collateral Registry")}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-orange-100 bg-clip-text text-transparent leading-tight mb-2" data-testid="text-collateral-hero-title">
            {t("collateralHero.title", "Real assets, secured across borders")}
          </h1>

          <p className="text-sm md:text-base text-amber-100/85 max-w-2xl mb-6" data-testid="text-collateral-hero-subtitle">
            {t("collateralHero.subtitle", "One pan-African register for every pledged asset — vehicles, real estate, equipment, livestock, securities. Tamper-evident certificates, PMSI super-priority, and instant cross-institution lien search.")}
          </p>

          <div className="mb-6 inline-flex flex-col">
            <div className="text-[10px] uppercase tracking-[0.25em] font-semibold text-amber-200/70 mb-1">{t("collateralHero.totalValueLabel", "Total value secured")}</div>
            <div className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent leading-none tabular-nums drop-shadow" data-testid="text-collateral-total-value">
              {formatBigUSD(animatedValue)}
            </div>
            <div className="text-xs text-amber-100/70 mt-1">USD equivalent · across 54 jurisdictions</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-active-liens">
              <div className="flex items-center gap-1.5 text-amber-200/80 mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("collateralHero.kpiLiens", "Active liens")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">{activeLiens.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-300 mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block coll-pulse-soft" />Live ticking</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-certificates">
              <div className="flex items-center gap-1.5 text-amber-200/80 mb-1.5">
                <Award className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("collateralHero.kpiCertificates", "Certificates issued")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">{liveCertificates.toLocaleString()}</div>
              <div className="text-[10px] text-amber-100 mt-0.5">tamper-evident · QR-verifiable</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-pmsi">
              <div className="flex items-center gap-1.5 text-amber-200/80 mb-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("collateralHero.kpiPmsi", "PMSI super-priority")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">14,820</div>
              <div className="text-[10px] text-amber-100 mt-0.5">purchase-money interests</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4" data-testid="kpi-search-latency">
              <div className="flex items-center gap-1.5 text-amber-200/80 mb-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("collateralHero.kpiSearch", "Lien search latency")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black tabular-nums">180<span className="text-sm">ms</span></div>
              <div className="text-[10px] text-amber-100 mt-0.5">p95 cross-institution</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {LEGAL_REGIMES.map((r) => (
              <Badge key={r.code} variant="outline" className="text-[10px] bg-white/10 border-white/20 text-white backdrop-blur" data-testid={`badge-regime-${r.code}`}>
                <Scale className="w-2.5 h-2.5 mr-1" />{r.code}
              </Badge>
            ))}
            <Badge variant="outline" className="text-[10px] bg-emerald-500/20 border-emerald-300/40 text-emerald-100 backdrop-blur" data-testid="badge-blockchain">
              <Anchor className="w-2.5 h-2.5 mr-1" />Blockchain-anchored
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-amber-500/20 border-amber-300/40 text-amber-100 backdrop-blur" data-testid="badge-tamper">
              <Lock className="w-2.5 h-2.5 mr-1" />Tamper-evident
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-amber-950/30" data-testid="card-collateral-ticker">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block coll-pulse-soft" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200">{t("collateralHero.tickerLabel", "Live registrations across the network")}</span>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] border-slate-300 dark:border-slate-700">
            <FileText className="w-2.5 h-2.5 mr-1" />Streaming
          </Badge>
        </div>
        <div className="overflow-hidden py-2.5">
          <div className="flex gap-2 coll-marquee w-max" data-testid="container-collateral-ticker">
            {[...LIVE_REGISTRATIONS, ...LIVE_REGISTRATIONS].map((r, i) => {
              const Icon = r.icon;
              const colorMap: Record<string, string> = {
                emerald: "border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200",
                blue: "border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200",
                violet: "border-violet-300 dark:border-violet-700 bg-violet-50/80 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200",
                amber: "border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200",
                orange: "border-orange-300 dark:border-orange-700 bg-orange-50/80 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200",
              };
              return (
                <div key={i} className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorMap[r.color]} text-xs font-medium`}>
                  <span className="text-base leading-none">{r.country}</span>
                  <Icon className="w-3 h-3" />
                  <span className="font-semibold">{r.asset}</span>
                  <span className="opacity-70">·</span>
                  <span className="opacity-80">{r.subject}</span>
                  <span className="opacity-70">·</span>
                  <span className="font-mono font-bold">{r.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4" data-testid="card-asset-mix">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{t("collateralHero.assetMixTitle", "Asset class mix")}</h3>
          </div>
          <div className="space-y-2">
            {ASSET_CLASSES.map((cls) => {
              const Icon = cls.icon;
              return (
                <div key={cls.id} className="flex items-center gap-3" data-testid={`asset-class-${cls.id}`}>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cls.color} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{cls.label}</span>
                      <span className="text-muted-foreground tabular-nums">{cls.share}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${cls.color}`} style={{ width: `${cls.share}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4" data-testid="card-trust-signals">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{t("collateralHero.trustTitle", "Trust & coverage")}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums">54</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">jurisdictions</div>
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">99.97%</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">registry uptime</div>
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-blue-200/60 dark:border-blue-900/40">
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300 tabular-nums">0</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">data breaches</div>
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30 border border-violet-200/60 dark:border-violet-900/40">
              <div className="text-2xl font-black text-violet-700 dark:text-violet-300 tabular-nums">&lt; 24h</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">dispute resolution SLA</div>
            </div>
          </div>
          <div className="mt-2.5 text-base text-center" data-testid="text-coverage-flags">
            {COUNTRY_FLAGS.slice(0, 12).join(" ")}
            <span className="text-xs text-muted-foreground ml-1.5">+ 42 more</span>
          </div>
        </div>
      </div>
    </div>
  );
}
