/**
 * Loto USSD state machine — pure function.
 *
 * USSD aggregators (Africa's Talking, MTN, Orange) all converge on the
 * same input shape: a sessionId, the dialled phone number, the country
 * code, and a "text" field that is the cumulative path of selections
 * separated by "*" (e.g. "1*2*5"). Each invocation we receive returns
 * either:
 *   * { kind: "continue", response, nextState, context } — keep the call
 *     open, show the response, expect more input.
 *   * { kind: "end", response } — terminate the call.
 *
 * Hard rule (Task #286): every menu screen MUST fit in 160 characters.
 * The runMenu helper enforces this and the unit tests below the file
 * exercise each branch so menus stay under the limit even after i18n.
 *
 * The state machine intentionally has NO side effects — the route handler
 *   1. enriches `context` with caller-specific data (ticket count, next draw
 *      date) BEFORE invoking the reducer, so menu screens 1 and 2 render
 *      real values rather than placeholders.
 *   2. persists the resulting `nextState`/`context` to loto_ussd_sessions.
 *   3. executes the side-effect Action (lookup_tickets, claim_prize, etc.)
 *      AFTER the response is dispatched so the user always sees the screen.
 */

import type { SupportedLanguage } from "./loto-message-templates";

export interface UssdInput {
  sessionId: string;
  phoneNumber: string;
  countryCode: string;
  language: SupportedLanguage;
  /** Cumulative selections joined by "*". Empty on first hop. */
  text: string;
  /** Persisted state from prior hop (or "menu:main" on first hop). */
  state?: string;
  context?: UssdContext;
}

/**
 * Strongly-typed reducer context. The route handler enriches this BEFORE
 * calling runUssd() with caller-specific state (ticket count, upcoming draw
 * date, fiscal code). Keeping the shape narrow avoids the typical
 * `Record<string, any>` slop and makes each screen's contract explicit.
 */
export interface UssdContext {
  ticketCount?: number;
  nextDrawDate?: string;
  nextDrawCountdownHours?: number;
  fiscalCode?: string;
  language?: SupportedLanguage;
}

export type UssdAction =
  | { type: "none" }
  | { type: "lookup_tickets"; phoneNumber: string }
  | { type: "lookup_next_draw"; countryCode: string }
  | { type: "claim_prize"; ticketRef: string; phoneNumber: string }
  | { type: "register_fiscal_code"; phoneNumber: string; fiscalCode: string }
  | { type: "set_language"; language: SupportedLanguage };

export interface UssdResult {
  kind: "continue" | "end";
  response: string;          // <=160 chars
  nextState: string;         // persisted to loto_ussd_sessions
  context: UssdContext;
  action: UssdAction;
}

// --- Localised menu strings ----------------------------------------------
// Each menu string is hand-tuned to fit in one USSD page (≤160 chars).

interface MenuBundle {
  main: Record<SupportedLanguage, string>;
  tickets_empty: Record<SupportedLanguage, string>;
  tickets_some: Record<SupportedLanguage, string>;
  next_draw: Record<SupportedLanguage, string>;
  next_draw_unknown: Record<SupportedLanguage, string>;
  claim_ask: Record<SupportedLanguage, string>;
  claim_ok: Record<SupportedLanguage, string>;
  claim_unverified: Record<SupportedLanguage, string>;
  fiscal_ask: Record<SupportedLanguage, string>;
  fiscal_ok: Record<SupportedLanguage, string>;
  language_menu: Record<SupportedLanguage, string>;
  language_set: Record<SupportedLanguage, string>;
  invalid: Record<SupportedLanguage, string>;
}

const MENUS: MenuBundle = {
  main: {
    en: "Loto Fiscal\n1. My tickets\n2. Next draw\n3. Claim prize\n4. Register TIN\n5. Language\n0. Exit",
    fr: "Loto Fiscal\n1. Mes tickets\n2. Tirage suivant\n3. Reclamer\n4. Enregistrer NIF\n5. Langue\n0. Quitter",
    pt: "Loto Fiscal\n1. Bilhetes\n2. Sorteio\n3. Reclamar\n4. Registar NIF\n5. Idioma\n0. Sair",
    ar: "لوتو\n1. تذاكري\n2. السحب القادم\n3. مطالبة\n4. تسجيل الرقم الضريبي\n5. اللغة\n0. خروج",
    sw: "Loto\n1. Tiketi\n2. Droo ijayo\n3. Dai\n4. Sajili TIN\n5. Lugha\n0. Toka",
  },
  tickets_empty: {
    en: "No active tickets. Scan VAT receipts to enter the next draw.",
    fr: "Aucun ticket actif. Scannez vos recus TVA pour le prochain tirage.",
    pt: "Sem bilhetes activos. Escaneie recibos para o proximo sorteio.",
    ar: "لا توجد تذاكر نشطة. امسح الإيصالات للسحب القادم.",
    sw: "Hakuna tiketi. Skani risiti za VAT kwa droo ijayo.",
  },
  tickets_some: {
    en: "You hold {count} ticket(s) for the next draw on {date}.",
    fr: "Vous avez {count} ticket(s) pour le tirage du {date}.",
    pt: "Tem {count} bilhete(s) para o sorteio de {date}.",
    ar: "لديك {count} تذكرة للسحب في {date}.",
    sw: "Una tiketi {count} kwa droo ya {date}.",
  },
  next_draw: {
    en: "Next Loto draw: {date} ({hours}h to go).",
    fr: "Prochain tirage Loto: {date} (dans {hours}h).",
    pt: "Proximo sorteio Loto: {date} ({hours}h).",
    ar: "السحب القادم: {date} (بعد {hours} ساعة).",
    sw: "Droo ijayo: {date} (saa {hours}).",
  },
  next_draw_unknown: {
    en: "No upcoming draw scheduled for your country yet.",
    fr: "Aucun tirage prevu dans votre pays.",
    pt: "Sem sorteio agendado para o seu pais.",
    ar: "لا يوجد سحب مجدول لبلدك.",
    sw: "Hakuna droo iliyopangwa.",
  },
  claim_ask: {
    en: "Enter your winning ticket reference:",
    fr: "Entrez la reference du ticket gagnant:",
    pt: "Insira a referencia do bilhete:",
    ar: "أدخل رقم التذكرة:",
    sw: "Weka rejea ya tiketi:",
  },
  claim_ok: {
    en: "Claim received for {ref}. SMS sent to your verified phone with next steps.",
    fr: "Reclamation recue pour {ref}. SMS envoye au tel verifie avec les etapes.",
    pt: "Reclamacao para {ref}. SMS enviado ao telefone verificado.",
    ar: "تم استلام المطالبة لـ {ref}. تم إرسال رسالة للهاتف المسجل.",
    sw: "Ombi limepokelewa kwa {ref}. SMS imetumwa kwenye simu iliyothibitishwa.",
  },
  claim_unverified: {
    en: "This phone is not verified for Loto Fiscal. Pick option 4 to register first.",
    fr: "Ce telephone n'est pas verifie. Choisissez 4 pour enregistrer d'abord.",
    pt: "Telefone nao verificado. Escolha 4 para registar primeiro.",
    ar: "الهاتف غير مسجل. اختر 4 للتسجيل أولا.",
    sw: "Simu haijathibitishwa. Chagua 4 kusajili kwanza.",
  },
  fiscal_ask: {
    en: "Enter your tax ID (TIN/NIF) to link your receipts:",
    fr: "Entrez votre NIF pour relier vos recus:",
    pt: "Insira o seu NIF:",
    ar: "أدخل الرقم الضريبي:",
    sw: "Weka TIN yako:",
  },
  fiscal_ok: {
    en: "TIN {code} linked. This phone is now verified for Loto Fiscal.",
    fr: "NIF {code} enregistre. Ce telephone est verifie.",
    pt: "NIF {code} registado. Telefone verificado.",
    ar: "تم تسجيل الرقم {code}. الهاتف مفعل.",
    sw: "TIN {code} imesajiliwa.",
  },
  language_menu: {
    en: "Choose language:\n1. English\n2. Francais\n3. Portugues\n4. Kiswahili\n5. العربية",
    fr: "Choisir langue:\n1. English\n2. Francais\n3. Portugues\n4. Kiswahili\n5. العربية",
    pt: "Idioma:\n1. English\n2. Francais\n3. Portugues\n4. Kiswahili\n5. العربية",
    ar: "اللغة:\n1. English\n2. Francais\n3. Portugues\n4. Kiswahili\n5. العربية",
    sw: "Lugha:\n1. English\n2. Francais\n3. Portugues\n4. Kiswahili\n5. العربية",
  },
  language_set: {
    en: "Language updated.",
    fr: "Langue mise a jour.",
    pt: "Idioma actualizado.",
    ar: "تم تحديث اللغة.",
    sw: "Lugha imebadilishwa.",
  },
  invalid: {
    en: "Invalid choice. Try again.",
    fr: "Choix invalide. Reessayez.",
    pt: "Opcao invalida.",
    ar: "اختيار غير صالح.",
    sw: "Chaguo batili.",
  },
};

const MAX_USSD_LEN = 160;

function pick(menu: keyof MenuBundle, lang: SupportedLanguage, vars?: Record<string, string | number>): string {
  let s = MENUS[menu][lang] ?? MENUS[menu].en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  // Hard cap so any localised overrun degrades safely.
  return s.length > MAX_USSD_LEN ? s.slice(0, MAX_USSD_LEN - 1) + "…" : s;
}

const LANGUAGE_BY_CHOICE: Record<string, SupportedLanguage> = {
  "1": "en", "2": "fr", "3": "pt", "4": "sw", "5": "ar",
};

const FISCAL_CODE_RE = /^[A-Za-z0-9-]{4,32}$/;
const TICKET_REF_RE = /^[A-Za-z0-9-]{4,32}$/;

/**
 * Reducer. The route handler:
 *   1. Loads or creates the loto_ussd_sessions row by sessionId.
 *   2. Enriches `context` with ticketCount, nextDrawDate, etc. for screens
 *      that render caller-specific data.
 *   3. Calls runUssd().
 *   4. Persists nextState + context (or deletes the row on END).
 *   5. Executes the returned `action` AFTER the response is dispatched.
 */
export function runUssd(input: UssdInput): UssdResult {
  const lang: SupportedLanguage = input.language ?? "en";
  const ctx: UssdContext = input.context ?? {};
  const path = input.text.split("*").filter(Boolean);
  const top = path[0];

  // First hop or "back to main"
  if (path.length === 0) {
    return {
      kind: "continue",
      response: pick("main", lang),
      nextState: "menu:main",
      context: ctx,
      action: { type: "none" },
    };
  }

  // 0 → exit
  if (top === "0") {
    return {
      kind: "end",
      response:
        lang === "fr" ? "Au revoir." :
        lang === "pt" ? "Adeus." :
        lang === "ar" ? "وداعا." :
        lang === "sw" ? "Kwa heri." :
        "Goodbye.",
      nextState: "end",
      context: ctx,
      action: { type: "none" },
    };
  }

  // 1 → My tickets — context.ticketCount/nextDrawDate are populated by the
  // route handler BEFORE invoking us, so the screen reflects real data.
  if (top === "1" && path.length === 1) {
    const count = ctx.ticketCount ?? 0;
    const drawDate = ctx.nextDrawDate ?? "—";
    return {
      kind: "end",
      response: count > 0
        ? pick("tickets_some", lang, { count, date: drawDate })
        : pick("tickets_empty", lang),
      nextState: "end",
      context: ctx,
      action: { type: "lookup_tickets", phoneNumber: input.phoneNumber },
    };
  }

  // 2 → Next draw date
  if (top === "2" && path.length === 1) {
    const drawDate = ctx.nextDrawDate;
    const hours = ctx.nextDrawCountdownHours ?? 0;
    return {
      kind: "end",
      response: drawDate
        ? pick("next_draw", lang, { date: drawDate, hours })
        : pick("next_draw_unknown", lang),
      nextState: "end",
      context: ctx,
      action: { type: "lookup_next_draw", countryCode: input.countryCode },
    };
  }

  // 3 → Claim prize: ask for ticket ref, then submit
  if (top === "3") {
    if (path.length === 1) {
      return {
        kind: "continue",
        response: pick("claim_ask", lang),
        nextState: "claim:ref",
        context: ctx,
        action: { type: "none" },
      };
    }
    const ticketRef = path[1].trim();
    if (!ticketRef || !TICKET_REF_RE.test(ticketRef)) {
      return {
        kind: "end",
        response: pick("invalid", lang),
        nextState: "end",
        context: ctx,
        action: { type: "none" },
      };
    }
    return {
      kind: "end",
      response: pick("claim_ok", lang, { ref: ticketRef }),
      nextState: "end",
      context: ctx,
      action: { type: "claim_prize", ticketRef, phoneNumber: input.phoneNumber },
    };
  }

  // 4 → Register fiscal code (TIN / NIF). Phone is captured automatically
  // from the USSD caller-id; this binds it to the consumer's tax identity.
  if (top === "4") {
    if (path.length === 1) {
      return {
        kind: "continue",
        response: pick("fiscal_ask", lang),
        nextState: "fiscal:ask",
        context: ctx,
        action: { type: "none" },
      };
    }
    const code = path[1].trim().toUpperCase();
    if (!code || !FISCAL_CODE_RE.test(code)) {
      return {
        kind: "end",
        response: pick("invalid", lang),
        nextState: "end",
        context: ctx,
        action: { type: "none" },
      };
    }
    return {
      kind: "end",
      response: pick("fiscal_ok", lang, { code }),
      nextState: "end",
      context: { ...ctx, fiscalCode: code },
      action: { type: "register_fiscal_code", phoneNumber: input.phoneNumber, fiscalCode: code },
    };
  }

  // 5 → Language picker
  if (top === "5") {
    if (path.length === 1) {
      return {
        kind: "continue",
        response: pick("language_menu", lang),
        nextState: "language:pick",
        context: ctx,
        action: { type: "none" },
      };
    }
    const chosen = LANGUAGE_BY_CHOICE[path[1]];
    if (!chosen) {
      return {
        kind: "end",
        response: pick("invalid", lang),
        nextState: "end",
        context: ctx,
        action: { type: "none" },
      };
    }
    return {
      kind: "end",
      response: pick("language_set", chosen),
      nextState: "end",
      context: { ...ctx, language: chosen },
      action: { type: "set_language", language: chosen },
    };
  }

  return {
    kind: "end",
    response: pick("invalid", lang),
    nextState: "end",
    context: ctx,
    action: { type: "none" },
  };
}

/**
 * Helper exposed for the route handler when a claim is attempted from a phone
 * that isn't verified for any consumer. We want to short-circuit the reducer's
 * happy path with a domain-specific error screen rather than silently SMS the
 * unverified caller.
 */
export function unverifiedClaimResponse(lang: SupportedLanguage): UssdResult {
  return {
    kind: "end",
    response: pick("claim_unverified", lang),
    nextState: "end",
    context: {},
    action: { type: "none" },
  };
}
