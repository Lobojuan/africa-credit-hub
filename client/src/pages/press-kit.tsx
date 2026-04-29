import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Building2, Layers, Download, Mail, Newspaper,
  ShieldCheck, Globe, Banknote, Receipt, Package as PackageIcon,
  CreditCard, Quote,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import { Seo } from "@/components/seo";

const FACTS: { label: string; value: string }[] = [
  { label: "Countries supported", value: "54 — every African market" },
  { label: "Languages", value: "EN · FR · PT · AR · SW · ES · ZH" },
  { label: "Products", value: "Credit Bureau · Collateral Registry · Loto Fiscal" },
  { label: "Architecture", value: "Consent-first cross-product gateway" },
  { label: "Regulator integrations", value: "BoG · CBN · BCEAO · BEAC · CBK · BSL" },
  { label: "Legal regimes", value: "OHADA · UCC-9 · Common Law · Civil Law" },
  { label: "Audit trail", value: "Blockchain-anchored, regulator-filterable" },
  { label: "Data protection", value: "PII encrypted at rest, MFA, RBAC, full audit" },
];

const QUOTES: { quote: string; who: string }[] = [
  {
    quote:
      "Africa Credit Hub is what TransUnion would build if they started today, for Africa, with consent baked in and fiscal data as the unlock for the unbanked.",
    who: "Founder narrative",
  },
  {
    quote:
      "Every cross-product data flow goes through one auditable bridge, with a consent ID, purpose, and expiry. No silent fallbacks. Ever.",
    who: "Platform architecture principle",
  },
];

const COVERAGE = [
  { region: "West Africa", countries: "Ghana, Nigeria, Côte d'Ivoire, Senegal, Mali, Burkina Faso, Sierra Leone, Liberia, +9 more" },
  { region: "East Africa", countries: "Kenya, Tanzania, Uganda, Rwanda, Ethiopia, +6 more" },
  { region: "Central Africa", countries: "Cameroon, DRC, Chad, Gabon, CAR, +4 more" },
  { region: "Southern Africa", countries: "South Africa, Zambia, Zimbabwe, Mozambique, Botswana, +5 more" },
  { region: "North Africa", countries: "Egypt, Morocco, Algeria, Tunisia, Libya, Sudan" },
];

const PRODUCT_BLURBS: { id: string; name: string; line: string; icon: typeof CreditCard }[] = [
  { id: "credit", name: "Credit Bureau", line: "Pan-African consumer & business credit reporting with AI-driven portfolio intelligence and regulator-ready exports.", icon: CreditCard },
  { id: "collateral", name: "Collateral Registry", line: "Movable-asset lien registration across OHADA, UCC-9, Common and Civil regimes — PMSI, certificates, search.", icon: PackageIcon },
  { id: "loto", name: "Loto Fiscal", line: "Verified VAT-receipt platform that doubles as alternative-data scoring for thin-file merchants.", icon: Receipt },
];

export default function PressKitPage() {
  const brand = PLATFORM_COMPANY_NAME;
  const year = new Date().getFullYear();

  const handleDownloadFacts = () => {
    const md =
      `# ${brand} — Press Fact Sheet\n\n` +
      FACTS.map((f) => `- **${f.label}**: ${f.value}`).join("\n") +
      `\n\n## Geographic coverage\n` +
      COVERAGE.map((c) => `- **${c.region}**: ${c.countries}`).join("\n") +
      `\n\n## Products\n` +
      PRODUCT_BLURBS.map((p) => `- **${p.name}** — ${p.line}`).join("\n") +
      `\n\n_Prepared ${new Date().toISOString().slice(0, 10)}_\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brand.toLowerCase().replace(/\s+/g, "-")}-press-fact-sheet.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      data-testid="page-press-kit"
    >
      <Seo
        title={`${brand} — Press Kit & Media Resources`}
        description="Official press kit for Africa Credit Hub: fact sheet, founder quotes, product blurbs, regional coverage, and media contact for the consent-first credit infrastructure for Africa."
        canonical="/press"
      />
      <header className="border-b border-slate-200/60 dark:border-slate-800 backdrop-blur-sm bg-white/70 dark:bg-slate-950/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-violet-600 to-amber-500 text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100" data-testid="text-brand-name">{brand}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:block">Press</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1.5 md:gap-2">
            <Link href="/financial-inclusion" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-impact">Impact</Button></Link>
            <Link href="/for-lenders" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-for-lenders">For Lenders</Button></Link>
            <Link href="/for-regulators" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-for-regulators">For Regulators</Button></Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/contact-sales"><Button size="sm" data-testid="button-contact">Media contact</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-10 text-center">
        <Badge variant="secondary" className="mb-5"><Newspaper className="w-3 h-3 mr-1.5" />Press kit · {year}</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05]" data-testid="text-press-title">
          Media resources for {brand}
        </h1>
        <p className="mt-5 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Everything a journalist, analyst, or partner needs to write about us accurately. Free to use with attribution.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={handleDownloadFacts} className="gap-2" data-testid="button-download-fact-sheet">
            <Download className="w-4 h-4" /> Download fact sheet
          </Button>
          <a href="mailto:press@africacredithub.com">
            <Button size="lg" variant="outline" className="gap-2" data-testid="button-email-press">
              <Mail className="w-4 h-4" /> press@africacredithub.com
            </Button>
          </a>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">One-line description</h2>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-6">
            <p className="text-lg text-slate-800 dark:text-slate-100 leading-relaxed" data-testid="text-one-liner">
              <strong>{brand}</strong> is the consent-first credit infrastructure for Africa — a single platform combining a pan-African credit bureau, a movable-asset collateral registry, and a verified VAT-receipt system (Loto Fiscal) — wired together by a consent-bounded data bridge so previously invisible merchants can unlock real credit.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">Fact sheet</h2>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-0 divide-y divide-slate-200 dark:divide-slate-800">
            {FACTS.map((f) => (
              <div key={f.label} className="grid grid-cols-1 md:grid-cols-3 gap-2 px-6 py-4" data-testid={`fact-${f.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 md:col-span-1">{f.label}</div>
                <div className="text-sm text-slate-800 dark:text-slate-100 md:col-span-2">{f.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRODUCT_BLURBS.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.id} className="border-slate-200/80 dark:border-slate-800" data-testid={`card-product-blurb-${p.id}`}>
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">{p.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p.line}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">Quotable lines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {QUOTES.map((q, i) => (
            <Card key={i} className="border-slate-200/80 dark:border-slate-800" data-testid={`card-quote-${i}`}>
              <CardContent className="p-6">
                <Quote className="w-6 h-6 text-violet-500 mb-3" />
                <p className="text-base italic text-slate-800 dark:text-slate-100 leading-relaxed">"{q.quote}"</p>
                <p className="mt-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">— {q.who}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">Geographic coverage</h2>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-0 divide-y divide-slate-200 dark:divide-slate-800">
            {COVERAGE.map((c) => (
              <div key={c.region} className="grid grid-cols-1 md:grid-cols-4 gap-2 px-6 py-4" data-testid={`coverage-${c.region.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center gap-2 md:col-span-1">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.region}</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 md:col-span-3">{c.countries}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">Brand assets</h2>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-amber-500 text-white flex items-center justify-center shadow-md">
                <Layers className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-1">Primary mark</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Gradient layered icon — blue → violet → amber. Use on white or near-black backgrounds. Minimum size 24px.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Blue <span className="ml-1 font-mono">#2563eb</span></Badge>
                  <Badge variant="outline">Violet <span className="ml-1 font-mono">#7c3aed</span></Badge>
                  <Badge variant="outline">Amber <span className="ml-1 font-mono">#f59e0b</span></Badge>
                  <Badge variant="outline">Slate-900 <span className="ml-1 font-mono">#0f172a</span></Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 text-center">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-600 mb-3" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-3">Want a deeper briefing?</h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6">
            We're happy to walk press, analysts, and policymakers through a live demo and answer technical questions on the record.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact-sales"><Button size="lg" className="gap-2" data-testid="button-request-briefing">Request a briefing <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/financial-inclusion"><Button size="lg" variant="outline" data-testid="button-impact-page"><Banknote className="w-4 h-4 mr-2" />See the live impact page</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4" />
            <span>© {year} {brand}. Press inquiries welcome.</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-back-home">Home</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Terms</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
