import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isGhanaMode } from "@/lib/country-mode";

const ALL_LANGS = ["en", "fr", "pt", "ar", "sw", "es", "zh-CN", "zh-TW"] as const;
const GHANA_LANGS = ["en", "fr"] as const;

function resolveLanguage(lang: string | undefined): string {
  if (!lang) return "en";
  const supported = isGhanaMode() ? GHANA_LANGS : ALL_LANGS;
  // Exact match first (handles zh-CN / zh-TW correctly)
  if ((supported as readonly string[]).includes(lang)) return lang;
  for (const s of supported) {
    if (lang.startsWith(s)) return s;
  }
  return "en";
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const ghanaMode = isGhanaMode();
  const langs = ghanaMode ? GHANA_LANGS : ALL_LANGS;

  return (
    <Select
      value={resolveLanguage(i18n.language)}
      onValueChange={(lang) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      }}
    >
      <SelectTrigger
        className="w-[96px] h-8 text-xs gap-1 px-2"
        data-testid="select-language"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {langs.includes("en") && <SelectItem value="en" data-testid="option-lang-en">EN</SelectItem>}
        {langs.includes("fr") && <SelectItem value="fr" data-testid="option-lang-fr">FR</SelectItem>}
        {!ghanaMode && <SelectItem value="pt" data-testid="option-lang-pt">PT</SelectItem>}
        {!ghanaMode && <SelectItem value="ar" data-testid="option-lang-ar">AR</SelectItem>}
        {!ghanaMode && <SelectItem value="sw" data-testid="option-lang-sw">SW</SelectItem>}
        {!ghanaMode && <SelectItem value="es" data-testid="option-lang-es">ES</SelectItem>}
        {!ghanaMode && <SelectItem value="zh-CN" data-testid="option-lang-zh-cn">ZH-S</SelectItem>}
        {!ghanaMode && <SelectItem value="zh-TW" data-testid="option-lang-zh-tw">ZH-T</SelectItem>}
      </SelectContent>
    </Select>
  );
}
