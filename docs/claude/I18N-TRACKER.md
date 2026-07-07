# i18n Tracker — hardcoded public pages

Dictionary status: COMPLETE across en/fr/pt/ar/sw/es/zh-CN/zh-TW (~2900 strings each).
`fr` is typed `typeof en` — the compiler REJECTS a missing French key (enforced completeness).
The gap is pages that don't call `useTranslation` → hardcoded English bypasses the dictionary.

## Translation policy (agreed 2026-07-07)
- en/fr/pt/es: reliable translations written in-session.
- ar/sw/zh-CN/zh-TW: NO key added → clean English fallback (fallbackLng: "en"). Listed below for
  a native translator. Nothing unverified ships. (Add to those dicts only after native review.)

## Per-page recipe (proven on consent-respond)
1. `import { useTranslation }`; `const { t } = useTranslation();`
2. Add a page namespace block to `en` (i18n.ts) AND `fr` (same file, `typeof en` forces it).
3. Add the same block to i18n-pt.ts and i18n-es.ts.
4. Replace each hardcoded string with `t("<ns>.<key>")`; use `{{var}}` interpolation for dynamic text.
5. `npm run check` (fr completeness enforced) + grep the page for leftover `>Capitalized<` text.

## Pages (High-value public-facing set)
| Page | Visible-EN strings | Status |
|---|---|---|
| consent-respond.tsx | ~35 | DONE 2026-07-07 (en/fr/pt/es; ns `consentRespond`) |
| country-selection.tsx | 28 | TODO |
| consumer-portal.tsx | 61 | TODO |
| collections.tsx | 62 | TODO |
| loan-origination.tsx | 68 | TODO |
| collateral-registry.tsx | 102 | TODO |
| telco-lending.tsx | 66 | TODO |
| papps-settlements.tsx | 24 | TODO |

## ar/sw/zh native-review queue
Every namespace added for the pages above currently falls back to English for
Arabic, Swahili, Chinese (CN/TW). When a native translator is engaged, add these
namespaces to i18n-ar.ts, i18n-sw.ts, i18n-zh-cn.ts, i18n-zh-tw.ts:
- consentRespond (done for en/fr/pt/es)
- (append others as pages are completed)
