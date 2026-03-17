import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Lock, Eye, Key, Fingerprint, Database, Globe,
  CheckCircle2, FileText, Server, AlertTriangle, ArrowRight,
  ShieldCheck, UserCheck, Layers, Hash, Activity, Scale,
} from "lucide-react";


const SECURITY_CONTROLS = [
  {
    category: "Authentication & Access",
    icon: Key,
    color: "text-blue-600",
    controls: [
      { name: "Multi-Factor Authentication (TOTP)", status: "implemented", detail: "Time-based one-time passwords via authenticator apps" },
      { name: "Biometric Authentication (WebAuthn/FIDO2)", status: "implemented", detail: "Fingerprint, face recognition, and security key support" },
      { name: "Role-Based Access Control (RBAC)", status: "implemented", detail: "5 roles: Super Admin, Admin, Regulator, Lender, Viewer" },
      { name: "Session Management", status: "implemented", detail: "Secure cookie-based sessions with automatic expiration" },
      { name: "Account Lockout Policy", status: "implemented", detail: "Progressive lockout after failed login attempts" },
      { name: "Password Expiration", status: "implemented", detail: "Forced password change on first login and periodic rotation" },
    ],
  },
  {
    category: "Data Protection",
    icon: Lock,
    color: "text-green-600",
    controls: [
      { name: "TLS/SSL Encryption (In Transit)", status: "implemented", detail: "All data encrypted in transit using HTTPS/TLS 1.3" },
      { name: "AES-256 Encryption (At Rest)", status: "implemented", detail: "Database encryption at rest via managed PostgreSQL" },
      { name: "Data Minimization", status: "implemented", detail: "Consumer portal returns only necessary data, no internal IDs or financial amounts" },
      { name: "Data Retention Policies", status: "implemented", detail: "Configurable per-country retention periods with automatic enforcement" },
      { name: "Consent Management", status: "implemented", detail: "Explicit consent tracking with revocation capability" },
      { name: "PII Redaction in Logs", status: "implemented", detail: "Audit logs exclude sensitive personal data" },
    ],
  },
  {
    category: "Application Security",
    icon: ShieldCheck,
    color: "text-purple-600",
    controls: [
      { name: "Input Validation (Zod Schemas)", status: "implemented", detail: "Server-side validation on all API endpoints using strict schemas" },
      { name: "XSS Prevention (DOMPurify)", status: "implemented", detail: "Content sanitization on all user-generated content" },
      { name: "CSRF Protection", status: "implemented", detail: "Session-based CSRF mitigation with SameSite cookies" },
      { name: "Rate Limiting", status: "implemented", detail: "Per-endpoint rate limiting with progressive throttling" },
      { name: "Security Headers (Helmet)", status: "implemented", detail: "X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security" },
      { name: "SQL Injection Prevention", status: "implemented", detail: "Parameterized queries via Drizzle ORM — no raw SQL interpolation" },
    ],
  },
  {
    category: "Audit & Compliance",
    icon: FileText,
    color: "text-amber-600",
    controls: [
      { name: "Immutable Audit Trail", status: "implemented", detail: "Hash-chained audit logs with SHA-256 integrity verification" },
      { name: "Blockchain Anchoring", status: "implemented", detail: "Merkle tree anchoring of audit hashes every 6 hours on Ethereum" },
      { name: "Maker-Checker Workflows", status: "implemented", detail: "Dual-approval for sensitive operations (borrower creation, updates)" },
      { name: "Fraud Detection Engine", status: "implemented", detail: "Real-time risk scoring with velocity checks and geographic anomaly detection" },
      { name: "API Key Management", status: "implemented", detail: "SHA-256 hashed keys with scope-based permissions and revocation" },
      { name: "Usage Metering & Billing Audit", status: "implemented", detail: "Every billable event tracked with full metadata for reconciliation" },
    ],
  },
];

const COMPLIANCE_FRAMEWORKS = [
  { name: "GDPR", region: "European Union / Global", status: "compliant", detail: "Data subject rights, consent management, data portability, right to erasure" },
  { name: "Ghana Data Protection Act, 2012", region: "Ghana (Act 843)", status: "compliant", detail: "Full compliance with Bank of Ghana CRB requirements and NIA integration" },
  { name: "Nigeria NDPR", region: "Nigeria", status: "compliant", detail: "Nigeria Data Protection Regulation compliance for NIBSS integration" },
  { name: "Kenya Data Protection Act", region: "Kenya", status: "compliant", detail: "Office of Data Protection Commissioner requirements" },
  { name: "South Africa POPIA", region: "South Africa", status: "compliant", detail: "Full Protection of Personal Information Act compliance — Information Officer designation, lawful processing conditions, data subject access requests (DSARs), cross-border transfer safeguards, breach notification within 72 hours, and purpose limitation enforcement" },
  { name: "ISO 27001", region: "International", status: "aligned", detail: "Information security management system aligned with ISO 27001 controls" },
  { name: "SOC 2 Type II", region: "International", status: "in-progress", detail: "Security, availability, and confidentiality trust services criteria" },
  { name: "PCI DSS", region: "International", status: "aligned", detail: "Payment Card Industry Data Security Standard alignment for financial data" },
];

const ARCHITECTURE_FEATURES = [
  { icon: Database, title: "Multi-Tenant Isolation", desc: "Data segregated per organization and country with query-level enforcement" },
  { icon: Globe, title: "54-Country Regulatory Engine", desc: "Per-jurisdiction regulatory rules, data protection laws, and reporting requirements" },
  { icon: Layers, title: "API-First Architecture", desc: "RESTful API with OAuth 2.1, webhook delivery, and SDK-ready endpoints" },
  { icon: Hash, title: "Cryptographic Integrity", desc: "SHA-256 hash chains on audit logs, HMAC-signed webhooks, JWT tokens" },
  { icon: Activity, title: "Real-Time Monitoring", desc: "30-second health checks, SLA tracking, and anomaly detection" },
  { icon: UserCheck, title: "Zero-Trust Access Model", desc: "Every request authenticated, authorized, and audit-logged" },
];

export default function SecurityCompliancePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="security-page">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/demo")}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">CDH Credit Registry</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Security</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/demo")} data-testid="link-back-overview">Overview</Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/pricing")} data-testid="link-pricing">Pricing</Button>
            <Button size="sm" className="text-xs" onClick={() => window.location.href = `/api/demo-login`} data-testid="button-launch-demo">
              Launch Demo <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">Enterprise Security</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-security-title">
            Security & Compliance
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            Purpose-built for the financial sector with bank-grade security controls,
            regulatory compliance across 54 African jurisdictions, and immutable audit trails.
          </p>
          <div className="flex items-center justify-center gap-6 mb-12 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>POPIA Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Blockchain Anchored</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Security Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ARCHITECTURE_FEATURES.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <f.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Security Controls</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            24 security controls implemented across 4 domains
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SECURITY_CONTROLS.map((group) => (
              <Card key={group.category} data-testid={`card-security-${group.category.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <group.icon className={`w-5 h-5 ${group.color}`} />
                    {group.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.controls.map((c) => (
                      <div key={c.name} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" data-testid="text-compliance-title">Regulatory Compliance</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Compliant with data protection regulations across every deployed jurisdiction
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLIANCE_FRAMEWORKS.map((f) => (
              <Card key={f.name} data-testid={`card-compliance-${f.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{f.name}</h3>
                      <p className="text-xs text-muted-foreground">{f.region}</p>
                      <p className="text-xs text-muted-foreground mt-1">{f.detail}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        f.status === "compliant"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : f.status === "aligned"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      }
                    >
                      {f.status === "compliant" ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                       f.status === "aligned" ? <Scale className="w-3 h-3 mr-1" /> :
                       <AlertTriangle className="w-3 h-3 mr-1" />}
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1).replace("-", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4" data-testid="section-popia">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scale className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-center" data-testid="text-popia-title">POPIA Compliance — South Africa</h2>
          </div>
          <p className="text-muted-foreground text-center mb-8 text-sm max-w-2xl mx-auto">
            Full alignment with the Protection of Personal Information Act (Act 4 of 2013), enforced by South Africa's Information Regulator
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card data-testid="card-popia-information-officer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-sm">Information Officer</h3>
                </div>
                <p className="text-xs text-muted-foreground">Designated Information Officer role with registered deputy. All processing activities logged and reported to the Information Regulator as required under Section 55.</p>
              </CardContent>
            </Card>
            <Card data-testid="card-popia-lawful-processing">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-sm">Lawful Processing Conditions</h3>
                </div>
                <p className="text-xs text-muted-foreground">All 8 conditions for lawful processing enforced: accountability, purpose limitation, further processing limitation, information quality, openness, security safeguards, and data subject participation.</p>
              </CardContent>
            </Card>
            <Card data-testid="card-popia-dsar">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-violet-600" />
                  <h3 className="font-semibold text-sm">Data Subject Access Requests</h3>
                </div>
                <p className="text-xs text-muted-foreground">Self-service consumer portal for DSARs under Sections 23–25. Borrowers can view, correct, or request deletion of their personal information with full audit trail.</p>
              </CardContent>
            </Card>
            <Card data-testid="card-popia-cross-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-sm">Cross-Border Transfer Safeguards</h3>
                </div>
                <p className="text-xs text-muted-foreground">Section 72 compliance for cross-border data flows. Transfers only to jurisdictions with adequate protection levels. Per-country data residency rules enforced at the query level.</p>
              </CardContent>
            </Card>
            <Card data-testid="card-popia-breach">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-sm">Breach Notification</h3>
                </div>
                <p className="text-xs text-muted-foreground">Automated breach detection and notification pipeline. Information Regulator and affected data subjects notified within 72 hours per Section 22. Incident response runbook with severity classification.</p>
              </CardContent>
            </Card>
            <Card data-testid="card-popia-retention">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-sm">Purpose Limitation & Retention</h3>
                </div>
                <p className="text-xs text-muted-foreground">Data collected only for specified, explicit purposes. Automated retention policies enforce Section 14 requirements — records purged or anonymized when no longer needed for the original purpose.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Continuous Compliance Monitoring</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Every data access, modification, and transfer is recorded in an immutable audit log with blockchain anchoring. 
                  The platform automatically enforces consent requirements before processing, tracks data subject preferences, 
                  and generates compliance reports for the Information Regulator on demand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Security is in Our DNA</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Built from the ground up for the financial sector. Every feature, every endpoint,
            every data flow has been designed with security and compliance as the primary concern.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => window.location.href = `/api/demo-login`} data-testid="button-cta-demo">
              Explore the Platform
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} data-testid="button-cta-pricing">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Systems In Motion Limited. All rights reserved.</p>
          <p className="mt-1">CDH Credit Registry — Pan-African Credit Data Infrastructure</p>
        </div>
      </footer>
    </div>
  );
}
