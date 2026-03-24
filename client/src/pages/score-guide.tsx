import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  FileText,
} from "lucide-react";

const SCORE_BANDS = [
  { min: 750, max: 850, label: "Excellent", color: "hsl(142 55% 40%)", bgClass: "bg-emerald-100 dark:bg-emerald-900/40", textClass: "text-emerald-700 dark:text-emerald-400", description: "Outstanding credit profile. Borrowers in this range demonstrate exceptional payment history and low risk." },
  { min: 670, max: 749, label: "Good", color: "hsl(175 55% 28%)", bgClass: "bg-teal-100 dark:bg-teal-900/40", textClass: "text-teal-700 dark:text-teal-400", description: "Strong credit profile. Minor issues may exist but overall responsible credit behavior is evident." },
  { min: 580, max: 669, label: "Fair", color: "hsl(43 80% 55%)", bgClass: "bg-amber-100 dark:bg-amber-900/40", textClass: "text-amber-700 dark:text-amber-400", description: "Moderate credit risk. Some late payments or high utilization may be present." },
  { min: 450, max: 579, label: "Poor", color: "hsl(14 70% 50%)", bgClass: "bg-orange-100 dark:bg-orange-900/40", textClass: "text-orange-700 dark:text-orange-400", description: "Below-average credit profile. Multiple negative factors detected." },
  { min: 300, max: 449, label: "Very Poor", color: "hsl(0 72% 42%)", bgClass: "bg-red-100 dark:bg-red-900/40", textClass: "text-red-700 dark:text-red-400", description: "Significant credit risk. Severe delinquencies or write-offs are likely present." },
];

export default function ScoreGuidePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-score-guide-title">
            {t("scoreGuide.title", "Understanding Your Credit Score")}
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-score-guide-subtitle">
            {t("scoreGuide.subtitle", "Credit scores range from 300 to 850. Here's what each band means.")}
          </p>
        </div>

        <Card data-testid="card-public-score-bands">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))" }}>
                <BarChart3 className="w-4 h-4 text-foreground/70" />
              </div>
              <h2 className="text-base font-semibold" data-testid="text-public-bands-heading">
                {t("scoreGuide.bandsTitle", "Score Bands")}
              </h2>
            </div>
            <div className="space-y-2">
              {SCORE_BANDS.map((band) => (
                <div key={band.label} className={`rounded-md p-3 ${band.bgClass}`} data-testid={`public-band-${band.label.toLowerCase().replace(/\s/g, "-")}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: band.color }} />
                      <span className={`text-sm font-bold ${band.textClass}`}>{band.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono tabular-nums">
                      {band.min} &ndash; {band.max}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{band.description}</p>
                </div>
              ))}
            </div>
            <div className="h-4 rounded-full overflow-hidden flex">
              {SCORE_BANDS.slice().reverse().map((band) => (
                <div
                  key={band.label}
                  className="h-full"
                  style={{
                    backgroundColor: band.color,
                    width: `${((band.max - band.min + 1) / 551) * 100}%`,
                  }}
                  title={`${band.label}: ${band.min}-${band.max}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-mono">
              <span>300</span>
              <span>450</span>
              <span>580</span>
              <span>670</span>
              <span>750</span>
              <span>850</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-public-guidance">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))" }}>
                <FileText className="w-4 h-4 text-foreground/70" />
              </div>
              <h2 className="text-base font-semibold" data-testid="text-public-guidance-heading">
                {t("scoreGuide.guidanceTitle", "General Guidance")}
              </h2>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p>{t("scoreGuide.note1", "A score of 600 is assigned to borrowers with no credit history (thin file). This reflects insufficient data, not poor credit behavior.")}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <p>{t("scoreGuide.note2", "Scores improve with consistent on-time payments, successful account closures, and diversified credit types.")}</p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p>{t("scoreGuide.note3", "The scoring model is consistent across all 54 African jurisdictions served by the Pan-African Credit Registry.")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
