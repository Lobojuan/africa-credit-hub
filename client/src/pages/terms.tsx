import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <span className="text-sm font-semibold text-foreground">Africa Credit Hub</span>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="terms-page">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: April 2, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Africa Credit Hub platform (&quot;Platform&quot;), operated by {PLATFORM_COMPANY_NAME}, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Platform. These Terms apply to all users, including financial institutions, regulators, credit bureaus, and individual consumers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Africa Credit Hub provides a Pan-African credit data infrastructure platform that enables credit reporting, risk assessment, regulatory compliance, and cross-border data sharing across African jurisdictions. The Platform includes AI-powered credit scoring, borrower management, regulatory reporting tools, and related financial data services.
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
              The Platform processes sensitive financial and personal data in accordance with applicable data protection laws across African jurisdictions, including the Ghana Data Protection Act (Act 843), Nigeria Data Protection Regulation (NDPR), Kenya Data Protection Act, South Africa's POPIA, and other relevant national and regional frameworks. Our data handling practices are detailed in our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Permitted Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may use the Platform only for lawful purposes related to credit reporting, financial analysis, regulatory compliance, and risk management. You agree not to: (a) use the Platform for any illegal or unauthorized purpose; (b) attempt to gain unauthorized access to any systems or data; (c) interfere with the Platform's operation; (d) share or redistribute credit data outside authorized use; or (e) use automated means to scrape or extract data without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Accuracy & Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              Data contributors are responsible for the accuracy of data submitted to the Platform. Consumers and borrowers have the right to dispute inaccurate information through the Platform's dispute resolution process. We will investigate disputes within the timeframes required by applicable law and correct any verified inaccuracies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, features, and functionality of the Platform — including but not limited to software, algorithms, scoring models, documentation, and design — are owned by {PLATFORM_COMPANY_NAME} and are protected by international intellectual property laws. You may not copy, modify, distribute, or create derivative works without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to maintain 99.9% uptime for the Platform. However, we may temporarily suspend access for maintenance, updates, or security purposes. We will provide reasonable notice of planned maintenance. We are not liable for service interruptions beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, {PLATFORM_COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Platform. Our total liability shall not exceed the fees paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Ghana, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Ghana, unless otherwise required by applicable law in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at legal@africacredithub.com or through the Platform's support channels.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
