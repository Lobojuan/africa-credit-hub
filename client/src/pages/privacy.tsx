import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="privacy-page">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: April 2, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              Africa Credit Hub collects information you provide directly when you create an account, submit credit data, or contact us. This includes: (a) <strong>Account Information</strong> — name, email, phone number, organization details, and role; (b) <strong>Credit Data</strong> — borrower information, loan records, repayment histories, and credit inquiries submitted by participating institutions; (c) <strong>Usage Data</strong> — IP addresses, browser type, access times, pages viewed, and interactions with the Platform; (d) <strong>Device Information</strong> — device type, operating system, and unique identifiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use collected information to: (a) provide and maintain the Platform's credit reporting and risk assessment services; (b) generate credit scores and risk analytics; (c) facilitate regulatory compliance reporting; (d) enable cross-border credit data sharing between authorized institutions; (e) prevent fraud and ensure platform security; (f) communicate service updates and support; (g) improve our services through analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Sharing & Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We share data only as follows: (a) <strong>With Authorized Institutions</strong> — credit data is shared with registered financial institutions and regulators in accordance with data sharing agreements and applicable law; (b) <strong>Cross-Border Transfers</strong> — data may be transferred between African jurisdictions in compliance with bilateral agreements and data protection frameworks; (c) <strong>Legal Requirements</strong> — when required by law, regulation, or court order; (d) <strong>Service Providers</strong> — with trusted third parties who assist in operating the Platform, subject to strict confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Protection Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              We comply with data protection regulations across all jurisdictions where we operate, including but not limited to: Ghana Data Protection Act (Act 843), Nigeria Data Protection Regulation (NDPR), Kenya Data Protection Act (2019), South Africa's Protection of Personal Information Act (POPIA), and the African Union Convention on Cyber Security and Personal Data Protection (Malabo Convention). Our data processing activities are registered with relevant data protection authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including: AES-256 encryption for data at rest, TLS 1.3 for data in transit, multi-factor authentication, role-based access controls, regular security audits, and intrusion detection systems. All data is stored in secure, SOC 2 compliant environments with regular backup procedures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credit data is retained in accordance with applicable regulatory requirements and our data retention policies. Standard retention periods are 7 years for credit history records, unless local law requires longer retention. You may request data deletion subject to regulatory retention requirements. Account data is retained for the duration of your account plus a reasonable period for legal and audit purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your jurisdiction, you may have the right to: (a) access your personal data; (b) correct inaccurate data; (c) request deletion of your data (subject to legal obligations); (d) restrict processing of your data; (e) receive your data in a portable format; (f) object to processing; (g) lodge a complaint with a data protection authority. To exercise these rights, contact our Data Protection Officer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform uses essential cookies for session management and authentication. We use analytics cookies to understand platform usage patterns and improve our services. You can configure your browser to refuse cookies, though some Platform features may not function properly without them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and updating the "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related inquiries, contact our Data Protection Officer at privacy@africacredithub.com or through the Platform's support channels. Carlson Capital & Systems in Motion Limited, Accra, Ghana.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
