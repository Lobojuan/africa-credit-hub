import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { ArrowLeft, Code2, Lock, Send, Search, FileText, CreditCard, Gavel, Clock, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function CodeBlock({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Badge variant="outline" className={`${methodColors[method] || ""} text-xs font-mono shrink-0`}>{method}</Badge>
      <div>
        <code className="text-sm font-mono font-medium" data-testid={`text-endpoint-${path.replace(/\//g, "-")}`}>{path}</code>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const baseUrl = window.location.origin;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/api-keys")} data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-api-docs-title">{t("apiDocs.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("apiDocs.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("apiDocs.authentication")}</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("apiDocs.authDescription")}</p>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm font-mono block" data-testid="text-auth-header">X-API-Key: sim_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
          </div>
          <p className="text-xs text-muted-foreground">{t("apiDocs.authNote")}</p>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{t("apiDocs.oauthTitle")}</h3>
              <Badge variant="outline" className="text-[10px]">OAuth 2.1</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t("apiDocs.oauthDescription")}</p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-xs text-muted-foreground">{t("apiDocs.oauthStep1")}</p>
              <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="text-oauth-example">{`POST /api/external/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "sim_xxxxxxxx",
  "client_secret": "sim_xxxxxxxx_xxxx...full_key"
}`}</pre>
              <p className="text-xs text-muted-foreground mt-3">{t("apiDocs.oauthStep2")}</p>
              <pre className="text-xs font-mono whitespace-pre-wrap">{`{
  "access_token": "eyJhbGciOiJI...",
  "token_type": "Bearer",
  "expires_in": 3600
}`}</pre>
              <p className="text-xs text-muted-foreground mt-3">{t("apiDocs.oauthStep3")}</p>
              <pre className="text-xs font-mono whitespace-pre-wrap">{`Authorization: Bearer eyJhbGciOiJI...`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("apiDocs.baseUrl")}</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm font-mono" data-testid="text-base-url">{baseUrl}/api/external/v1</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("apiDocs.endpoints")}</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 mt-2"><Clock className="w-4 h-4" /> {t("apiDocs.healthCheck")}</h3>
          <CodeBlock method="GET" path="/health" description={t("apiDocs.healthDesc")} />

          <h3 className="text-sm font-semibold flex items-center gap-2 mt-4"><Send className="w-4 h-4" /> {t("apiDocs.borrowers")}</h3>
          <CodeBlock method="POST" path="/borrowers" description={t("apiDocs.borrowersPostDesc")} />
          <CodeBlock method="GET" path="/borrowers/search?nationalId=..." description={t("apiDocs.borrowersSearchDesc")} />
          <CodeBlock method="GET" path="/borrowers/:id/credit-report" description={t("apiDocs.creditReportDesc")} />

          <h3 className="text-sm font-semibold flex items-center gap-2 mt-4"><CreditCard className="w-4 h-4" /> {t("apiDocs.creditAccounts")}</h3>
          <CodeBlock method="POST" path="/credit-accounts" description={t("apiDocs.creditAccountsPostDesc")} />
          <CodeBlock method="GET" path="/credit-accounts/:borrowerId" description={t("apiDocs.creditAccountsGetDesc")} />

          <h3 className="text-sm font-semibold flex items-center gap-2 mt-4"><FileText className="w-4 h-4" /> {t("apiDocs.paymentHistory")}</h3>
          <CodeBlock method="POST" path="/payment-history" description={t("apiDocs.paymentHistoryDesc")} />

          <h3 className="text-sm font-semibold flex items-center gap-2 mt-4"><Gavel className="w-4 h-4" /> {t("apiDocs.courtJudgments")}</h3>
          <CodeBlock method="POST" path="/court-judgments" description={t("apiDocs.courtJudgmentsDesc")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("apiDocs.batchSubmission")}</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("apiDocs.batchDescription")}</p>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="text-batch-example">{`POST /api/external/v1/borrowers
Content-Type: application/json
X-API-Key: sim_xxxxxxxx_xxx...

[
  {
    "type": "individual",
    "firstName": "John",
    "lastName": "Doe",
    "nationalId": "ETH-123456",
    "phone": "+251911000000"
  },
  {
    "type": "corporate",
    "companyName": "Acme Corp",
    "nationalId": "BIZ-789012",
    "sector": "Manufacturing"
  }
]`}</pre>
          </div>
          <p className="text-xs text-muted-foreground">{t("apiDocs.batchNote")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("apiDocs.responseFormat")}</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="text-response-example">{`{
  "success": true,
  "message": "Borrower created successfully",
  "data": { ... },
  "timestamp": "2026-02-28T01:00:00.000Z"
}`}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <h2 className="text-lg font-semibold">{t("apiDocs.errorCodes")}</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm"><Badge variant="outline">401</Badge> <span>{t("apiDocs.error401")}</span></div>
            <div className="flex items-center gap-3 text-sm"><Badge variant="outline">403</Badge> <span>{t("apiDocs.error403")}</span></div>
            <div className="flex items-center gap-3 text-sm"><Badge variant="outline">400</Badge> <span>{t("apiDocs.error400")}</span></div>
            <div className="flex items-center gap-3 text-sm"><Badge variant="outline">404</Badge> <span>{t("apiDocs.error404")}</span></div>
            <div className="flex items-center gap-3 text-sm"><Badge variant="outline">500</Badge> <span>{t("apiDocs.error500")}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
