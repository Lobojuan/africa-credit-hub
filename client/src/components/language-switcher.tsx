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

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language?.startsWith("fr") ? "fr" : i18n.language?.startsWith("pt") ? "pt" : "en"}
      onValueChange={(lang) => i18n.changeLanguage(lang)}
    >
      <SelectTrigger
        className="w-[72px] h-8 text-xs gap-1 px-2"
        data-testid="select-language"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en" data-testid="option-lang-en">EN</SelectItem>
        <SelectItem value="fr" data-testid="option-lang-fr">FR</SelectItem>
        <SelectItem value="pt" data-testid="option-lang-pt">PT</SelectItem>
      </SelectContent>
    </Select>
  );
}
