/**
 * Loto SMS / push / USSD copy library.
 *
 * Every template is keyed by:
 *   * templateKey — the message kind (winner_sms, draw_reminder, etc.)
 *   * language    — two-letter language code (en, fr, pt, ar, sw)
 *
 * Country-specific overrides are layered on top via per-country branding
 * derived from shared/tax-authority.ts (e.g. "DGI" vs "FIRS").
 *
 * SMS rule (Task #286): every SMS template MUST render to ≤160 ASCII
 * characters after substitution; renderTemplate enforces this and falls
 * back to the English template if a localised one runs over the limit.
 */

import { getTaxAuthorityProfile } from "@shared/tax-authority";

export type LotoTemplateKey =
  | "winner_sms"
  | "winner_push"
  | "draw_reminder_sms"
  | "merchant_inactivity_sms"
  | "merchant_inactivity_push"
  | "claim_instructions_sms";

export type SupportedLanguage = "en" | "fr" | "pt" | "ar" | "sw";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "fr", "pt", "ar", "sw"];

export interface TemplateVars {
  // Common
  authority?: string;          // "DGI", "FIRS", "KRA", ...
  productLabel?: string;       // "Loto Fiscal" | "Verified Receipts"
  optOutToken?: string;        // for SMS unsubscribe link
  // Winner
  winnerName?: string;
  prizeAmount?: string;
  currency?: string;
  ticketRef?: string;
  drawNumber?: number | string;
  // Reminder
  hoursLeft?: number | string;
  ticketCount?: number | string;
  // Merchant inactivity
  shopName?: string;
  daysSinceLastReceipt?: number | string;
}

interface TemplateBundle {
  en: string;
  fr?: string;
  pt?: string;
  ar?: string;
  sw?: string;
}

const TEMPLATES: Record<LotoTemplateKey, TemplateBundle> = {
  // Winner notification — winner SMS always sends regardless of opt-out.
  // Kept to ~145 chars so a 5-char STOP suffix still fits when the unsub
  // token is appended for marketing-style follow-ups (winners aren't
  // marketing, but the template is reused for prize-claim reminders).
  winner_sms: {
    en: "Congrats {winnerName}! Your {productLabel} ticket {ticketRef} won {prizeAmount} {currency} in draw #{drawNumber}. Reply CLAIM to receive your prize.",
    fr: "Bravo {winnerName}! Votre ticket {productLabel} {ticketRef} a gagné {prizeAmount} {currency} au tirage #{drawNumber}. Répondez RECLAMER pour le retrait.",
    pt: "Parabéns {winnerName}! O seu bilhete {productLabel} {ticketRef} ganhou {prizeAmount} {currency} no sorteio #{drawNumber}. Responda RECLAMAR.",
    ar: "تهانينا {winnerName}! تذكرتك {ticketRef} ربحت {prizeAmount} {currency} في السحب #{drawNumber}. أرسل CLAIM للمطالبة.",
    sw: "Hongera {winnerName}! Tiketi yako {ticketRef} imeshinda {prizeAmount} {currency} kwenye droo #{drawNumber}. Jibu CLAIM kupata zawadi.",
  },
  winner_push: {
    en: "🎉 You won {prizeAmount} {currency}! Ticket {ticketRef} from draw #{drawNumber}. Tap to claim.",
    fr: "🎉 Vous avez gagné {prizeAmount} {currency}! Ticket {ticketRef} du tirage #{drawNumber}.",
    pt: "🎉 Ganhou {prizeAmount} {currency}! Bilhete {ticketRef} sorteio #{drawNumber}.",
    ar: "🎉 ربحت {prizeAmount} {currency}! تذكرة {ticketRef} السحب #{drawNumber}.",
    sw: "🎉 Umeshinda {prizeAmount} {currency}! Tiketi {ticketRef} droo #{drawNumber}.",
  },
  draw_reminder_sms: {
    en: "{authority} {productLabel}: draw closes in {hoursLeft}h. You hold {ticketCount} ticket(s). Scan more receipts before time runs out. Reply STOP to opt out.",
    fr: "{authority} {productLabel}: tirage dans {hoursLeft}h. Vous avez {ticketCount} ticket(s). Scannez plus de reçus. Répondez STOP pour arrêter.",
    pt: "{authority} {productLabel}: sorteio em {hoursLeft}h. Tem {ticketCount} bilhete(s). Escaneie mais recibos. Responda STOP.",
    ar: "{authority}: السحب خلال {hoursLeft} ساعة. لديك {ticketCount} تذكرة. أرسل STOP للإيقاف.",
    sw: "{authority}: droo baada ya saa {hoursLeft}. Una tiketi {ticketCount}. Skani risiti zaidi. Jibu STOP.",
  },
  merchant_inactivity_sms: {
    en: "{authority}: {shopName} has issued no fiscal receipts for {daysSinceLastReceipt} days. Please resume issuing receipts to stay compliant. Reply HELP for support.",
    fr: "{authority}: {shopName} n'a émis aucun reçu fiscal depuis {daysSinceLastReceipt} jours. Reprenez l'émission pour rester conforme. Tapez AIDE.",
    pt: "{authority}: {shopName} não emite recibos há {daysSinceLastReceipt} dias. Retome para manter conformidade. Responda AJUDA.",
    ar: "{authority}: {shopName} لم يصدر إيصالات منذ {daysSinceLastReceipt} أيام. استأنف الإصدار للامتثال.",
    sw: "{authority}: {shopName} haijatoa risiti kwa siku {daysSinceLastReceipt}. Endelea kutoa kufuata sheria.",
  },
  merchant_inactivity_push: {
    en: "Reminder: no fiscal receipts issued in the last {daysSinceLastReceipt} days at {shopName}. Tap to issue one now.",
    fr: "Rappel: aucun reçu fiscal émis depuis {daysSinceLastReceipt} jours à {shopName}.",
    pt: "Lembrete: sem recibos há {daysSinceLastReceipt} dias em {shopName}.",
    ar: "تذكير: لا توجد إيصالات منذ {daysSinceLastReceipt} يوم في {shopName}.",
    sw: "Kumbusho: hakuna risiti kwa siku {daysSinceLastReceipt} kwa {shopName}.",
  },
  claim_instructions_sms: {
    en: "{productLabel}: to claim {prizeAmount} {currency} for ticket {ticketRef}, dial *483*1# from your verified phone within 30 days.",
    fr: "{productLabel}: pour réclamer {prizeAmount} {currency} (ticket {ticketRef}), composez *483*1# depuis votre téléphone vérifié sous 30 jours.",
    pt: "{productLabel}: para reclamar {prizeAmount} {currency} (bilhete {ticketRef}), disque *483*1# em 30 dias.",
    ar: "للمطالبة بـ {prizeAmount} {currency} للتذكرة {ticketRef}، اتصل بـ *483*1#.",
    sw: "Kupata {prizeAmount} {currency} kwa tiketi {ticketRef}, piga *483*1# kwa siku 30.",
  },
};

const SMS_LIMIT = 160;

function substitute(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof TemplateVars) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

/**
 * Render a template for the given language, falling back to English if:
 *   * the localised version is missing, OR
 *   * the localised version exceeds 160 chars after substitution
 *     (real GSM-7 SMS limit; templates above that get split by carriers
 *     into multi-part messages and billed per-segment, which we want to
 *     avoid in low-margin pilot markets).
 *
 * Returns BOTH the rendered body and the chosen language so the caller
 * can persist the actual language used (the consumer's preference may
 * silently degrade to English if the localised template overruns).
 */
export function renderTemplate(
  templateKey: LotoTemplateKey,
  language: SupportedLanguage | string,
  vars: TemplateVars,
  countryCode?: string,
): { body: string; language: SupportedLanguage } {
  const lang = (SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
    ? language
    : "en") as SupportedLanguage;
  const bundle = TEMPLATES[templateKey];

  // Fill country-derived defaults so callers don't have to thread auth/product
  // labels through every dispatch site.
  const profile = countryCode ? getTaxAuthorityProfile(countryCode) : null;
  const enrichedVars: TemplateVars = {
    authority: profile?.taxAuthority,
    productLabel: profile?.productLabel,
    ...vars,
  };

  const localised = bundle[lang] ?? bundle.en;
  const rendered = substitute(localised, enrichedVars);
  const isSms = templateKey.endsWith("_sms");

  if (isSms && rendered.length > SMS_LIMIT && lang !== "en") {
    // Localised version overruns — fall back to English to keep one segment.
    const fallback = substitute(bundle.en, enrichedVars);
    return { body: fallback.slice(0, SMS_LIMIT), language: "en" };
  }
  return {
    body: isSms ? rendered.slice(0, SMS_LIMIT) : rendered,
    language: lang,
  };
}

/** Useful for tests + admin "preview template" UI. */
export function listTemplateKeys(): LotoTemplateKey[] {
  return Object.keys(TEMPLATES) as LotoTemplateKey[];
}
