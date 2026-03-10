import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import {
  Calculator,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Percent,
  Clock,
  CreditCard,
  Search,
  Scale,
  BarChart3,
  FileText,
} from "lucide-react";

const SCORE_BANDS = [
  { min: 750, max: 850, label: "Excellent", color: "hsl(142 55% 40%)", bgClass: "bg-emerald-100 dark:bg-emerald-950/40", textClass: "text-emerald-700 dark:text-emerald-400", description: "Outstanding credit profile. Borrowers in this range demonstrate exceptional payment history, low utilization, and diversified accounts." },
  { min: 670, max: 749, label: "Good", color: "hsl(175 55% 28%)", bgClass: "bg-teal-100 dark:bg-teal-950/40", textClass: "text-teal-700 dark:text-teal-400", description: "Strong credit profile. Minor issues may exist but overall responsible credit behavior is evident." },
  { min: 580, max: 669, label: "Fair", color: "hsl(43 80% 55%)", bgClass: "bg-amber-100 dark:bg-amber-950/40", textClass: "text-amber-700 dark:text-amber-400", description: "Moderate credit risk. Some late payments or high utilization may be present. Room for improvement." },
  { min: 450, max: 579, label: "Poor", color: "hsl(14 70% 50%)", bgClass: "bg-orange-100 dark:bg-orange-950/40", textClass: "text-orange-700 dark:text-orange-400", description: "Below-average credit profile. Multiple negative factors detected including delinquencies or defaults." },
  { min: 300, max: 449, label: "Very Poor", color: "hsl(0 72% 42%)", bgClass: "bg-red-100 dark:bg-red-950/40", textClass: "text-red-700 dark:text-red-400", description: "Significant credit risk. Severe delinquencies, write-offs, or active court judgments are likely present." },
];

const SCORING_FACTORS = [
  { key: "paymentHistory", label: "Payment History", weight: 35, icon: CheckCircle, description: "On-time payments vs. delinquencies, defaults, and write-offs across all accounts." },
  { key: "creditUtilization", label: "Credit Utilization", weight: 30, icon: Percent, description: "Total outstanding debt relative to credit limits and original loan amounts." },
  { key: "creditHistoryLength", label: "Length of Credit History", weight: 15, icon: Clock, description: "Age of oldest and newest accounts, and the average age across all credit facilities." },
  { key: "newCreditInquiries", label: "New Credit Inquiries", weight: 10, icon: Search, description: "Number of recent hard inquiries from lenders checking creditworthiness." },
  { key: "accountMix", label: "Account Mix", weight: 10, icon: CreditCard, description: "Diversity of credit types: personal loans, mortgages, trade finance, microfinance, etc." },
];

const REASON_CODES = [
  { code: "STRONG_REPAYMENT_HISTORY", impact: "positive", description: "Over 80% of accounts are current or successfully closed with no delinquencies." },
  { code: "EXCELLENT_PAYMENT_RECORD", impact: "positive", description: "Three or more accounts with perfect payment history and no write-offs." },
  { code: "GOOD_STANDING", impact: "positive", description: "No significant negative factors detected. Credit profile is in good standing." },
  { code: "THIN_FILE_LIMITED_HISTORY", impact: "neutral", description: "Insufficient credit history to generate a comprehensive score. Default baseline score applied." },
  { code: "DELINQUENT_ACCOUNTS", impact: "negative", description: "One or more accounts are past due (delinquent or in default status)." },
  { code: "WRITTEN_OFF_ACCOUNTS", impact: "negative", description: "One or more accounts have been written off as uncollectable by the lender." },
  { code: "RESTRUCTURED_ACCOUNTS", impact: "negative", description: "One or more accounts have been restructured, indicating prior repayment difficulty." },
  { code: "ACTIVE_COURT_JUDGMENTS", impact: "negative", description: "Active court judgments (liens, bankruptcy, lawsuits) exist against the borrower." },
  { code: "HIGH_INQUIRY_VOLUME", impact: "negative", description: "More than 5 credit inquiries recorded, suggesting aggressive credit-seeking behavior." },
  { code: "HIGH_DEBT_LEVEL", impact: "negative", description: "Total outstanding debt exceeds 1,000,000 in the base currency across all accounts." },
  { code: "POLITICALLY_EXPOSED_PERSON", impact: "neutral", description: "Borrower is flagged as a Politically Exposed Person (PEP), requiring enhanced due diligence." },
];

function simulateScore(params: {
  currentAccounts: number;
  closedAccounts: number;
  delinquentAccounts: number;
  writtenOffAccounts: number;
  restructuredAccounts: number;
  activeJudgments: number;
  inquiryCount: number;
  totalDebt: number;
  isPep: boolean;
}) {
  const totalAccounts =
    params.currentAccounts +
    params.closedAccounts +
    params.delinquentAccounts +
    params.writtenOffAccounts +
    params.restructuredAccounts;

  const reasonCodes: string[] = [];

  if (totalAccounts === 0) {
    return { score: 600, reasonCodes: ["THIN_FILE_LIMITED_HISTORY"] };
  }

  const positiveAccounts = params.currentAccounts + params.closedAccounts;
  const onTimeRatio = positiveAccounts / totalAccounts;

  let score = Math.round(
    300 +
      onTimeRatio * 500 -
      params.delinquentAccounts * 50 -
      params.writtenOffAccounts * 75 -
      params.restructuredAccounts * 20 -
      params.activeJudgments * 40 -
      Math.min(params.inquiryCount, 20) * 5
  );

  score = Math.max(300, Math.min(850, score));

  if (params.delinquentAccounts > 0) reasonCodes.push("DELINQUENT_ACCOUNTS");
  if (params.writtenOffAccounts > 0) reasonCodes.push("WRITTEN_OFF_ACCOUNTS");
  if (params.restructuredAccounts > 0) reasonCodes.push("RESTRUCTURED_ACCOUNTS");
  if (params.activeJudgments > 0) reasonCodes.push("ACTIVE_COURT_JUDGMENTS");
  if (params.inquiryCount > 5) reasonCodes.push("HIGH_INQUIRY_VOLUME");
  if (params.totalDebt > 1000000) reasonCodes.push("HIGH_DEBT_LEVEL");
  if (params.isPep) reasonCodes.push("POLITICALLY_EXPOSED_PERSON");
  if (onTimeRatio > 0.8 && params.delinquentAccounts === 0) reasonCodes.push("STRONG_REPAYMENT_HISTORY");
  if (totalAccounts >= 3 && onTimeRatio === 1 && params.writtenOffAccounts === 0) reasonCodes.push("EXCELLENT_PAYMENT_RECORD");
  if (reasonCodes.length === 0) reasonCodes.push("GOOD_STANDING");

  return { score, reasonCodes };
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  testId,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  testId: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className="text-xs font-semibold tabular-nums" data-testid={`value-${testId}`}>
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
        data-testid={`slider-${testId}`}
      />
    </div>
  );
}

export default function CreditScoreMethodologyPage() {
  const { t } = useTranslation();

  const [simParams, setSimParams] = useState({
    currentAccounts: 3,
    closedAccounts: 1,
    delinquentAccounts: 0,
    writtenOffAccounts: 0,
    restructuredAccounts: 0,
    activeJudgments: 0,
    inquiryCount: 2,
    totalDebt: 50000,
    isPep: false,
  });

  const simResult = useMemo(() => simulateScore(simParams), [simParams]);

  const updateParam = (key: keyof typeof simParams, value: number | boolean) => {
    setSimParams((prev) => ({ ...prev, [key]: value }));
  };

  const resetSimulator = () => {
    setSimParams({
      currentAccounts: 3,
      closedAccounts: 1,
      delinquentAccounts: 0,
      writtenOffAccounts: 0,
      restructuredAccounts: 0,
      activeJudgments: 0,
      inquiryCount: 2,
      totalDebt: 50000,
      isPep: false,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          {t("creditScoreMethodology.title", "Credit Score Methodology")}
        </h1>
        <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
          {t("creditScoreMethodology.subtitle", "Understand how credit scores are calculated, what factors matter, and how to interpret results.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card data-testid="card-scoring-formula">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))" }}>
                  <Calculator className="w-4 h-4 text-foreground/70" />
                </div>
                <h2 className="text-base font-semibold" data-testid="text-formula-heading">
                  {t("creditScoreMethodology.formulaTitle", "Scoring Formula Breakdown")}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("creditScoreMethodology.formulaDescription", "The credit score ranges from 300 to 850 and is computed using a weighted formula that evaluates five key dimensions of a borrower's credit profile.")}
              </p>
              <div className="space-y-3">
                {SCORING_FACTORS.map((factor) => (
                  <div key={factor.key} className="flex items-start gap-3" data-testid={`factor-${factor.key}`}>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `hsl(175 55% 28% / ${factor.weight / 50})` }}>
                      <factor.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{factor.label}</span>
                        <Badge variant="secondary" className="text-[10px]">{factor.weight}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{factor.description}</p>
                    </div>
                    <div className="w-20 shrink-0">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(factor.weight / 35) * 100}%`,
                            background: "linear-gradient(90deg, hsl(175 55% 35%), hsl(142 55% 40%))",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-score-bands">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))" }}>
                  <BarChart3 className="w-4 h-4 text-foreground/70" />
                </div>
                <h2 className="text-base font-semibold" data-testid="text-bands-heading">
                  {t("creditScoreMethodology.bandsTitle", "Score Band Chart")}
                </h2>
              </div>
              <div className="space-y-2">
                {SCORE_BANDS.map((band) => (
                  <div key={band.label} className={`rounded-md p-3 ${band.bgClass}`} data-testid={`band-${band.label.toLowerCase().replace(/\s/g, "-")}`}>
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
              <div className="h-4 rounded-full overflow-hidden flex" data-testid="band-visual-bar">
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

          <Card data-testid="card-reason-codes">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))" }}>
                  <BookOpen className="w-4 h-4 text-foreground/70" />
                </div>
                <h2 className="text-base font-semibold" data-testid="text-reason-codes-heading">
                  {t("creditScoreMethodology.reasonCodesTitle", "Reason Code Glossary")}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("creditScoreMethodology.reasonCodesDescription", "Each credit report includes reason codes explaining the key factors that influenced the score. Here is the complete glossary.")}
              </p>
              <div className="space-y-2">
                {REASON_CODES.map((rc) => (
                  <div
                    key={rc.code}
                    className="flex items-start gap-3 rounded-md p-3 border border-border/50"
                    data-testid={`reason-code-${rc.code}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {rc.impact === "positive" ? (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      ) : rc.impact === "negative" ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-semibold font-mono">{rc.code}</code>
                        <Badge
                          variant={rc.impact === "positive" ? "default" : rc.impact === "negative" ? "destructive" : "secondary"}
                          className="text-[9px]"
                        >
                          {rc.impact === "positive" ? "Positive" : rc.impact === "negative" ? "Negative" : "Neutral"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="lg:sticky lg:top-4" data-testid="card-score-simulator">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))" }}>
                    <Scale className="w-4 h-4 text-foreground/70" />
                  </div>
                  <h2 className="text-base font-semibold" data-testid="text-simulator-heading">
                    {t("creditScoreMethodology.simulatorTitle", "Score Simulator")}
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={resetSimulator} data-testid="button-reset-simulator">
                  {t("creditScoreMethodology.reset", "Reset")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("creditScoreMethodology.simulatorDescription", "Adjust parameters below to see how different factors impact the credit score in real time.")}
              </p>

              <div className="flex justify-center py-2">
                <CreditScoreGauge score={simResult.score} size={160} testId="gauge-simulator" />
              </div>

              <div className="space-y-4">
                <SliderInput
                  label={t("creditScoreMethodology.currentAccounts", "Current Accounts")}
                  value={simParams.currentAccounts}
                  onChange={(v) => updateParam("currentAccounts", v)}
                  min={0}
                  max={20}
                  testId="current-accounts"
                />
                <SliderInput
                  label={t("creditScoreMethodology.closedAccounts", "Closed Accounts")}
                  value={simParams.closedAccounts}
                  onChange={(v) => updateParam("closedAccounts", v)}
                  min={0}
                  max={20}
                  testId="closed-accounts"
                />
                <SliderInput
                  label={t("creditScoreMethodology.delinquentAccounts", "Delinquent / Default Accounts")}
                  value={simParams.delinquentAccounts}
                  onChange={(v) => updateParam("delinquentAccounts", v)}
                  min={0}
                  max={10}
                  testId="delinquent-accounts"
                />
                <SliderInput
                  label={t("creditScoreMethodology.writtenOffAccounts", "Written-Off Accounts")}
                  value={simParams.writtenOffAccounts}
                  onChange={(v) => updateParam("writtenOffAccounts", v)}
                  min={0}
                  max={10}
                  testId="written-off-accounts"
                />
                <SliderInput
                  label={t("creditScoreMethodology.restructuredAccounts", "Restructured Accounts")}
                  value={simParams.restructuredAccounts}
                  onChange={(v) => updateParam("restructuredAccounts", v)}
                  min={0}
                  max={10}
                  testId="restructured-accounts"
                />
                <SliderInput
                  label={t("creditScoreMethodology.activeJudgments", "Active Court Judgments")}
                  value={simParams.activeJudgments}
                  onChange={(v) => updateParam("activeJudgments", v)}
                  min={0}
                  max={10}
                  testId="active-judgments"
                />
                <SliderInput
                  label={t("creditScoreMethodology.inquiries", "Credit Inquiries")}
                  value={simParams.inquiryCount}
                  onChange={(v) => updateParam("inquiryCount", v)}
                  min={0}
                  max={20}
                  testId="inquiry-count"
                />
                <SliderInput
                  label={t("creditScoreMethodology.totalDebt", "Total Debt")}
                  value={simParams.totalDebt}
                  onChange={(v) => updateParam("totalDebt", v)}
                  min={0}
                  max={5000000}
                  step={10000}
                  testId="total-debt"
                />
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("creditScoreMethodology.pepFlag", "Politically Exposed Person")}
                  </label>
                  <button
                    onClick={() => updateParam("isPep", !simParams.isPep)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${simParams.isPep ? "bg-primary" : "bg-muted"}`}
                    data-testid="toggle-pep"
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${simParams.isPep ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("creditScoreMethodology.activeReasonCodes", "Active Reason Codes")}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {simResult.reasonCodes.map((code) => {
                    const rc = REASON_CODES.find((r) => r.code === code);
                    return (
                      <Badge
                        key={code}
                        variant={
                          rc?.impact === "positive"
                            ? "default"
                            : rc?.impact === "negative"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[9px] font-mono"
                        data-testid={`sim-reason-${code}`}
                      >
                        {code}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-interpretation-guide">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))" }}>
                  <FileText className="w-4 h-4 text-foreground/70" />
                </div>
                <h2 className="text-base font-semibold" data-testid="text-guide-heading">
                  {t("creditScoreMethodology.guideTitle", "Interpretation Guide")}
                </h2>
              </div>
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p>{t("creditScoreMethodology.guideNote1", "A score of 600 is automatically assigned when a borrower has no credit accounts (thin file). This baseline score reflects insufficient data rather than poor credit behavior.")}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <p>{t("creditScoreMethodology.guideNote2", "Scores improve as borrowers maintain current accounts with on-time payments and successfully close facilities. Diversified account types also contribute positively.")}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <p>{t("creditScoreMethodology.guideNote3", "The scoring model is consistent across all 54 African jurisdictions served by the registry. Regulatory adjustments may apply per central bank requirements.")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
