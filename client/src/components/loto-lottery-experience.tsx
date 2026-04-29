import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Trophy, Crown, Sparkles, Star, Zap, Flame, Calendar, Clock,
  Users, Coins, Gift, Award, Target, Rocket, MapPin, ScanLine,
  CheckCircle2, Lock, TrendingUp, Ticket, PartyPopper, Medal, QrCode, Loader2,
  PlayCircle,
} from "lucide-react";
import { LotoPosAnimation, type PosAnimationReceipt } from "./loto-pos-animation";

const SEED_NAMES = [
  { first: "Aïssata", last: "Koné", city: "Abidjan" },
  { first: "Mamadou", last: "Diallo", city: "Bouaké" },
  { first: "Fatoumata", last: "Bamba", city: "Yamoussoukro" },
  { first: "Issouf", last: "Traoré", city: "San-Pédro" },
  { first: "Aminata", last: "Touré", city: "Korhogo" },
  { first: "Kouadio", last: "N'Guessan", city: "Daloa" },
  { first: "Bintou", last: "Coulibaly", city: "Abidjan" },
  { first: "Oumar", last: "Cissé", city: "Man" },
  { first: "Salimata", last: "Doumbia", city: "Gagnoa" },
  { first: "Adama", last: "Soumahoro", city: "Anyama" },
  { first: "Korotoumou", last: "Kouassi", city: "Bingerville" },
  { first: "Yacouba", last: "Sanogo", city: "Divo" },
  { first: "Mariam", last: "Ouattara", city: "Abidjan" },
  { first: "Seydou", last: "Bakayoko", city: "Soubré" },
  { first: "Awa", last: "Fofana", city: "Bouaké" },
];

const PRIZE_TIERS = [
  { id: "grand", label: "Grand Prize", amount: 25_000_000, winners: 1, odds: "1 in 5,000,000", icon: Crown, gradient: "from-amber-500 via-yellow-500 to-orange-500", glow: "shadow-amber-500/40" },
  { id: "gold", label: "Gold Prize", amount: 5_000_000, winners: 5, odds: "1 in 1,000,000", icon: Trophy, gradient: "from-yellow-400 via-amber-400 to-yellow-500", glow: "shadow-yellow-500/40" },
  { id: "silver", label: "Silver Prize", amount: 500_000, winners: 50, odds: "1 in 100,000", icon: Medal, gradient: "from-slate-300 via-zinc-300 to-slate-400", glow: "shadow-slate-400/30" },
  { id: "bronze", label: "Bronze Prize", amount: 50_000, winners: 500, odds: "1 in 10,000", icon: Award, gradient: "from-orange-400 via-amber-600 to-orange-600", glow: "shadow-orange-500/30" },
  { id: "daily", label: "Daily Win", amount: 5_000, winners: 5_000, odds: "1 in 1,000", icon: Gift, gradient: "from-emerald-400 via-teal-500 to-emerald-600", glow: "shadow-emerald-500/30" },
];

const ACHIEVEMENTS = [
  { id: "first_scan", label: "First Scan", desc: "Scan your first receipt", threshold: 1, icon: ScanLine, color: "emerald" },
  { id: "ten_tickets", label: "Lucky Ten", desc: "Hold 10 lottery tickets", threshold: 10, icon: Ticket, color: "blue" },
  { id: "fifty_tickets", label: "Half-Century", desc: "Reach 50 tickets in one draw", threshold: 50, icon: Star, color: "violet" },
  { id: "hundred_tickets", label: "Centurion", desc: "Hold 100 tickets — top 10% of citizens", threshold: 100, icon: Trophy, color: "amber" },
  { id: "streak_master", label: "Streak Master", desc: "Active 3 months in a row", threshold: 3, icon: Flame, color: "orange", thresholdField: "months" },
  { id: "tax_hero", label: "Tax Hero", desc: "Mobilise 1M FCFA in VAT for the nation", threshold: 1_000_000, icon: Crown, color: "rose", thresholdField: "vat" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateTicketNumber(seed: string): string {
  return (hashSeed(seed) % 1_000_000).toString().padStart(6, "0");
}

function isHotTicket(ticket: string): boolean {
  const sum = ticket.split("").reduce((a, b) => a + parseInt(b, 10), 0);
  return sum % 7 === 0 || ticket.endsWith("7") || ticket.endsWith("00");
}

function useCountUp(target: number, durationMs = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) { setValue(0); return; }
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function useNextDrawCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const drawAt = useMemo(() => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 20, 0, 0).getTime();
  }, [now]);
  const diff = Math.max(0, drawAt - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    drawAt,
  };
}

function fmtAmount(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

interface LotoLotteryExperienceProps {
  receipts: Array<{ id: string; amount: string; vatAmount?: string; issuedAt: string }>;
  totalTurnover?: number;
  totalVatMobilised?: number;
  monthsWithActivity?: number;
  currency?: string;
  isMerchant?: boolean;
  onScanComplete?: () => void;
}

export function LotoLotteryExperience({
  receipts,
  totalTurnover = 0,
  totalVatMobilised,
  monthsWithActivity = 0,
  currency = "XOF",
  isMerchant = false,
  onScanComplete,
}: LotoLotteryExperienceProps) {
  const { t } = useTranslation();
  const myTickets = receipts.length;
  const [scanOpen, setScanOpen] = useState(false);
  const [posAnimOpen, setPosAnimOpen] = useState(false);
  const [posAnimReceipt, setPosAnimReceipt] = useState<PosAnimationReceipt | null>(null);
  const [posAnimForceWin, setPosAnimForceWin] = useState(false);

  const buildDemoReceipt = (): PosAnimationReceipt => {
    const amount = 8_000 + Math.floor(Math.random() * 22_000);
    const vat = Math.round(amount * 0.18);
    const ticketNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const fiscalCode = `${currency === "XOF" ? "CI" : "XX"}-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return {
      ticketNumber,
      fiscalCode,
      merchantName: "Boutique Démo Loto",
      city: "Abidjan",
      amount,
      vatAmount: vat,
      itemCount: 1 + Math.floor(Math.random() * 4),
      currency,
    };
  };

  const openHowItWorksDemo = () => {
    setPosAnimReceipt(buildDemoReceipt());
    setPosAnimForceWin(true);
    setPosAnimOpen(true);
  };

  const replayDemoDraw = () => {
    setPosAnimReceipt(buildDemoReceipt());
    setPosAnimForceWin(false);
    setPosAnimOpen(false);
    window.setTimeout(() => setPosAnimOpen(true), 50);
  };

  const handleWatchDrawForReceipt = (r: { ticketNumber: string; fiscalCode: string; amount: number; vatAmount: number; merchantName: string; city: string | null }) => {
    setPosAnimReceipt({
      ticketNumber: r.ticketNumber,
      fiscalCode: r.fiscalCode,
      merchantName: r.merchantName,
      city: r.city,
      amount: r.amount,
      vatAmount: r.vatAmount,
      itemCount: 1 + Math.floor(Math.random() * 4),
      currency,
    });
    setPosAnimForceWin(false);
    setPosAnimOpen(true);
  };

  const myVatContribution = useMemo(() => {
    if (typeof totalVatMobilised === "number" && totalVatMobilised > 0) return totalVatMobilised;
    return receipts.reduce((sum, r) => {
      if (r.vatAmount) return sum + parseFloat(r.vatAmount);
      return sum + parseFloat(r.amount) * 0.18;
    }, 0);
  }, [receipts, totalVatMobilised]);

  // Real backend draws — replaces hard-coded jackpot + winners feed (Task #283).
  type RealDraw = {
    id: string; countryCode: string; drawNumber: number; status: string;
    scheduledFor: string; commitmentHash: string;
    eligibleTicketCount: number; totalPool: string; currency: string; drawnAt: string | null;
  };
  type RealWinner = {
    id: string; tier: string; prizeAmount: string; currency: string;
    selectionRank: number; selectionHash: string;
    receiptIdSuffix: string; consumerHint: string; payoutStatus: string;
  };
  type RealTier = { id: string; tier: string; label: string; prizeAmount: string; slotCount: number; position: number };
  const drawsQ = useQuery<{ draws: RealDraw[] }>({ queryKey: ["/api/loto/draws"] });
  const draws = drawsQ.data?.draws ?? [];
  const latestClosed = draws.find((d) => d.status === "closed" || d.status === "verified");
  const nextScheduled = [...draws].reverse().find((d) => d.status === "scheduled" || d.status === "open");
  // The default queryFn fetches queryKey[0] only, so per-draw fetches need an
  // explicit queryFn pointing at the /:id sub-route. Cache key remains the
  // hierarchical pair so invalidating ["/api/loto/draws"] still bubbles down.
  const latestWinnersQ = useQuery<{ winners: RealWinner[]; tiers: RealTier[] }>({
    queryKey: ["/api/loto/draws", latestClosed?.id],
    enabled: !!latestClosed?.id,
    queryFn: async () => {
      const res = await fetch(`/api/loto/draws/${latestClosed!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error(`failed_to_load_draw_${res.status}`);
      return await res.json();
    },
  });
  const realWinners = latestWinnersQ.data?.winners ?? [];

  const nationalJackpot = nextScheduled
    ? Number(nextScheduled.totalPool) || (50_000_000 + Math.floor(totalTurnover * 0.05) + (myTickets * 1_250))
    : 50_000_000 + Math.floor(totalTurnover * 0.05) + (myTickets * 1_250);
  const animatedJackpot = useCountUp(nationalJackpot, 2000);
  const draw = useNextDrawCountdown();
  const drawDate = new Date(draw.drawAt);

  const myLuckyTickets = useMemo(() => {
    return receipts.slice(0, 12).map((r) => ({
      receiptId: r.id,
      number: generateTicketNumber(r.id),
      amount: parseFloat(r.amount),
      issuedAt: r.issuedAt,
      hot: isHotTicket(generateTicketNumber(r.id)),
    }));
  }, [receipts]);

  const winnersFeed = useMemo(() => {
    // Prefer real winners from the latest closed draw (Task #283).
    if (realWinners.length > 0) {
      return realWinners.slice(0, 12).map((w, i) => {
        const hint = (w.consumerHint || "Winner").trim();
        const parts = hint.split(/\s+/);
        const first = parts[0] || "Winner";
        const last = parts[1] || w.receiptIdSuffix.toUpperCase();
        return {
          first,
          last,
          city: w.tier.toUpperCase(),
          prize: Number(w.prizeAmount) || 0,
          tierLabel: w.tier === "jackpot" ? "Jackpot" : w.tier === "second" ? "Second Prize" : w.tier === "third" ? "Third Prize" : "Consolation",
          ago: i === 0 ? "just now" : `${i * 3} min`,
          initials: (first[0] + (last[0] || "•")).toUpperCase(),
        };
      });
    }
    // Pre-launch fallback (no real draws yet).
    const tiers = [
      { amt: 5_000, label: "Daily Win" },
      { amt: 50_000, label: "Bronze Prize" },
      { amt: 5_000, label: "Daily Win" },
      { amt: 500_000, label: "Silver Prize" },
      { amt: 5_000, label: "Daily Win" },
      { amt: 50_000, label: "Bronze Prize" },
    ];
    return SEED_NAMES.slice(0, 12).map((n, i) => ({
      ...n,
      prize: tiers[i % tiers.length].amt,
      tierLabel: tiers[i % tiers.length].label,
      ago: ["just now", "2 min", "5 min", "11 min", "18 min", "27 min", "38 min", "52 min", "1 h", "2 h", "3 h", "5 h"][i],
      initials: (n.first[0] + n.last[0]).toUpperCase(),
    }));
  }, [realWinners]);

  const leaderboard = useMemo(() => {
    return SEED_NAMES.slice(0, 10).map((n, i) => {
      const baseTickets = 320 - i * 27 - hashSeed(n.first + n.last) % 19;
      return {
        rank: i + 1,
        ...n,
        tickets: Math.max(1, baseTickets),
        initials: (n.first[0] + n.last[0]).toUpperCase(),
      };
    });
  }, []);

  const totalNationalReceipts = 1_287_440 + myTickets;
  const totalNationalVat = 8_456_120_000 + Math.round(myVatContribution);
  const totalPrizesPaid = 2_140_000_000;
  const activeParticipants = 47_812;

  return (
    <div className="space-y-6" data-testid="loto-lottery-experience">
      <style>{`
        @keyframes jackpot-glow { 0%,100% { box-shadow: 0 0 60px 0 rgba(251,191,36,0.45), 0 0 120px 0 rgba(16,185,129,0.20) inset; } 50% { box-shadow: 0 0 90px 8px rgba(251,191,36,0.65), 0 0 160px 0 rgba(16,185,129,0.30) inset; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes float-slow { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(8deg); } }
        @keyframes pulse-soft { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .jackpot-hero { animation: jackpot-glow 4s ease-in-out infinite; }
        .jackpot-shimmer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .jackpot-shimmer::after { content: ""; position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent); animation: shimmer 3.5s ease-in-out infinite; }
        .float-icon { animation: float-slow 5s ease-in-out infinite; }
        .pulse-soft { animation: pulse-soft 2.4s ease-in-out infinite; }
        .marquee-track { animation: marquee-scroll 38s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      <RealDrawsBanner draws={draws} latestClosed={latestClosed} nextScheduled={nextScheduled} />

      <div className="relative overflow-hidden rounded-3xl jackpot-hero" data-testid="card-jackpot-hero">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-amber-950" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(16,185,129,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(251,191,36,0.4), transparent 40%)" }} />
        <div className="jackpot-shimmer" />

        <div className="absolute top-6 left-6 float-icon opacity-60">
          <Sparkles className="w-8 h-8 text-amber-300" />
        </div>
        <div className="absolute top-10 right-10 float-icon opacity-50" style={{ animationDelay: "1.2s" }}>
          <Star className="w-6 h-6 text-yellow-300" fill="currentColor" />
        </div>
        <div className="absolute bottom-8 left-12 float-icon opacity-40" style={{ animationDelay: "2.4s" }}>
          <Sparkles className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="absolute bottom-12 right-16 float-icon opacity-50" style={{ animationDelay: "0.8s" }}>
          <Star className="w-7 h-7 text-amber-200" fill="currentColor" />
        </div>

        <div className="relative px-6 py-12 md:px-12 md:py-16 text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-300 pulse-soft" />
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-amber-200/90" data-testid="text-jackpot-label">
              {t("loto.lottery.jackpotLabel", "National Loto Fiscal Jackpot")}
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 pulse-soft" />
          </div>

          <div className="my-4">
            <div className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent leading-none" data-testid="text-jackpot-amount">
              {fmtAmount(animatedJackpot)}
            </div>
            <div className="mt-2 text-lg md:text-xl font-bold text-amber-100/90 tracking-widest" data-testid="text-jackpot-currency">
              {currency === "XOF" ? "FCFA" : currency}
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium text-white/90" data-testid="text-draw-date">
            <Calendar className="w-3.5 h-3.5" />
            {t("loto.lottery.nextDraw", "Next draw")}: {drawDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · 20:00 GMT
          </div>

          <div className="mt-6 flex justify-center gap-2 md:gap-3" data-testid="container-countdown">
            {[
              { label: t("loto.lottery.days", "Days"), value: draw.days, key: "days" },
              { label: t("loto.lottery.hours", "Hours"), value: draw.hours, key: "hours" },
              { label: t("loto.lottery.minutes", "Min"), value: draw.minutes, key: "minutes" },
              { label: t("loto.lottery.seconds", "Sec"), value: draw.seconds, key: "seconds" },
            ].map((u) => (
              <div key={u.key} className="flex flex-col items-center min-w-[64px] md:min-w-[80px] px-3 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10" data-testid={`countdown-${u.key}`}>
                <div className="text-2xl md:text-4xl font-black tabular-nums text-white">{u.value.toString().padStart(2, "0")}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">{u.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-sm font-semibold text-white" data-testid="text-my-tickets-summary">
              <Ticket className="w-4 h-4 text-amber-300" />
              {t("loto.lottery.youHold", "You hold")} <span className="text-amber-300 font-black">{myTickets}</span> {myTickets === 1 ? t("loto.lottery.ticket", "ticket") : t("loto.lottery.tickets", "tickets")}
            </div>
            <Button
              size="lg"
              onClick={() => setScanOpen(true)}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-xl shadow-amber-900/30 border-0"
              data-testid="button-scan-receipt"
            >
              <ScanLine className="w-4 h-4" />
              {t("loto.lottery.scanReceiptCta", "Scan a receipt to enter")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={openHowItWorksDemo}
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur"
              data-testid="button-how-it-works"
            >
              <PlayCircle className="w-4 h-4" />
              {t("loto.lottery.howItWorksCta", "See how it works")}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400" data-testid="text-prize-tiers-title">
            {t("loto.lottery.prizeTiersTitle", "Prize tiers · this month")}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PRIZE_TIERS.map((tier) => {
            const TierIcon = tier.icon;
            return (
              <div key={tier.id} className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${tier.gradient} text-white shadow-lg ${tier.glow} hover:scale-[1.03] transition-transform`} data-testid={`card-prize-tier-${tier.id}`}>
                <div className="absolute -top-4 -right-4 opacity-25">
                  <TierIcon className="w-20 h-20" />
                </div>
                <TierIcon className="w-6 h-6 mb-2 drop-shadow" />
                <div className="text-[10px] uppercase tracking-widest font-semibold opacity-90">{tier.label}</div>
                <div className="text-xl md:text-2xl font-black mt-1 tabular-nums drop-shadow">{fmtAmount(tier.amount)}</div>
                <div className="text-[10px] font-medium opacity-90 mt-1">FCFA</div>
                <div className="mt-2 pt-2 border-t border-white/20 text-[10px] space-y-0.5">
                  <div className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{tier.winners.toLocaleString()} {t("loto.lottery.winners", "winners")}</div>
                  <div className="flex items-center gap-1"><Target className="w-2.5 h-2.5" />{tier.odds}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {myLuckyTickets.length > 0 && (
        <Card data-testid="card-my-lucky-tickets">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="w-5 h-5 text-emerald-600" />
                {t("loto.lottery.myTicketsTitle", "My lucky tickets")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{t("loto.lottery.myTicketsSubtitle", "Each verified receipt gives you one entry. Hot tickets have winning patterns.")}</p>
            </div>
            <Badge variant="outline" className="text-xs" data-testid="badge-tickets-count">
              {myTickets} {t("loto.lottery.entries", "entries")}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {myLuckyTickets.map((tk, idx) => (
                <div key={tk.receiptId} className={`relative rounded-xl border-2 border-dashed p-3 ${tk.hot ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"}`} data-testid={`ticket-${idx}`}>
                  {tk.hot && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1" data-testid={`badge-hot-${idx}`}>
                      <Flame className="w-2.5 h-2.5" /> Hot
                    </div>
                  )}
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("loto.lottery.luckyNumber", "Lucky number")}</div>
                  <div className={`text-2xl font-black font-mono tabular-nums ${tk.hot ? "text-amber-700 dark:text-amber-300" : "text-slate-700 dark:text-slate-200"}`} data-testid={`ticket-number-${idx}`}>
                    {tk.number}
                  </div>
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{fmtAmount(tk.amount)} FCFA</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(tk.issuedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</div>
                  </div>
                </div>
              ))}
            </div>
            {receipts.length > 12 && (
              <p className="text-xs text-muted-foreground mt-3 text-center" data-testid="text-more-tickets">
                +{receipts.length - 12} {t("loto.lottery.moreTickets", "more tickets in this draw")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {myLuckyTickets.length === 0 && (
        <Card className="border-dashed" data-testid="card-no-tickets">
          <CardContent className="p-8 text-center">
            <Ticket className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1" data-testid="text-no-tickets-title">{t("loto.lottery.noTicketsTitle", "No tickets yet — start scanning!")}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              {t("loto.lottery.noTicketsBody", "Every verified VAT receipt becomes one ticket in this month's national draw. Scan a receipt at any participating merchant to enter.")}
            </p>
            <Button
              onClick={() => setScanOpen(true)}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0"
              data-testid="button-scan-receipt-empty"
            >
              <ScanLine className="w-4 h-4" />
              {t("loto.lottery.scanReceiptCta", "Scan a receipt to enter")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden" data-testid="card-recent-winners">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PartyPopper className="w-5 h-5 text-emerald-600" />
            {t("loto.lottery.recentWinnersTitle", "Recent winners")}
            <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 pulse-soft" />
              {t("loto.lottery.live", "Live")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden relative py-2">
            <div className="flex gap-3 marquee-track w-max" data-testid="container-winners-marquee">
              {[...winnersFeed, ...winnersFeed].map((w, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 min-w-[280px]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {w.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{w.first} {w.last[0]}.</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />{w.city} · {w.ago}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">+{fmtAmount(w.prize)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{w.tierLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-leaderboard">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="w-5 h-5 text-amber-500" />
              {t("loto.lottery.leaderboardTitle", "Top scanners · this month")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const rankColors = ["from-amber-400 to-yellow-500", "from-slate-300 to-zinc-400", "from-orange-400 to-amber-600"];
                return (
                  <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-xl ${isTop3 ? "bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-900/40"} transition`} data-testid={`leaderboard-row-${entry.rank}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${isTop3 ? `bg-gradient-to-br ${rankColors[entry.rank - 1]} text-white shadow` : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                      {isTop3 ? (entry.rank === 1 ? <Crown className="w-4 h-4" /> : entry.rank === 2 ? <Trophy className="w-4 h-4" /> : <Medal className="w-4 h-4" />) : entry.rank}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {entry.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{entry.first} {entry.last}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{entry.city}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">{entry.tickets}</div>
                      <div className="text-[10px] text-muted-foreground">{t("loto.lottery.tickets", "tickets")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-achievements">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-violet-600" />
              {t("loto.lottery.achievementsTitle", "My achievements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {ACHIEVEMENTS.map((ach) => {
                let progressValue = myTickets;
                if (ach.thresholdField === "months") progressValue = monthsWithActivity;
                if (ach.thresholdField === "vat") progressValue = myVatContribution;
                const unlocked = progressValue >= ach.threshold;
                const pct = Math.min(100, (progressValue / ach.threshold) * 100);
                const AchIcon = ach.icon;
                const colorMap: Record<string, string> = {
                  emerald: "from-emerald-500 to-teal-600",
                  blue: "from-blue-500 to-cyan-600",
                  violet: "from-violet-500 to-purple-600",
                  amber: "from-amber-500 to-orange-600",
                  orange: "from-orange-500 to-red-600",
                  rose: "from-rose-500 to-pink-600",
                };
                return (
                  <div key={ach.id} className={`relative rounded-xl p-3 border ${unlocked ? "border-transparent bg-gradient-to-br " + colorMap[ach.color] + " text-white shadow-md" : "border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400"}`} data-testid={`achievement-${ach.id}`}>
                    <div className="flex items-start justify-between mb-1.5">
                      <AchIcon className={`w-5 h-5 ${unlocked ? "" : "opacity-40"}`} />
                      {unlocked ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 opacity-50" />}
                    </div>
                    <div className={`text-xs font-bold ${unlocked ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>{ach.label}</div>
                    <div className={`text-[10px] mt-0.5 leading-tight ${unlocked ? "text-white/85" : "text-slate-500 dark:text-slate-400"}`}>{ach.desc}</div>
                    {!unlocked && (
                      <div className="mt-2">
                        <Progress value={pct} className="h-1" />
                        <div className="text-[9px] text-muted-foreground mt-1 tabular-nums">
                          {Math.round(progressValue).toLocaleString()} / {ach.threshold.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/30 border-emerald-200/40 dark:border-emerald-900/40" data-testid="card-national-impact">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="w-5 h-5 text-emerald-600" />
            {t("loto.lottery.nationalImpactTitle", "National impact")}
            <Badge variant="outline" className="ml-2 text-[10px] border-emerald-400 text-emerald-700 dark:text-emerald-300">{t("loto.lottery.thisMonth", "This month")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" data-testid="stat-total-receipts">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <ScanLine className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("loto.lottery.statReceiptsLabel", "Receipts scanned")}</span>
              </div>
              <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{totalNationalReceipts.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" />+12.4% vs last month</div>
            </div>
            <div className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" data-testid="stat-vat-mobilised">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("loto.lottery.statVatLabel", "VAT mobilised")}</span>
              </div>
              <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{Math.round(totalNationalVat / 1_000_000).toLocaleString()}M</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">FCFA</div>
            </div>
            <div className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" data-testid="stat-prizes-paid">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Gift className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("loto.lottery.statPrizesLabel", "Prizes paid out")}</span>
              </div>
              <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{Math.round(totalPrizesPaid / 1_000_000).toLocaleString()}M</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">FCFA · since launch</div>
            </div>
            <div className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" data-testid="stat-participants">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{t("loto.lottery.statParticipantsLabel", "Active citizens")}</span>
              </div>
              <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{activeParticipants.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Live</div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed" data-testid="text-impact-disclaimer">
            {t("loto.lottery.impactDisclaimer", "Every scanned receipt is verified by the tax authority and contributes to public revenue. The Loto Fiscal lottery rewards participation while building trust in the formal economy.")}
          </p>
        </CardContent>
      </Card>

      <ScanReceiptModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        currency={currency}
        onScanComplete={onScanComplete}
        onWatchDraw={handleWatchDrawForReceipt}
      />

      <LotoPosAnimation
        open={posAnimOpen}
        onOpenChange={setPosAnimOpen}
        receipt={posAnimReceipt}
        forceWin={posAnimForceWin}
        onPlayAgain={replayDemoDraw}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScanReceiptModal — pilot scan flow. Lets the user enter a tier (small /
// medium / large) or paste a fiscal code; backend creates a synthetic verified
// receipt and returns the new ticket. Real fiscalisation (camera + DGI/FIRS
// QR verification) will replace this in the production pilot.
// ─────────────────────────────────────────────────────────────────────────────
interface ScanReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  onScanComplete?: () => void;
  onWatchDraw?: (r: { ticketNumber: string; fiscalCode: string; amount: number; vatAmount: number; merchantName: string; city: string | null }) => void;
}

interface ScanResult {
  ok: boolean;
  ticketNumber: string;
  ticketCount: number;
  receipt: { id: string; amount: string; vatAmount: string; currency: string; fiscalCode: string };
  merchant: { id: string; shopName: string; city: string | null };
}

function ScanReceiptModal({ open, onOpenChange, currency, onScanComplete, onWatchDraw }: ScanReceiptModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [manualCode, setManualCode] = useState("");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (input: { kind?: "small" | "medium" | "large"; fiscalCode?: string }) => {
      const res = await apiRequest("POST", "/api/loto/receipts/scan", input);
      return (await res.json()) as ScanResult;
    },
    onSuccess: (data) => {
      setLastResult(data);
      onScanComplete?.();
      toast({
        title: t("loto.lottery.scanSuccessTitle", "Receipt verified — ticket #{{n}} added!", { n: data.ticketNumber }),
        description: t(
          "loto.lottery.scanSuccessBody",
          "{{amount}} {{currency}} purchase from {{shop}}. You now hold {{count}} ticket(s).",
          {
            amount: fmtAmount(parseFloat(data.receipt.amount)),
            currency: data.receipt.currency,
            shop: data.merchant.shopName,
            count: data.ticketCount,
          },
        ),
      });
    },
    onError: (err: Error) => {
      toast({
        title: t("loto.lottery.scanErrorTitle", "Scan failed"),
        description: err?.message ?? t("loto.lottery.scanErrorBody", "Could not verify the receipt. Please try again."),
        variant: "destructive",
      });
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) {
      setManualCode("");
      setLastResult(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-scan-receipt">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-amber-500" />
            {t("loto.lottery.scanModalTitle", "Scan a fiscal receipt")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "loto.lottery.scanModalSubtitle",
              "Pick a sample receipt size to simulate a scan, or paste a fiscal code from a real receipt. Each verified receipt earns you one lottery ticket.",
            )}
          </DialogDescription>
        </DialogHeader>

        {lastResult ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-5" data-testid="scan-result-card">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-3">
              <CheckCircle2 className="w-5 h-5" />
              {t("loto.lottery.scanSuccessTitle", "Receipt verified — ticket #{{n}} added!", { n: lastResult.ticketNumber })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t("loto.lottery.scanResultMerchant", "Merchant")}</div>
                <div className="font-semibold" data-testid="scan-result-merchant">{lastResult.merchant.shopName}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t("loto.lottery.scanResultAmount", "Amount")}</div>
                <div className="font-semibold tabular-nums" data-testid="scan-result-amount">
                  {fmtAmount(parseFloat(lastResult.receipt.amount))} {lastResult.receipt.currency}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t("loto.lottery.scanResultVat", "VAT verified")}</div>
                <div className="font-semibold tabular-nums">
                  {fmtAmount(parseFloat(lastResult.receipt.vatAmount))} {lastResult.receipt.currency}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t("loto.lottery.scanResultTicketCount", "Total tickets")}</div>
                <div className="font-semibold tabular-nums" data-testid="scan-result-ticket-count">{lastResult.ticketCount}</div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="sample" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="sample" data-testid="tab-scan-sample">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {t("loto.lottery.scanTabSample", "Sample receipt")}
              </TabsTrigger>
              <TabsTrigger value="manual" data-testid="tab-scan-manual">
                <QrCode className="w-3.5 h-3.5 mr-1.5" />
                {t("loto.lottery.scanTabManual", "Paste code")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sample" className="mt-4">
              <p className="text-xs text-muted-foreground mb-3">
                {t("loto.lottery.scanSampleHint", "Choose how big the demo purchase should be:")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { kind: "small" as const, label: t("loto.lottery.scanKindSmall", "Small"), range: `1k–5k ${currency}` },
                    { kind: "medium" as const, label: t("loto.lottery.scanKindMedium", "Medium"), range: `5k–25k ${currency}` },
                    { kind: "large" as const, label: t("loto.lottery.scanKindLarge", "Large"), range: `25k–120k ${currency}` },
                  ]
                ).map((opt) => (
                  <Button
                    key={opt.kind}
                    variant="outline"
                    disabled={scanMutation.isPending}
                    onClick={() => scanMutation.mutate({ kind: opt.kind })}
                    className="flex flex-col h-auto py-3 gap-1"
                    data-testid={`button-scan-kind-${opt.kind}`}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{opt.range}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fiscal-code-input" className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("loto.lottery.scanManualLabel", "Fiscal code from receipt")}
                  </Label>
                  <Input
                    id="fiscal-code-input"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="ABC123XYZ"
                    maxLength={32}
                    disabled={scanMutation.isPending}
                    className="mt-1 font-mono"
                    data-testid="input-fiscal-code"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {t("loto.lottery.scanManualHint", "Find the fiscal code printed at the bottom of any participating-merchant receipt. Min 6 characters.")}
                  </p>
                </div>
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0"
                  disabled={scanMutation.isPending || manualCode.length < 6}
                  onClick={() => scanMutation.mutate({ fiscalCode: manualCode })}
                  data-testid="button-submit-fiscal-code"
                >
                  {scanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  {t("loto.lottery.scanSubmit", "Verify receipt")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="sm:justify-between gap-2 flex-wrap">
          {lastResult ? (
            <>
              <Button
                variant="outline"
                onClick={() => setLastResult(null)}
                data-testid="button-scan-another"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                {t("loto.lottery.scanAnother", "Scan another")}
              </Button>
              <div className="flex gap-2">
                {onWatchDraw && (
                  <Button
                    onClick={() => {
                      const r = lastResult;
                      onWatchDraw({
                        ticketNumber: r.ticketNumber,
                        fiscalCode: r.receipt.fiscalCode,
                        amount: parseFloat(r.receipt.amount),
                        vatAmount: parseFloat(r.receipt.vatAmount),
                        merchantName: r.merchant.shopName,
                        city: r.merchant.city,
                      });
                      handleClose(false);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0"
                    data-testid="button-scan-watch-draw"
                  >
                    <PartyPopper className="w-4 h-4 mr-2" />
                    {t("loto.lottery.watchDrawCta", "Watch the live draw")}
                  </Button>
                )}
                <Button
                  onClick={() => handleClose(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-scan-done"
                >
                  {t("common.done", "Done")}
                </Button>
              </div>
            </>
          ) : (
            <Button variant="ghost" onClick={() => handleClose(false)} data-testid="button-scan-cancel">
              {t("common.cancel", "Cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RealDrawSummary = {
  id: string; countryCode: string; drawNumber: number; status: string;
  scheduledFor: string; commitmentHash: string;
  eligibleTicketCount: number; totalPool: string; currency: string; drawnAt: string | null;
};
interface RealDrawsBannerProps {
  draws: RealDrawSummary[];
  latestClosed: RealDrawSummary | undefined;
  nextScheduled: RealDrawSummary | undefined;
}

function RealDrawsBanner({ draws, latestClosed, nextScheduled }: RealDrawsBannerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canRunDemoDraw = ["super_admin", "dgi", "loto_admin", "tax_admin", "admin"].includes(user?.role ?? "");
  const runDemo = useMutation({
    mutationFn: async () => {
      // Send the country of the most recently scheduled/closed draw if known,
      // otherwise let the server fall back to the first active country config.
      const countryCode = (draws[0]?.countryCode || "").toUpperCase() || undefined;
      const res = await apiRequest("POST", "/api/loto/admin/draws/run-demo", countryCode ? { countryCode } : {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/draws"] });
    },
  });

  if (draws.length === 0 && !canRunDemoDraw) return null;

  return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 flex flex-wrap items-center gap-3" data-testid="real-draws-banner">
      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-[180px]">
        <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold">
          Provably-fair draw engine
        </div>
        <div className="text-sm text-foreground">
          {latestClosed ? (
            <>Last draw <strong>#{latestClosed.drawNumber}</strong> ({latestClosed.countryCode}) closed — {latestClosed.eligibleTicketCount.toLocaleString()} eligible tickets, pool {latestClosed.currency} {Number(latestClosed.totalPool).toLocaleString()}.</>
          ) : nextScheduled ? (
            <>Next draw <strong>#{nextScheduled.drawNumber}</strong> ({nextScheduled.countryCode}) scheduled for {new Date(nextScheduled.scheduledFor).toLocaleString()}.</>
          ) : (
            <>No draws yet — schedule one from the Loto admin workspace.</>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {latestClosed && (
          <Link href={`/loto/draws/verify/${latestClosed.id}`}>
            <Button size="sm" variant="outline" data-testid="button-verify-latest-draw">
              Verify last draw
            </Button>
          </Link>
        )}
        {canRunDemoDraw && (
          <Button size="sm" onClick={() => runDemo.mutate()} disabled={runDemo.isPending} data-testid="button-run-demo-draw">
            {runDemo.isPending ? "Running…" : "Run Demo Draw Now"}
          </Button>
        )}
      </div>
      {runDemo.data?.draw?.id && (
        <div className="w-full text-xs text-emerald-700 dark:text-emerald-300 font-mono">
          Demo draw {runDemo.data.draw.id} ran successfully — commitment {String(runDemo.data.draw.commitmentHash).slice(0, 16)}…
        </div>
      )}
    </div>
  );
}
