import type { ReactNode } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

type PublicPageFrameProps = {
  children: ReactNode;
  mode?: "full" | "compact";
};

/**
 * A deliberate, visible route back to UCH for public pages that do not own a
 * marketing header. Keep this separate from authenticated application chrome.
 */
export function PublicPageFrame({ children, mode = "full" }: PublicPageFrameProps) {
  const { i18n } = useTranslation();
  const french = i18n.resolvedLanguage?.startsWith("fr") ?? false;
  const labels = french
    ? { home: "Accueil", demo: "Démo", security: "Sécurité", contact: "Contact", signIn: "Se connecter", back: "Retour à UCH" }
    : { home: "Home", demo: "Demo", security: "Security", contact: "Contact", signIn: "Sign in", back: "Back to UCH" };

  if (mode === "compact") {
    return (
      <>
        <header className="border-b border-slate-200/70 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100" data-testid="link-public-home">
              <ArrowLeft className="size-4" /> {labels.back}
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/login"><Button size="sm" variant="outline" data-testid="button-public-signin">{labels.signIn}</Button></Link>
            </div>
          </div>
        </header>
        {children}
      </>
    );
  }

  return (
    <>
      <header className="border-b border-slate-200/70 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100" data-testid="link-public-home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-amber-500 text-white"><Building2 className="size-5" /></span>
            <span className="hidden sm:inline">{PLATFORM_COMPANY_NAME}</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Public navigation">
            <Link href="/"><Button variant="ghost" size="sm" className="hidden md:inline-flex">{labels.home}</Button></Link>
            <Link href="/demo"><Button variant="ghost" size="sm" data-testid="link-public-demo">{labels.demo}</Button></Link>
            <Link href="/forensics"><Button variant="ghost" size="sm" className="hidden lg:inline-flex">{french ? "Diagnostic" : "Diagnostic"}</Button></Link>
            <Link href="/security"><Button variant="ghost" size="sm" className="hidden lg:inline-flex"><ShieldCheck className="mr-1 size-3.5" />{labels.security}</Button></Link>
            <Link href="/contact-sales"><Button variant="ghost" size="sm" className="hidden md:inline-flex">{labels.contact}</Button></Link>
            <LanguageSwitcher />
            <Link href="/login"><Button size="sm" data-testid="button-public-signin">{labels.signIn}</Button></Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
