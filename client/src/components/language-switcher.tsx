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

const SUPPORTED_LANGS = ["en", "fr", "pt", "ar", "sw"] as const;

function resolveLanguage(lang: string | undefined): string {
  if (!lang) return "en";
  for (const supported of SUPPORTED_LANGS) {
    if (lang.startsWith(supported)) return supported;
  }
  return "en";
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Select
      value={resolveLanguage(i18n.language)}
      onValueChange={(lang) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      }}
    >
      <SelectTrigger
        className="w-[80px] h-8 text-xs gap-1 px-2"
        data-testid="select-language"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en" data-testid="option-lang-en">EN</SelectItem>
        <SelectItem value="fr" data-testid="option-lang-fr">FR</SelectItem>
        <SelectItem value="pt" data-testid="option-lang-pt">PT</SelectItem>
        <SelectItem value="ar" data-testid="option-lang-ar">AR</SelectItem>
        <SelectItem value="sw" data-testid="option-lang-sw">SW</SelectItem>
      </SelectContent>
    </Select>
  );
}
