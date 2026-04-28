import { lazy, Suspense } from "react";
import { Link } from "wouter";
import { Loader2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

const InvestorLandingPage = lazy(() => import("@/pages/investor-landing"));

export default function CreditLandingPage() {
  const { t } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  return (
    <div className="relative">
      <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-9 flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:underline font-medium" data-testid="link-breadcrumb-platform">{brand}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold" data-testid="text-breadcrumb-product">
            {t("products.credit.name", "Credit Bureau")}
          </span>
        </div>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
        <InvestorLandingPage />
      </Suspense>
    </div>
  );
}
