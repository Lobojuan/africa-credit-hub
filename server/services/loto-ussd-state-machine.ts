/**
 * Loto USSD State Machine — Task #286.
 *
 * Pure-function state machine: same (state, context, input) always yields
 * the same (nextState, displayText, endSession, contextPatch). No DB
 * access, no I/O, no randomness — every transition is unit-testable.
 *
 * Hosting: aggregator (Africa's Talking, Hubtel, MTN/Orange direct) POSTs
 * to /api/loto/ussd/session with { sessionId, msisdn, text } where `text`
 * is the cumulative menu trail joined by "*". The route layer maps that
 * to the (currentState, currentContext, lastInput) inputs for `step()`.
 *
 * Wire format: aggregators expect a body that begins with "CON " for an
 * ongoing session and "END " for terminal screens. The route layer adds
 * those prefixes; this state machine only returns the raw display text.
 *
 * 160-character limit: most aggregators truncate beyond 160 bytes. Every
 * branch below produces ≤ 160 chars; the route layer additionally guards
 * the final body length and audits any truncation event.
 */

export type UssdLanguage = "en" | "fr";

export type UssdState =
  | "root"
  | "register_fc"
  | "register_fc_done"
  | "check_tickets"
  | "next_draw"
  | "claim_prize"
  | "help"
  | "ended";

export interface UssdContext {
  fiscalCode?: string;
  ticketCount?: string;
  nextDrawAt?: string;
  prizeAmount?: string;
  prizeCurrency?: string;
  notes?: string;
}

export interface UssdStepInput {
  state: UssdState;
  context: UssdContext;
  language: UssdLanguage;
  // Single-key input (the digit just pressed) OR an empty string for the
  // session-open call where the gateway hands us no input yet.
  input: string;
}

export interface UssdStepResult {
  state: UssdState;
  displayText: string;
  endSession: boolean;
  context: UssdContext;
}

const COPY = {
  en: {
    rootMenu:
      "LotoFiscal\n1. Register fiscal code\n2. Check my tickets\n3. Next draw\n4. Claim prize\n5. Help",
    registerPrompt: "Enter your fiscal code (digits only):",
    registerInvalid: "Invalid fiscal code. Must be 4-20 digits.",
    registerOk: "Fiscal code saved. You will be entered into the next draw if eligible.",
    checkPrompt: (n: string) => `You have ${n} ticket(s) for the current period.`,
    checkNoData: "No tickets recorded for the current period yet.",
    nextPrompt: (when: string) => `Next draw scheduled for ${when}.`,
    nextNoData: "No upcoming draw scheduled.",
    claimPrompt: (amt: string, cur: string) =>
      `You have an unclaimed prize of ${cur} ${amt}. Visit your nearest agent or your account to receive payout.`,
    claimNone: "No unclaimed prize on record.",
    help: "Reply via menu. Reply STOP to opt out of reminders. Issued by LotoFiscal.",
    invalid: "Invalid choice.",
    end: "Thank you for using LotoFiscal.",
  },
  fr: {
    rootMenu:
      "LotoFiscal\n1. Enregistrer code fiscal\n2. Voir mes tickets\n3. Prochain tirage\n4. Réclamer prix\n5. Aide",
    registerPrompt: "Entrez votre code fiscal (chiffres seulement):",
    registerInvalid: "Code fiscal invalide. Doit faire 4-20 chiffres.",
    registerOk: "Code fiscal enregistré. Vous participez au prochain tirage si éligible.",
    checkPrompt: (n: string) => `Vous avez ${n} ticket(s) pour la période en cours.`,
    checkNoData: "Aucun ticket enregistré pour cette période.",
    nextPrompt: (when: string) => `Prochain tirage prévu le ${when}.`,
    nextNoData: "Aucun tirage à venir.",
    claimPrompt: (amt: string, cur: string) =>
      `Prix non réclamé: ${amt} ${cur}. Rendez-vous chez un agent ou dans votre compte pour le retirer.`,
    claimNone: "Aucun prix non réclamé.",
    help: "Suivez le menu. Répondez STOP pour ne plus recevoir. Émis par LotoFiscal.",
    invalid: "Choix invalide.",
    end: "Merci d'utiliser LotoFiscal.",
  },
} as const;

function clamp160(text: string): string {
  // Defensive — every branch is already crafted for ≤160. If the runtime
  // composition ever exceeds it (e.g. a very long fiscal code echoed back)
  // we trim and append an ellipsis so the gateway accepts the response.
  if (text.length <= 160) return text;
  return text.slice(0, 157) + "...";
}

export function step(input: UssdStepInput): UssdStepResult {
  const copy = COPY[input.language] ?? COPY.en;
  const ctx: UssdContext = { ...input.context };

  // Session open or returning to the root menu.
  if (input.state === "root") {
    if (input.input === "" || input.input === "0") {
      return { state: "root", displayText: clamp160(copy.rootMenu), endSession: false, context: ctx };
    }
    switch (input.input) {
      case "1":
        return { state: "register_fc", displayText: clamp160(copy.registerPrompt), endSession: false, context: ctx };
      case "2": {
        const n = ctx.ticketCount;
        if (n && n !== "0") {
          return { state: "ended", displayText: clamp160(copy.checkPrompt(n)), endSession: true, context: ctx };
        }
        return { state: "ended", displayText: clamp160(copy.checkNoData), endSession: true, context: ctx };
      }
      case "3": {
        const when = ctx.nextDrawAt;
        if (when) {
          return { state: "ended", displayText: clamp160(copy.nextPrompt(when)), endSession: true, context: ctx };
        }
        return { state: "ended", displayText: clamp160(copy.nextNoData), endSession: true, context: ctx };
      }
      case "4": {
        const amt = ctx.prizeAmount;
        const cur = ctx.prizeCurrency;
        if (amt && cur) {
          return { state: "ended", displayText: clamp160(copy.claimPrompt(amt, cur)), endSession: true, context: ctx };
        }
        return { state: "ended", displayText: clamp160(copy.claimNone), endSession: true, context: ctx };
      }
      case "5":
        return { state: "ended", displayText: clamp160(copy.help), endSession: true, context: ctx };
      default:
        return { state: "root", displayText: clamp160(`${copy.invalid}\n${copy.rootMenu}`), endSession: false, context: ctx };
    }
  }

  if (input.state === "register_fc") {
    const value = input.input.trim();
    if (!/^\d{4,20}$/.test(value)) {
      return { state: "register_fc", displayText: clamp160(`${copy.registerInvalid}\n${copy.registerPrompt}`), endSession: false, context: ctx };
    }
    ctx.fiscalCode = value;
    return { state: "register_fc_done", displayText: clamp160(copy.registerOk), endSession: true, context: ctx };
  }

  // Anything else is treated as a no-op end (defensive).
  return { state: "ended", displayText: clamp160(copy.end), endSession: true, context: ctx };
}
