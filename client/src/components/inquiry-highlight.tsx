import { Flame } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const INQUIRY_PURPOSE_LABELS: Record<string, string> = {
  new_credit: "New credit",
  review: "Account review",
  collection: "Collection",
  regulatory: "Regulatory",
  portfolio_monitoring: "Portfolio monitoring",
};

export const INQUIRY_PURPOSE_TONE: Record<string, string> = {
  new_credit: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  review: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  collection: "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300",
  regulatory: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  portfolio_monitoring: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
};

export const COMPETING_INQUIRY_WINDOW_DAYS = 30;

/**
 * Minimal shape needed by the highlight helpers / row component. Both the
 * cross-product credit-snapshot inquiries and the consumer credit report
 * inquiries can satisfy this shape.
 */
export interface InquiryHighlightData {
  id: string;
  institution: string;
  purpose: string;
  /** ISO timestamp / Date / null. */
  inquiredAt: string | Date | null;
  /** Org id of the lender that made the pull. Optional — when missing we
   * fall back to "non-competing" unless viewerOrgId is also missing. */
  inquiringOrgId?: string | null;
}

export function formatInquiryPurpose(purpose: string): string {
  return INQUIRY_PURPOSE_LABELS[purpose] ?? purpose.replace(/_/g, " ");
}

export function inquiryAgeDays(inquiredAt: string | Date | null): number | null {
  if (!inquiredAt) return null;
  const t = inquiredAt instanceof Date ? inquiredAt.getTime() : new Date(inquiredAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

export function isCompetingInquiry(
  inq: InquiryHighlightData,
  viewerOrgId: string | null,
): boolean {
  if (inq.purpose !== "new_credit") return false;
  if (!inq.inquiringOrgId) return false;
  // If we can't tell which org the viewer belongs to (e.g. consumer viewing
  // their own report), treat any external new_credit pull as competing —
  // that matches the "stand out at a glance" intent: better to over-highlight
  // than to hide a real competing pull.
  if (!viewerOrgId) return true;
  return inq.inquiringOrgId !== viewerOrgId;
}

export function isStaleInquiry(inq: InquiryHighlightData): boolean {
  const age = inquiryAgeDays(inq.inquiredAt);
  if (age === null) return true;
  return age > COMPETING_INQUIRY_WINDOW_DAYS;
}

export function inquiryPurposeBadgeClass(purpose: string): string {
  return INQUIRY_PURPOSE_TONE[purpose] ?? "border-border bg-muted text-muted-foreground";
}

/**
 * Shared row used by both the in-sheet snapshot panel and the popup dialog so
 * the highlight treatment for competing-lender inquiries stays consistent.
 *
 * Highlights at a glance:
 *  - purpose=new_credit from a different org than the viewer => "Competing"
 *    badge + amber/red row tint + flame icon.
 *  - inquiries older than 30 days => muted, faded out, marked "older".
 *  - every row carries a colored purpose pill so the panel is scannable
 *    without reading each line.
 */
export function InquiryRow({
  inq,
  viewerOrgId,
  variant,
}: {
  inq: InquiryHighlightData;
  viewerOrgId: string | null;
  variant: "dialog" | "panel";
}) {
  const competing = isCompetingInquiry(inq, viewerOrgId);
  const stale = isStaleInquiry(inq);
  const testIdPrefix = variant === "dialog" ? "" : "panel-";
  const textSize = variant === "dialog" ? "text-xs" : "text-[11px]";

  const rowTone = competing
    ? "border-l-2 border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/30"
    : "";
  // De-emphasize anything older than the 30-day competing-window so the
  // freshest pulls stand out — even competing rows fade once they're stale,
  // because the actionable signal is "another lender just pulled credit".
  const fade = stale ? "opacity-60" : "";

  return (
    <li
      key={inq.id}
      className={`flex items-start justify-between gap-2 p-2 ${textSize} ${rowTone} ${fade}`.trim()}
      data-testid={`${testIdPrefix}row-snapshot-inquiry-${inq.id}`}
      data-competing={competing ? "true" : "false"}
      data-stale={stale ? "true" : "false"}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`font-medium ${variant === "panel" ? "leading-tight" : ""} truncate`}
            data-testid={`${testIdPrefix}text-snapshot-inquiry-institution-${inq.id}`}
          >
            {inq.institution}
          </span>
          {competing && (
            <Badge
              variant="outline"
              className="shrink-0 h-4 px-1 text-[9px] uppercase tracking-wide font-semibold border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-900/60 dark:text-amber-200"
              data-testid={`${testIdPrefix}badge-snapshot-inquiry-competing-${inq.id}`}
              title="Another lender pulled this borrower's credit for a new facility"
            >
              <Flame className="w-2.5 h-2.5 mr-0.5" />
              Competing
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-sm border px-1 py-px text-[9px] font-medium uppercase tracking-wide ${inquiryPurposeBadgeClass(inq.purpose)}`}
            data-testid={`${testIdPrefix}text-snapshot-inquiry-purpose-${inq.id}`}
          >
            {formatInquiryPurpose(inq.purpose)}
          </span>
          {stale && (
            <span
              className="text-[9px] uppercase tracking-wide text-muted-foreground"
              data-testid={`${testIdPrefix}text-snapshot-inquiry-stale-${inq.id}`}
            >
              · older
            </span>
          )}
        </div>
      </div>
      <div
        className={`text-muted-foreground shrink-0 ${variant === "panel" ? "leading-tight" : ""}`}
        data-testid={`${testIdPrefix}text-snapshot-inquiry-date-${inq.id}`}
      >
        {inq.inquiredAt ? format(new Date(inq.inquiredAt), "dd MMM yyyy") : "—"}
      </div>
    </li>
  );
}

/**
 * Inline pill suitable for use inside an existing table cell (e.g. on the
 * consumer credit report). Keeps the same color tones as `InquiryRow`'s
 * purpose pill.
 */
export function InquiryPurposePill({
  purpose,
  testId,
  className = "",
}: {
  purpose: string;
  testId?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide print:text-[8px] ${inquiryPurposeBadgeClass(purpose)} ${className}`.trim()}
      data-testid={testId}
    >
      {formatInquiryPurpose(purpose)}
    </span>
  );
}

/**
 * Inline "Competing" badge — same tone as the snapshot row's badge, sized to
 * sit alongside an institution name in a table cell.
 */
export function CompetingInquiryBadge({ testId }: { testId?: string }) {
  return (
    <Badge
      variant="outline"
      className="shrink-0 h-4 px-1 text-[9px] uppercase tracking-wide font-semibold border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-900/60 dark:text-amber-200 print:bg-white print:text-amber-900 print:border-amber-700"
      data-testid={testId}
      title="Another lender pulled this borrower's credit for a new facility"
    >
      <Flame className="w-2.5 h-2.5 mr-0.5" />
      Competing
    </Badge>
  );
}
