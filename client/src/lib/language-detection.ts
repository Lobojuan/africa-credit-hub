const supportedLanguages = ["en", "fr", "pt", "ar", "sw", "es", "zh-CN", "zh-TW"] as const;

/** Normalise browser locale variants such as fr-FR and en-GH to UCH locales. */
export function normaliseDetectedLanguage(language?: string | null): string {
  if (!language) return "en";
  const value = language.replace(/_/g, "-").trim();
  if ((supportedLanguages as readonly string[]).includes(value)) return value;

  const lower = value.toLowerCase();
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-mo")) return "zh-TW";
  if (lower.startsWith("zh")) return "zh-CN";

  const base = lower.split("-")[0];
  return (supportedLanguages as readonly string[]).includes(base) ? base : "en";
}
