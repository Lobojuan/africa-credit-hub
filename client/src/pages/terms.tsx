import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function TermsOfServicePage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              {t("legal.backToHome")}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <span className="text-sm font-semibold text-foreground">Universal Credit Hub</span>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="terms-page">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("legal.termsTitle")}</h1>
        <p className="text-sm text-muted-foreground mb-2">{t("legal.lastUpdated", { date: "May 15, 2026" })}</p>
        <p className="text-xs text-muted-foreground/70 italic mb-8">{t("legalPages.englishOnly")}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Universal Credit Hub platform (&quot;Platform&quot;), operated by {PLATFORM_COMPANY_NAME}, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Platform. These Terms apply to all users, including financial institutions, regulators, credit bureaus, and individual consumers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Universal Credit Hub provides a Pan-African credit data infrastructure platform that enables credit reporting, risk assessment, regulatory compliance, and cross-border data sharing across African jurisdictions. The Platform includes AI-powered credit scoring, borrower management, regulatory reporting tools, and related financial data services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              To access the Platform, you must register for an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account. Accounts are subject to verification and approval by our administration team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Protection & Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform processes sensitive financial and personal data in accordance with applicable data protection laws across African jurisdictions, including the Ghana Data Protection Act (Act 843), Nigeria Data Protection Regulation (NDPR), Kenya Data Protection Act, South Africa&apos;s POPIA, and other relevant national and regional frameworks. Our data handling practices are detailed in our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Permitted Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may use the Platform only for lawful purposes related to credit reporting, financial analysis, regulatory compliance, and risk management. You agree not to: (a) use the Platform for any illegal or unauthorized purpose; (b) attempt to gain unauthorized access to any systems or data; (c) interfere with the Platform&apos;s operation; (d) share or redistribute credit data outside authorized use; or (e) use automated means to scrape or extract data without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property — Ownership</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Universal Credit Hub platform — including all software, source code, algorithms, scoring models, database schemas, API designs, UI/UX designs, documentation, brand assets, and business logic — is the exclusive intellectual property of <strong>Universal Credit Hub Ltd</strong>, registered in Ghana, and its owner <strong>Uffe Jon Carlson / Carlson Capital</strong> (&quot;IP Owner&quot;). All rights are reserved worldwide.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The Platform is protected under the <strong>Ghana Copyright Act 2005 (Act 690)</strong>, the <strong>TRIPS Agreement</strong>, the <strong>Berne Convention for the Protection of Literary and Artistic Works</strong>, and all applicable national intellectual property laws across every jurisdiction in which the Platform operates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Intellectual Property — Prohibited Acts</h2>
            <p className="text-muted-foreground leading-relaxed">
              The following acts are <strong>strictly prohibited</strong> and constitute violations of the IP Owner&apos;s exclusive rights, subject to civil and criminal liability:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Copying, reproducing, or cloning any part of the Platform&apos;s source code, database structure, or algorithms, in whole or in part, by any means.</li>
              <li>Reverse engineering, decompiling, disassembling, or attempting to derive source code from compiled or obfuscated assets.</li>
              <li>Creating derivative works, forks, or competitive products based on or substantially similar to the Platform&apos;s design, architecture, or functionality.</li>
              <li>Scraping, crawling, or systematically extracting data, content, or UI patterns from the Platform using automated tools, bots, or scripts.</li>
              <li>Removing, obscuring, or altering any copyright notices, watermarks, or proprietary legends embedded in the Platform or its exports.</li>
              <li>Distributing, sublicensing, selling, or transferring access to the Platform or any portion thereof without the IP Owner&apos;s prior written consent.</li>
              <li>Using any Platform export (PDF, CSV, XLSX, JSON) or screenshot for commercial purposes outside the scope of your authorized subscription.</li>
              <li>Training machine learning models on Platform data, outputs, or UI patterns without a separate written data-licensing agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Copyright Enforcement</h2>
            <p className="text-muted-foreground leading-relaxed">
              The IP Owner actively monitors for unauthorized use, copying, and replication of the Platform. All PDF and data exports generated by the Platform contain embedded digital watermarks identifying the exporting user, organization, timestamp, and IP address. All authenticated sessions are subject to device fingerprinting. Evidence of infringement is logged and may be submitted to law enforcement authorities or used in civil proceedings.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To report suspected infringement or to request a licensing arrangement, contact: <strong>uffe.carlson@gmail.com</strong> | +233 552 395548 | +1 646 980 5659.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Data Accuracy & Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              Data contributors are responsible for the accuracy of data submitted to the Platform. Consumers and borrowers have the right to dispute inaccurate information through the Platform&apos;s dispute resolution process. We will investigate disputes within the timeframes required by applicable law and correct any verified inaccuracies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to maintain 99.9% uptime for the Platform. However, we may temporarily suspend access for maintenance, updates, or security purposes. We will provide reasonable notice of planned maintenance. We are not liable for service interruptions beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, {PLATFORM_COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Platform. Our total liability shall not exceed the fees paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Ghana, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Ghana, unless otherwise required by applicable law in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For legal inquiries, IP licensing, or enforcement matters: <strong>uffe.carlson@gmail.com</strong> | +233 552 395548 | +1 646 980 5659.<br />
              For platform support and general queries: contact us through the Platform&apos;s support channels.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
