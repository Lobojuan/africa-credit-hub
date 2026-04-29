import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, PartyPopper, Trophy, ChevronRight, RotateCcw } from "lucide-react";

export interface PosAnimationReceipt {
  ticketNumber: string;
  fiscalCode: string;
  merchantName: string;
  city?: string | null;
  amount: number;
  vatAmount: number;
  itemCount: number;
  currency: string;
}

interface LotoPosAnimationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: PosAnimationReceipt | null;
  forceWin?: boolean;
  onPlayAgain?: () => void;
}

type Stage = "printing" | "drawing" | "revealed";

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

function randomDigit(): string {
  return String(Math.floor(Math.random() * 10));
}

function randomNumber(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += randomDigit();
  return s;
}

function decideOutcome(ticket: string, force: boolean) {
  if (force) {
    return { winning: ticket, tier: "grand" as const };
  }
  const r = Math.random();
  if (r < 0.06) return { winning: ticket, tier: "grand" as const };
  if (r < 0.18) {
    const last4 = ticket.slice(-4);
    return { winning: randomNumber(2) + last4, tier: "silver" as const };
  }
  if (r < 0.42) {
    const last3 = ticket.slice(-3);
    return { winning: randomNumber(3) + last3, tier: "bronze" as const };
  }
  let other = randomNumber(ticket.length);
  while (other.slice(-3) === ticket.slice(-3)) other = randomNumber(ticket.length);
  return { winning: other, tier: "none" as const };
}

const TIER_META: Record<string, { label: string; amount: number; color: string }> = {
  grand:  { label: "Grand Prize", amount: 25_000_000, color: "from-amber-500 via-yellow-500 to-orange-500" },
  silver: { label: "Silver Prize", amount: 500_000,    color: "from-slate-300 via-zinc-300 to-slate-400" },
  bronze: { label: "Bronze Prize", amount: 50_000,     color: "from-orange-400 via-amber-600 to-orange-600" },
};

export function LotoPosAnimation({
  open, onOpenChange, receipt, forceWin = false, onPlayAgain,
}: LotoPosAnimationProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("printing");
  const [printedCount, setPrintedCount] = useState(0);
  const [drawnDigits, setDrawnDigits] = useState<string[]>([]);
  const [revealedSlots, setRevealedSlots] = useState(0);
  const revealedSlotsRef = useRef(0);
  const tickRef = useRef<number | null>(null);

  const outcome = useMemo(() => {
    if (!receipt) return null;
    return decideOutcome(receipt.ticketNumber, forceWin);
  }, [receipt?.ticketNumber, forceWin, open]);

  const lines = useMemo(() => {
    if (!receipt) return [] as { type: string; text: string }[];
    const subtotal = receipt.amount - receipt.vatAmount;
    const now = new Date();
    const ts = `${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    return [
      { type: "header",  text: receipt.merchantName.toUpperCase() },
      { type: "subtle",  text: receipt.city ?? "Côte d'Ivoire" },
      { type: "rule",    text: "" },
      { type: "row",     text: `Articles${"".padEnd(20 - 8 - String(receipt.itemCount).length, " ")}${receipt.itemCount}` },
      { type: "row",     text: `Sous-total${"".padEnd(28 - 10 - (`${fmt(Math.round(subtotal))} ${receipt.currency}`).length, " ")}${fmt(Math.round(subtotal))} ${receipt.currency}` },
      { type: "row",     text: `TVA 18%${"".padEnd(28 - 7 - (`${fmt(receipt.vatAmount)} ${receipt.currency}`).length, " ")}${fmt(receipt.vatAmount)} ${receipt.currency}` },
      { type: "rule",    text: "" },
      { type: "total",   text: `TOTAL  ${fmt(receipt.amount)} ${receipt.currency}` },
      { type: "rule",    text: "" },
      { type: "subtle",  text: `Code fiscal: ${receipt.fiscalCode}` },
      { type: "subtle",  text: `Émis: ${ts}` },
      { type: "rule",    text: "" },
      { type: "ticket-label",  text: "★ TICKET LOTO FISCAL ★" },
      { type: "ticket-number", text: receipt.ticketNumber },
      { type: "footer",  text: "Bonne chance !" },
    ];
  }, [receipt]);

  useEffect(() => {
    if (!open) return;
    setStage("printing");
    setPrintedCount(0);
    setDrawnDigits([]);
    setRevealedSlots(0);
    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [open, receipt?.ticketNumber]);

  useEffect(() => {
    if (!open || stage !== "printing" || lines.length === 0) return;
    if (printedCount >= lines.length) {
      const timeout = window.setTimeout(() => setStage("drawing"), 700);
      return () => window.clearTimeout(timeout);
    }
    const next = lines[printedCount];
    const delay = next.type === "rule" ? 90
      : next.type === "ticket-number" ? 600
      : next.type === "ticket-label" ? 400
      : next.type === "header" ? 320
      : next.type === "total" ? 260
      : 180;
    const id = window.setTimeout(() => setPrintedCount((c) => c + 1), delay);
    return () => window.clearTimeout(id);
  }, [open, stage, printedCount, lines]);

  useEffect(() => {
    if (!open || stage !== "drawing" || !outcome || !receipt) return;
    const len = receipt.ticketNumber.length;
    setDrawnDigits(Array.from({ length: len }, () => randomDigit()));
    setRevealedSlots(0);

    const spinId = window.setInterval(() => {
      setDrawnDigits((current) =>
        current.map((d, i) => (i < revealedSlotsRef.current ? d : randomDigit())),
      );
    }, 70);
    tickRef.current = spinId;

    const settleAt = (i: number, ms: number) => window.setTimeout(() => {
      revealedSlotsRef.current = i + 1;
      setDrawnDigits((current) =>
        current.map((d, idx) => (idx <= i ? outcome.winning[idx] : d)),
      );
      setRevealedSlots(i + 1);
    }, ms);

    const timeouts: number[] = [];
    for (let i = 0; i < len; i++) {
      timeouts.push(settleAt(i, 1000 + i * 350));
    }
    const finalTimeout = window.setTimeout(() => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setStage("revealed");
    }, 1000 + len * 350 + 500);
    timeouts.push(finalTimeout);

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [open, stage, outcome, receipt?.ticketNumber]);

  useEffect(() => { revealedSlotsRef.current = revealedSlots; }, [revealedSlots]);

  if (!receipt || !outcome) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-pos-animation-empty">
          <DialogHeader>
            <DialogTitle>{t("loto.lottery.posAnimTitle", "Live receipt → ticket → draw")}</DialogTitle>
            <DialogDescription>{t("loto.lottery.posAnimNoReceipt", "No receipt to animate.")}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const isWin = outcome.tier !== "none";
  const tierMeta = isWin ? TIER_META[outcome.tier] : null;
  const totalPrinted = lines.length;
  const printingDone = printedCount >= totalPrinted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-800 text-slate-100" data-testid="dialog-pos-animation">
        <style>{`
          @keyframes posShake {
            0%, 100% { transform: translateY(0) }
            25% { transform: translateY(-1px) translateX(0.5px) }
            50% { transform: translateY(0.5px) translateX(-0.5px) }
            75% { transform: translateY(-0.5px) translateX(0.3px) }
          }
          @keyframes lineSlideIn {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes paperRoll {
            from { max-height: 0; }
            to   { max-height: 420px; }
          }
          @keyframes ticketHighlight {
            0% { background-color: rgba(251, 191, 36, 0); }
            40% { background-color: rgba(251, 191, 36, 0.45); }
            100% { background-color: rgba(251, 191, 36, 0.15); }
          }
          @keyframes confettiFall {
            0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(420px) rotate(720deg); opacity: 0; }
          }
          @keyframes bigPop {
            0%   { transform: scale(0.5); opacity: 0; }
            60%  { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .pos-printing { animation: posShake 0.18s linear infinite; }
          .receipt-line { animation: lineSlideIn 0.22s ease-out; }
          .ticket-highlight { animation: ticketHighlight 1.4s ease-out forwards; }
          .confetti-piece {
            position: absolute;
            width: 8px; height: 12px;
            top: 0;
            animation-name: confettiFall;
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
            animation-fill-mode: forwards;
          }
          .big-pop { animation: bigPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        `}</style>

        <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {stage === "printing" && t("loto.lottery.posAnimPrinting", "Printing your fiscal receipt…")}
            {stage === "drawing"  && t("loto.lottery.posAnimDrawing",  "Live national draw — pulling the winning number…")}
            {stage === "revealed" && (isWin
              ? t("loto.lottery.posAnimWin",  "🎉 You're a winner!")
              : t("loto.lottery.posAnimLose", "So close — your ticket stays in the next draw"))}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {t("loto.lottery.posAnimSubtitle", "This is a demo of how a participating merchant prints your fiscal receipt — and what happens at draw time.")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-6 pb-4 min-h-[480px] relative">
          {(stage === "printing" || stage === "drawing") && (
            <div className="flex flex-col items-center">
              {/* POS terminal */}
              <div className={`relative ${stage === "printing" && !printingDone ? "pos-printing" : ""}`}>
                <div className="w-56 h-32 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 shadow-2xl shadow-black/60 relative">
                  <div className="absolute inset-x-3 top-3 h-12 rounded-md bg-emerald-900/70 border border-emerald-500/40 flex items-center justify-center">
                    <div className="text-emerald-300 text-[10px] font-mono tracking-wider">
                      {stage === "printing" ? "DGI · ÉMISSION" : "DGI · TIRAGE"}
                    </div>
                  </div>
                  <div className="absolute inset-x-3 top-[68px] grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-3.5 rounded-sm bg-slate-600/80 border border-slate-500/60" />
                    ))}
                  </div>
                  {/* printer slot */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-44 h-1.5 rounded-b-sm bg-slate-950 border-x border-b border-slate-700" />
                </div>
                <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-md bg-amber-500 text-amber-950 text-[9px] font-black tracking-wider">
                  POS · ABIDJAN
                </div>
              </div>

              {/* Receipt paper */}
              <div className="w-72 -mt-1 relative" style={{ overflow: "hidden", animation: "paperRoll 1.6s ease-out forwards" }}>
                <div className="bg-white text-slate-800 font-mono text-[11px] leading-tight rounded-b-md shadow-2xl shadow-black/40 px-4 pt-2 pb-3"
                  style={{
                    backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 22px)",
                  }}
                  data-testid="pos-receipt-paper">
                  {lines.slice(0, printedCount).map((ln, i) => {
                    if (ln.type === "rule") {
                      return <div key={i} className="receipt-line border-t border-dashed border-slate-300 my-1" />;
                    }
                    if (ln.type === "header") {
                      return <div key={i} className="receipt-line text-center font-black text-[12px] tracking-wider">{ln.text}</div>;
                    }
                    if (ln.type === "subtle") {
                      return <div key={i} className="receipt-line text-center text-[10px] text-slate-500">{ln.text}</div>;
                    }
                    if (ln.type === "row") {
                      return <div key={i} className="receipt-line whitespace-pre">{ln.text}</div>;
                    }
                    if (ln.type === "total") {
                      return <div key={i} className="receipt-line text-center font-black text-[13px] mt-0.5">{ln.text}</div>;
                    }
                    if (ln.type === "ticket-label") {
                      return <div key={i} className="receipt-line text-center text-amber-600 font-bold text-[11px] tracking-widest mt-1">{ln.text}</div>;
                    }
                    if (ln.type === "ticket-number") {
                      return (
                        <div key={i} className="receipt-line text-center my-1 ticket-highlight rounded">
                          <div className="font-black text-[22px] tracking-[0.35em] text-amber-700" data-testid="pos-receipt-ticket-number">
                            {ln.text}
                          </div>
                        </div>
                      );
                    }
                    return <div key={i} className="receipt-line text-center text-[10px] italic text-slate-500 mt-1">{ln.text}</div>;
                  })}
                </div>
                {/* Tear edge */}
                <div className="h-2 bg-white"
                  style={{ clipPath: "polygon(0 0, 100% 0, 96% 100%, 92% 0, 88% 100%, 84% 0, 80% 100%, 76% 0, 72% 100%, 68% 0, 64% 100%, 60% 0, 56% 100%, 52% 0, 48% 100%, 44% 0, 40% 100%, 36% 0, 32% 100%, 28% 0, 24% 100%, 20% 0, 16% 100%, 12% 0, 8% 100%, 4% 0, 0 100%)" }}
                />
              </div>

              {stage === "drawing" && (
                <div className="mt-6 w-full max-w-md">
                  <div className="text-center text-[11px] uppercase tracking-[0.3em] text-amber-300/80 mb-2">
                    {t("loto.lottery.posAnimDrawingHeader", "Tirage en cours…")}
                  </div>
                  <div className="flex items-center justify-center gap-2" data-testid="pos-draw-digits">
                    {drawnDigits.map((d, i) => {
                      const settled = i < revealedSlots;
                      return (
                        <div
                          key={i}
                          className={`w-12 h-16 rounded-lg flex items-center justify-center font-black text-3xl tabular-nums transition-all duration-300 ${
                            settled
                              ? "bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/40 scale-110"
                              : "bg-slate-800 text-slate-100 border border-slate-700"
                          }`}
                        >
                          {d}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-[10px] text-slate-500 mt-3">
                    {t("loto.lottery.posAnimYourTicket", "Your ticket")}: <span className="font-mono text-slate-300">{receipt.ticketNumber}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === "revealed" && (
            <div className="flex flex-col items-center justify-center py-4 relative" data-testid="pos-result">
              {isWin && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 36 }).map((_, i) => {
                    const colors = ["#f59e0b", "#fbbf24", "#10b981", "#3b82f6", "#ef4444", "#a855f7"];
                    const left = (i * 2.7) % 100;
                    const delay = (i % 9) * 0.08;
                    const duration = 1.6 + (i % 5) * 0.2;
                    const color = colors[i % colors.length];
                    return (
                      <span
                        key={i}
                        className="confetti-piece"
                        style={{
                          left: `${left}%`,
                          background: color,
                          animationDelay: `${delay}s`,
                          animationDuration: `${duration}s`,
                          transform: `rotate(${i * 23}deg)`,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              <div className="big-pop flex flex-col items-center">
                {isWin ? (
                  <>
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${tierMeta!.color} flex items-center justify-center shadow-2xl shadow-amber-500/40 mb-3`}>
                      <Trophy className="w-10 h-10 text-white drop-shadow" />
                    </div>
                    <div className="text-amber-300 text-[10px] uppercase tracking-[0.3em] font-bold">
                      {t("loto.lottery.posAnimResultLabel", "Résultat officiel")}
                    </div>
                    <div className="text-3xl font-black text-white mt-1 flex items-center gap-2" data-testid="pos-result-title">
                      <PartyPopper className="w-7 h-7 text-amber-400" />
                      {t(`loto.lottery.posAnimTier_${outcome.tier}`, tierMeta!.label)}
                    </div>
                    <div className="mt-3 px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40">
                      <div className="text-[10px] uppercase tracking-wider text-amber-300/90 text-center">{t("loto.lottery.posAnimPrize", "Prize")}</div>
                      <div className="text-2xl font-black text-amber-300 tabular-nums" data-testid="pos-result-prize">
                        {fmt(tierMeta!.amount)} {receipt.currency}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-sm text-center">
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">{t("loto.lottery.posAnimYourTicket", "Your ticket")}</div>
                        <div className="font-mono text-amber-300 font-bold text-lg mt-1">{receipt.ticketNumber}</div>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">{t("loto.lottery.posAnimWinningNumber", "Winning number")}</div>
                        <div className="font-mono text-amber-300 font-bold text-lg mt-1">{outcome.winning}</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-4 text-center max-w-sm">
                      {t("loto.lottery.posAnimWinNote", "In production, you'd be notified by SMS, your prize would be paid to your mobile money wallet within 48h, and the DGI publishes the audited result.")}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
                      <Sparkles className="w-9 h-9 text-slate-400" />
                    </div>
                    <div className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-bold">
                      {t("loto.lottery.posAnimResultLabel", "Résultat officiel")}
                    </div>
                    <div className="text-2xl font-black text-slate-100 mt-1" data-testid="pos-result-title">
                      {t("loto.lottery.posAnimNotThisTime", "Pas cette fois")}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 w-full max-w-sm text-center">
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">{t("loto.lottery.posAnimYourTicket", "Your ticket")}</div>
                        <div className="font-mono text-slate-200 font-bold text-lg mt-1">{receipt.ticketNumber}</div>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">{t("loto.lottery.posAnimWinningNumber", "Winning number")}</div>
                        <div className="font-mono text-slate-200 font-bold text-lg mt-1">{outcome.winning}</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-4 text-center max-w-sm">
                      {t("loto.lottery.posAnimLoseNote", "Your ticket is still counted in this month's grand draw — every receipt is an entry. Keep scanning!")}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 sm:justify-between gap-2">
          {stage === "revealed" ? (
            <>
              {onPlayAgain ? (
                <Button
                  variant="outline"
                  onClick={onPlayAgain}
                  className="border-slate-700 bg-slate-800/60 text-slate-100 hover:bg-slate-800"
                  data-testid="button-pos-play-again"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("loto.lottery.posAnimReplay", "Run another draw")}
                </Button>
              ) : <span />}
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-amber-500 hover:bg-amber-400 text-amber-950"
                data-testid="button-pos-close"
              >
                {t("common.done", "Done")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-400">
                {t("loto.lottery.posAnimSkipHint", "Sit tight — printing then drawing live…")}
              </span>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                data-testid="button-pos-skip"
              >
                {t("common.skip", "Skip")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
