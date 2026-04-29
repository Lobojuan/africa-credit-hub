/**
 * Loto Message Templates — Task #286.
 *
 * Pure-function template renderer. All copy is keyed by (templateKey,
 * language). Templates are intentionally short (≤ 160 char SMS hard limit
 * for the SMS variants; USSD menus must respect 160 chars too because most
 * aggregators truncate beyond that).
 *
 * Why the templates live here and not in the i18n bundle:
 *   - Server-side rendering — no React tree available.
 *   - SMS bodies are *contractual* (legal copy for winner notifications);
 *     keeping them in one server-controlled module makes audit trivial.
 *   - The client-facing i18n strings (the consumer prefs UI labels, admin
 *     dashboard headings, etc.) live in client/src/lib/i18n.ts as usual.
 */

export type MessageLanguage = "en" | "fr";

export type MessageTemplateKey =
  | "winner_sms"
  | "draw_reminder_sms"
  | "merchant_inactive_sms";

export interface RenderedMessage {
  body: string;
  vars: Record<string, string>;
}

interface TemplateBundle {
  en: (vars: Record<string, string>) => string;
  fr: (vars: Record<string, string>) => string;
}

function require(vars: Record<string, string>, ...keys: string[]): void {
  for (const k of keys) {
    if (!vars[k]) throw new Error(`loto template missing required var: ${k}`);
  }
}

const TEMPLATES: Record<MessageTemplateKey, TemplateBundle> = {
  // Winner — short, factual, no marketing language. Includes ticket ref so
  // the consumer can claim in person if SMS spoofing is suspected.
  winner_sms: {
    en: (v) => {
      require(v, "amount", "currency", "ticket", "drawNumber");
      return `LotoFiscal: You WON ${v.currency} ${v.amount} in draw #${v.drawNumber}. Ticket ${v.ticket}. Reply CLAIM or visit your account to receive payout.`;
    },
    fr: (v) => {
      require(v, "amount", "currency", "ticket", "drawNumber");
      return `LotoFiscal: Vous avez GAGNÉ ${v.amount} ${v.currency} au tirage n°${v.drawNumber}. Ticket ${v.ticket}. Répondez CLAIM ou visitez votre compte pour recevoir votre prix.`;
    },
  },
  // T-24h reminder — opt-out token must always be included for compliance.
  draw_reminder_sms: {
    en: (v) => {
      require(v, "drawNumber", "tickets", "closesIn");
      return `LotoFiscal draw #${v.drawNumber} closes in ${v.closesIn}. You have ${v.tickets} ticket(s). Reply STOP to opt out.`;
    },
    fr: (v) => {
      require(v, "drawNumber", "tickets", "closesIn");
      return `Tirage LotoFiscal n°${v.drawNumber} dans ${v.closesIn}. Vous avez ${v.tickets} ticket(s). Répondez STOP pour ne plus recevoir.`;
    },
  },
  // Merchant inactivity nudge — neutral, regulatory tone (this is a
  // compliance reminder, not marketing).
  merchant_inactive_sms: {
    en: (v) => {
      require(v, "shop", "days");
      return `LotoFiscal: ${v.shop} has issued no fiscal receipts in ${v.days} days. Issue receipts to remain compliant. Reply HELP for support.`;
    },
    fr: (v) => {
      require(v, "shop", "days");
      return `LotoFiscal: ${v.shop} n'a émis aucun reçu fiscal depuis ${v.days} jours. Émettez vos reçus pour rester conforme. Répondez HELP pour assistance.`;
    },
  },
};

export function renderTemplate(
  templateKey: MessageTemplateKey,
  language: MessageLanguage,
  vars: Record<string, string>,
): RenderedMessage {
  const bundle = TEMPLATES[templateKey];
  if (!bundle) throw new Error(`unknown loto template: ${templateKey}`);
  const renderer = bundle[language] ?? bundle.en;
  const body = renderer(vars);
  if (body.length > 160) {
    // Hard guard: any template over the SMS frame must be split or shortened.
    // Throwing instead of silently truncating because a winner SMS that
    // loses the prize amount is worse than a delivery failure.
    throw new Error(`loto template ${templateKey}/${language} exceeded 160 chars (${body.length})`);
  }
  return { body, vars };
}
