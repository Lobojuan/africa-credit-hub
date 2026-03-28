import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import {
  ArrowLeft, Code2, Lock, Send, Search, FileText, CreditCard, Gavel,
  Clock, KeyRound, Shield, Play, Copy, Check, ChevronRight,
  Zap, Globe, Bell, Package, AlertTriangle, ArrowRight, Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isGhanaMode } from "@/lib/country-mode";
import { useToast } from "@/hooks/use-toast";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} data-testid="button-copy-code">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

function CodeBlock({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, string> = {
    GET: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 dark:bg-blue-900 dark:text-blue-200",
    POST: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 dark:bg-green-900 dark:text-green-200",
    DELETE: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 dark:bg-red-900 dark:text-red-200",
  };
  return (
    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-md">
      <Badge variant="outline" className={`${methodColors[method] || ""} text-[10px] sm:text-xs font-mono shrink-0`}>{method}</Badge>
      <div className="min-w-0">
        <code className="text-xs sm:text-sm font-mono font-medium break-all" data-testid={`text-endpoint-${path.replace(/\//g, "-")}`}>{path}</code>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

const API_ENDPOINTS = [
  { id: "health", method: "GET", path: "/health", description: "Check API availability and version", params: [], body: null },
  { id: "create-borrower", method: "POST", path: "/borrowers", description: "Create a borrower record", params: [], body: JSON.stringify({ type: "individual", firstName: "John", lastName: "Doe", nationalId: "ETH-123456", phone: "+251911000000" }, null, 2) },
  { id: "search-borrowers", method: "GET", path: "/borrowers/search", description: "Search borrowers by national ID", params: [{ name: "nationalId", placeholder: "ETH-123456" }, { name: "name", placeholder: "John Doe" }], body: null },
  { id: "credit-report", method: "GET", path: "/borrowers/:id/credit-report", description: "Generate a full credit report with score factors", params: [{ name: "id", placeholder: "1" }], body: null },
  { id: "fraud-risk", method: "GET", path: "/borrowers/:id/fraud-risk", description: "Get fraud risk assessment with velocity checks and alerts", params: [{ name: "id", placeholder: "1" }], body: null },
  { id: "consumer-lookup", method: "GET", path: "/consumer/lookup", description: "Consumer self-service credit score lookup (public)", params: [{ name: "nationalId", placeholder: "GHA-123456789" }], body: null },
  { id: "create-credit-account", method: "POST", path: "/credit-accounts", description: "Submit credit account data", params: [], body: JSON.stringify({ borrowerId: 1, accountNumber: "ACC-001", accountType: "term_loan", originalAmount: "50000", currentBalance: "35000", currency: "GHS", status: "active", openDate: "2024-01-15" }, null, 2) },
  { id: "get-credit-accounts", method: "GET", path: "/credit-accounts/:borrowerId", description: "Get all credit accounts for a borrower", params: [{ name: "borrowerId", placeholder: "1" }], body: null },
  { id: "create-payment", method: "POST", path: "/payment-history", description: "Submit payment history records", params: [], body: JSON.stringify({ creditAccountId: 1, paymentDate: "2024-06-01", amountDue: "5000", amountPaid: "5000", currency: "GHS", status: "on_time" }, null, 2) },
  { id: "create-judgment", method: "POST", path: "/court-judgments", description: "Submit court judgment records", params: [], body: JSON.stringify({ borrowerId: 1, caseNumber: "HC-2024-001", courtName: "High Court", judgmentType: "monetary", amount: "100000", currency: "GHS", judgmentDate: "2024-03-15", status: "active" }, null, 2) },
];

function InteractiveExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0].id);
  const [apiKey, setApiKey] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyValue, setBodyValue] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const endpoint = API_ENDPOINTS.find(e => e.id === selectedEndpoint)!;
  const baseUrl = window.location.origin;

  const handleEndpointChange = (id: string) => {
    setSelectedEndpoint(id);
    setParamValues({});
    setResponse(null);
    const ep = API_ENDPOINTS.find(e => e.id === id)!;
    setBodyValue(ep.body || "");
  };

  const buildUrl = () => {
    let path = endpoint.path;
    endpoint.params.forEach(p => {
      if (p.name === "id" || p.name === "borrowerId") {
        path = path.replace(`:${p.name}`, paramValues[p.name] || p.placeholder);
      }
    });
    const queryParams = endpoint.params
      .filter(p => p.name !== "id" && p.name !== "borrowerId" && paramValues[p.name])
      .map(p => `${p.name}=${encodeURIComponent(paramValues[p.name])}`)
      .join("&");
    return `${baseUrl}/api/external/v1${path}${queryParams ? `?${queryParams}` : ""}`;
  };

  const handleSend = async () => {
    if (!apiKey) {
      toast({ title: "API Key Required", description: "Enter your API key to make requests", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResponse(null);
    try {
      const url = buildUrl();
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      };
      if (endpoint.method === "POST" && bodyValue) {
        options.body = bodyValue;
      }
      const res = await fetch(url, options);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card data-testid="card-api-explorer">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Interactive API Explorer</h2>
          <Badge variant="outline" className="text-[10px]">Try It</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            placeholder="sim_xxxxxxxx_xxxx..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            data-testid="input-explorer-api-key"
          />
        </div>

        <div className="space-y-2">
          <Label>Endpoint</Label>
          <Select value={selectedEndpoint} onValueChange={handleEndpointChange}>
            <SelectTrigger data-testid="select-explorer-endpoint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {API_ENDPOINTS.map(ep => (
                <SelectItem key={ep.id} value={ep.id}>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[9px] font-mono ${ep.method === "GET" ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>{ep.method}</Badge>
                    <span className="font-mono text-xs">{ep.path}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {endpoint.params.length > 0 && (
          <div className="space-y-2">
            <Label>Parameters</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {endpoint.params.map(p => (
                <div key={p.name}>
                  <Label className="text-xs text-muted-foreground">{p.name}</Label>
                  <Input
                    placeholder={p.placeholder}
                    value={paramValues[p.name] || ""}
                    onChange={e => setParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                    data-testid={`input-param-${p.name}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.method === "POST" && (
          <div className="space-y-2">
            <Label>Request Body (JSON)</Label>
            <Textarea
              className="font-mono text-xs min-h-[120px]"
              value={bodyValue || endpoint.body || ""}
              onChange={e => setBodyValue(e.target.value)}
              data-testid="textarea-request-body"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="bg-muted rounded-md px-3 py-1.5 flex-1 overflow-x-auto">
            <code className="text-xs font-mono break-all" data-testid="text-explorer-url">{buildUrl()}</code>
          </div>
          <Button onClick={handleSend} disabled={isLoading} data-testid="button-send-request">
            {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="ml-1.5">Send</span>
          </Button>
        </div>

        {response && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Response</Label>
              <CopyButton text={response} />
            </div>
            <div className="bg-muted rounded-md p-3 overflow-auto max-h-[300px]">
              <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="text-explorer-response">{response}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CodeExamples() {
  const [activeTab, setActiveTab] = useState("curl");
  const baseUrl = window.location.origin;

  const examples: Record<string, { label: string; icon: typeof Terminal; code: string }> = {
    curl: {
      label: "cURL",
      icon: Terminal,
      code: `# Search for a borrower
curl -X GET "${baseUrl}/api/external/v1/borrowers/search?nationalId=ETH-123456" \\
  -H "X-API-Key: sim_xxxxxxxx_xxxx..."

# Create a borrower
curl -X POST "${baseUrl}/api/external/v1/borrowers" \\
  -H "X-API-Key: sim_xxxxxxxx_xxxx..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "individual",
    "firstName": "John",
    "lastName": "Doe",
    "nationalId": "ETH-123456",
    "phone": "+251911000000"
  }'

# Generate credit report
curl -X GET "${baseUrl}/api/external/v1/borrowers/1/credit-report" \\
  -H "X-API-Key: sim_xxxxxxxx_xxxx..."`,
    },
    javascript: {
      label: "JavaScript",
      icon: Code2,
      code: `const API_KEY = "sim_xxxxxxxx_xxxx...";
const BASE_URL = "${baseUrl}/api/external/v1";

// Search for a borrower
const searchResponse = await fetch(
  \`\${BASE_URL}/borrowers/search?nationalId=ETH-123456\`,
  { headers: { "X-API-Key": API_KEY } }
);
const searchData = await searchResponse.json();

// Create a borrower
const createResponse = await fetch(\`\${BASE_URL}/borrowers\`, {
  method: "POST",
  headers: {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "individual",
    firstName: "John",
    lastName: "Doe",
    nationalId: "ETH-123456",
    phone: "+251911000000",
  }),
});
const borrower = await createResponse.json();

// Generate credit report
const reportResponse = await fetch(
  \`\${BASE_URL}/borrowers/\${borrower.data.id}/credit-report\`,
  { headers: { "X-API-Key": API_KEY } }
);
const report = await reportResponse.json();`,
    },
    python: {
      label: "Python",
      icon: Code2,
      code: `import requests

API_KEY = "sim_xxxxxxxx_xxxx..."
BASE_URL = "${baseUrl}/api/external/v1"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

# Search for a borrower
search_resp = requests.get(
    f"{BASE_URL}/borrowers/search",
    params={"nationalId": "ETH-123456"},
    headers=HEADERS,
)
print(search_resp.json())

# Create a borrower
create_resp = requests.post(
    f"{BASE_URL}/borrowers",
    json={
        "type": "individual",
        "firstName": "John",
        "lastName": "Doe",
        "nationalId": "ETH-123456",
        "phone": "+251911000000",
    },
    headers=HEADERS,
)
borrower = create_resp.json()

# Generate credit report
report_resp = requests.get(
    f"{BASE_URL}/borrowers/{borrower['data']['id']}/credit-report",
    headers=HEADERS,
)
print(report_resp.json())`,
    },
  };

  return (
    <Card data-testid="card-code-examples">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Code Examples</h2>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="curl" data-testid="tab-curl">cURL</TabsTrigger>
            <TabsTrigger value="javascript" data-testid="tab-javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python" data-testid="tab-python">Python</TabsTrigger>
          </TabsList>
          {Object.entries(examples).map(([key, ex]) => (
            <TabsContent key={key} value={key}>
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <CopyButton text={ex.code} />
                </div>
                <div className="bg-muted rounded-md p-3 sm:p-4 overflow-auto max-h-[400px]">
                  <pre className="text-[10px] sm:text-xs font-mono whitespace-pre-wrap" data-testid={`text-code-${key}`}>{ex.code}</pre>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AuthFlowDiagram() {
  const steps = [
    { label: "Generate API Key", desc: "Create key in API Keys page", icon: KeyRound, color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
    { label: "Request OAuth Token", desc: "POST /oauth/token with credentials", icon: Lock, color: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
    { label: "Receive Bearer Token", desc: "Token valid for 1 hour", icon: Shield, color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
    { label: "Make API Calls", desc: "Include token in Authorization header", icon: Send, color: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  ];

  return (
    <Card data-testid="card-auth-flow">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Authentication Flow</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Two authentication methods are supported: direct API key and OAuth 2.1 token exchange.</p>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold mb-3">OAuth 2.1 Flow</h3>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              {steps.map((step, i) => (
                <div key={i} className="flex sm:flex-col items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 sm:flex-col sm:text-center flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-md shrink-0 ${step.color}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 sm:mt-2">
                      <p className="text-xs font-semibold" data-testid={`text-auth-step-${i}`}>{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <h3 className="text-sm font-semibold">Direct API Key (Simpler)</h3>
            <div className="bg-muted rounded-md p-3 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="text-direct-api-key-example">{`GET /api/external/v1/borrowers/search?nationalId=ETH-123456
X-API-Key: sim_xxxxxxxx_xxxx...`}</pre>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <h3 className="text-sm font-semibold">OAuth 2.1 Token Exchange</h3>
            <div className="bg-muted rounded-md p-3 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="text-oauth-token-example">{`POST /api/external/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "sim_xxxxxxxx",
  "client_secret": "sim_xxxxxxxx_xxxx...full_key"
}

Response:
{
  "access_token": "eyJhbGciOiJI...",
  "token_type": "Bearer",
  "expires_in": 3600
}

Subsequent requests:
Authorization: Bearer eyJhbGciOiJI...`}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RateLimitDocs() {
  const limits = [
    { tier: "Standard", requests: "100", window: "per minute", burst: "20 req/s", quota: "10,000/day" },
    { tier: "Premium", requests: "500", window: "per minute", burst: "50 req/s", quota: "100,000/day" },
    { tier: "Enterprise", requests: "2,000", window: "per minute", burst: "200 req/s", quota: "Unlimited" },
  ];

  const headers = [
    { header: "X-RateLimit-Limit", description: "Maximum requests allowed in the current window" },
    { header: "X-RateLimit-Remaining", description: "Requests remaining in the current window" },
    { header: "X-RateLimit-Reset", description: "Unix timestamp when the rate limit resets" },
    { header: "Retry-After", description: "Seconds to wait before retrying (only on 429)" },
  ];

  return (
    <Card data-testid="card-rate-limits">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Rate Limits & Quotas</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          API requests are rate-limited per API key. Exceeding the limit returns HTTP 429 (Too Many Requests).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" data-testid="table-rate-limits">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold">Tier</th>
                <th className="text-left py-2 pr-4 font-semibold">Rate Limit</th>
                <th className="text-left py-2 pr-4 font-semibold">Burst</th>
                <th className="text-left py-2 font-semibold">Daily Quota</th>
              </tr>
            </thead>
            <tbody>
              {limits.map(l => (
                <tr key={l.tier} className="border-b last:border-0" data-testid={`row-rate-limit-${l.tier.toLowerCase()}`}>
                  <td className="py-2 pr-4"><Badge variant="outline">{l.tier}</Badge></td>
                  <td className="py-2 pr-4 font-mono">{l.requests} {l.window}</td>
                  <td className="py-2 pr-4 font-mono">{l.burst}</td>
                  <td className="py-2 font-mono">{l.quota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Response Headers</h3>
          <div className="space-y-1.5">
            {headers.map(h => (
              <div key={h.header} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                <code className="text-[10px] sm:text-xs font-mono font-medium shrink-0" data-testid={`text-header-${h.header}`}>{h.header}</code>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{h.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-sm font-semibold">Error Codes</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm"><Badge variant="outline">429</Badge> <span>Rate limit exceeded. Check Retry-After header.</span></div>
            <div className="flex items-center gap-2 text-xs sm:text-sm"><Badge variant="outline">401</Badge> <span>Missing or invalid API key</span></div>
            <div className="flex items-center gap-2 text-xs sm:text-sm"><Badge variant="outline">403</Badge> <span>API key revoked or institution inactive</span></div>
            <div className="flex items-center gap-2 text-xs sm:text-sm"><Badge variant="outline">400</Badge> <span>Validation error in request body</span></div>
            <div className="flex items-center gap-2 text-xs sm:text-sm"><Badge variant="outline">404</Badge> <span>Resource not found</span></div>
            <div className="flex items-center gap-2 text-xs sm:text-sm"><Badge variant="outline">500</Badge> <span>Internal server error</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookDocs() {
  return (
    <Card data-testid="card-webhooks">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <Badge variant="outline" className="text-[10px]">Real-time</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Receive real-time notifications when events occur in the credit registry. Configure webhook endpoints to get
          instant updates instead of polling the API.
        </p>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Supported Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { event: "borrower.created", desc: "New borrower record created" },
              { event: "borrower.updated", desc: "Borrower information updated" },
              { event: "credit_account.created", desc: "New credit account submitted" },
              { event: "credit_account.status_changed", desc: "Account status changed (e.g., default)" },
              { event: "credit_report.generated", desc: "Credit report was pulled" },
              { event: "dispute.opened", desc: "New dispute filed by borrower" },
              { event: "dispute.resolved", desc: "Dispute resolved" },
              { event: "payment.recorded", desc: "Payment history record submitted" },
              { event: "fraud.alert_triggered", desc: "Fraud risk threshold exceeded for a borrower" },
              { event: "score.changed", desc: "Borrower credit score changed significantly" },
              { event: "alternative_data.submitted", desc: "Mobile money or utility data submitted" },
              { event: "consent.revoked", desc: "Borrower consent revoked" },
            ].map(e => (
              <div key={e.event} className="p-2 bg-muted/50 rounded-md" data-testid={`text-webhook-event-${e.event.replace(/\./g, "-")}`}>
                <code className="text-[10px] sm:text-xs font-mono font-medium">{e.event}</code>
                <p className="text-[10px] text-muted-foreground mt-0.5">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-sm font-semibold">Webhook Payload Format</h3>
          <div className="bg-muted rounded-md p-3 overflow-auto relative">
            <CopyButton text={`{
  "id": "evt_abc123",
  "type": "credit_report.generated",
  "created_at": "2026-03-01T12:00:00Z",
  "data": {
    "borrower_id": 42,
    "report_id": "rpt_xyz789",
    "institution": "First National Bank",
    "purpose": "loan_application"
  },
  "signature": "sha256=..."
}`} />
            <pre className="text-[10px] sm:text-xs font-mono whitespace-pre-wrap" data-testid="text-webhook-payload">{`{
  "id": "evt_abc123",
  "type": "credit_report.generated",
  "created_at": "2026-03-01T12:00:00Z",
  "data": {
    "borrower_id": 42,
    "report_id": "rpt_xyz789",
    "institution": "First National Bank",
    "purpose": "loan_application"
  },
  "signature": "sha256=..."
}`}</pre>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-sm font-semibold">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <li data-testid="text-webhook-step-1">Navigate to <strong>API Keys</strong> and select your API key</li>
            <li data-testid="text-webhook-step-2">Add your webhook endpoint URL (must be HTTPS)</li>
            <li data-testid="text-webhook-step-3">Select the events you want to subscribe to</li>
            <li data-testid="text-webhook-step-4">Save and verify using the test ping feature</li>
            <li data-testid="text-webhook-step-5">Validate webhook signatures using the shared secret and SHA-256 HMAC</li>
          </ol>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-sm font-semibold">Signature Verification</h3>
          <div className="bg-muted rounded-md p-3 overflow-auto">
            <pre className="text-[10px] sm:text-xs font-mono whitespace-pre-wrap" data-testid="text-webhook-verification">{`import hmac, hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)`}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SdkSection() {
  const sdks = [
    { lang: "Python", status: "Coming Soon", version: "—", icon: "py" },
    { lang: "JavaScript / Node.js", status: "Coming Soon", version: "—", icon: "js" },
    { lang: "Java", status: "Planned", version: "—", icon: "java" },
    { lang: "Go", status: "Planned", version: "—", icon: "go" },
    { lang: "PHP", status: "Planned", version: "—", icon: "php" },
  ];

  return (
    <Card data-testid="card-sdks">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">SDKs & Client Libraries</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Official SDKs are being developed to simplify integration. Use the REST API directly in the meantime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sdks.map(sdk => (
            <div key={sdk.lang} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md" data-testid={`card-sdk-${sdk.icon}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{sdk.lang}</span>
              </div>
              <Badge
                variant="outline"
                className={sdk.status === "Coming Soon"
                  ? "text-amber-700 dark:text-amber-300 border-amber-400 text-[10px] shrink-0"
                  : "text-muted-foreground text-[10px] shrink-0"
                }
              >
                {sdk.status}
              </Badge>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Want early access to an SDK? Contact your account manager or reach out via the Helpdesk.
        </p>
      </CardContent>
    </Card>
  );
}

export default function ApiDocsPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("explorer");

  const baseUrl = window.location.origin;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/api-keys")} data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight" data-testid="text-api-docs-title">{t("apiDocs.title")}</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground ml-4">{t("apiDocs.subtitle")}</p>
        </div>
      </div>

      {isGhanaMode() && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:bg-amber-950/20" data-testid="card-ghana-api-compliance">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-100 dark:bg-amber-900/40 shrink-0">
                <Shield className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold">Ghana Regulatory Compliance Notice</h3>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-400 text-amber-700 dark:text-amber-300">Act 726</Badge>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-400 text-amber-700 dark:text-amber-300">Act 843</Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  All API usage is governed by the Credit Reporting Act, 2007 (Act 726) and Data Protection Act, 2012 (Act 843).
                  Only BoG-licensed institutions may access this API. Credit report pulls require documented borrower consent per Act 726, Section 14.
                  All data must use GHS currency for domestic facilities and Ghana Card as the primary identifier.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link href="/ghana-docs">
                    <Button variant="outline" size="sm" className="text-[10px] sm:text-xs" data-testid="button-view-ghana-api-guide">
                      <FileText className="w-3 h-3 mr-1" /> View Ghana API Guide
                    </Button>
                  </Link>
                  <Link href="/ghana-docs">
                    <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs" data-testid="button-view-ghana-connections">
                      View Connections Policy
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap" data-testid="tabs-api-docs">
          <TabsTrigger value="explorer" data-testid="tab-explorer">
            <Play className="w-3.5 h-3.5 mr-1" /> Explorer
          </TabsTrigger>
          <TabsTrigger value="endpoints" data-testid="tab-endpoints">
            <Send className="w-3.5 h-3.5 mr-1" /> Endpoints
          </TabsTrigger>
          <TabsTrigger value="auth" data-testid="tab-auth">
            <Lock className="w-3.5 h-3.5 mr-1" /> Auth
          </TabsTrigger>
          <TabsTrigger value="examples" data-testid="tab-examples">
            <Code2 className="w-3.5 h-3.5 mr-1" /> Code
          </TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">
            <Bell className="w-3.5 h-3.5 mr-1" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="sdks" data-testid="tab-sdks">
            <Package className="w-3.5 h-3.5 mr-1" /> SDKs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="space-y-4 mt-4">
          <InteractiveExplorer />
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t("apiDocs.baseUrl")}</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 sm:p-4 rounded-md overflow-x-auto">
                <code className="text-xs sm:text-sm font-mono break-all" data-testid="text-base-url">{baseUrl}/api/external/v1</code>
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

              <h3 className="text-sm font-semibold flex items-center gap-2 mt-4"><Shield className="w-4 h-4" /> Fraud Detection</h3>
              <CodeBlock method="GET" path="/borrowers/:id/fraud-risk" description="Get comprehensive fraud risk assessment including velocity checks, identity verification, and behavioral analysis" />

              <h3 className="text-sm font-semibold flex items-center gap-2 mt-4"><Search className="w-4 h-4" /> Consumer Self-Service</h3>
              <CodeBlock method="GET" path="/consumer/lookup?nationalId=..." description="Public endpoint for borrower credit score lookup by National ID, Ghana Card, or Passport number" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Telco Integration API</h2>
                <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300">Enterprise</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">
                Endpoints for MoMo-based credit scoring, telco loan lifecycle management, and consent compliance. Supports MTN, Orange, Tigo, and Airtel integrations.
              </p>

              <h3 className="text-sm font-semibold flex items-center gap-2 mt-2" data-testid="section-telco-profiles">Telco Profiles</h3>
              <CodeBlock method="GET" path="/api/telco/profiles" description="List telco subscriber profiles with optional country, provider, kyc_level, and search filters" />
              <CodeBlock method="POST" path="/api/telco/profiles" description="Create or import a telco subscriber profile (MSISDN, provider, KYC level)" />
              <CodeBlock method="GET" path="/api/telco/profiles/:id" description="Get a single telco profile by ID" />

              <h3 className="text-sm font-semibold flex items-center gap-2 mt-4" data-testid="section-telco-scoring">Credit Scoring & Decision Engine</h3>
              <CodeBlock method="POST" path="/api/telco/decision-engine/:profileId" description="Run AI credit scoring and decision engine for a single profile. Supports Idempotency-Key header." />
              <CodeBlock method="POST" path="/api/telco/decision-engine/bulk/run" description="Batch decision engine run across multiple profiles. Supports Idempotency-Key header to prevent duplicate processing." />
              <CodeBlock method="GET" path="/api/telco/scores" description="List credit scores with optional search, provider, and risk tier filters" />
              <CodeBlock method="GET" path="/api/telco/scores/:id" description="Get a single score detail with KPI snapshot and AI rationale" />

              <h3 className="text-sm font-semibold flex items-center gap-2 mt-4" data-testid="section-telco-loans">Loan Lifecycle</h3>
              <CodeBlock method="GET" path="/api/telco/loans" description="List loans with pagination, country, and status filters" />
              <CodeBlock method="GET" path="/api/telco/loans/portfolio" description="Portfolio analytics: total disbursed, outstanding, PAR 30/60/90, default rate, collection rate" />
              <CodeBlock method="GET" path="/api/telco/loans/:id" description="Get loan details including disbursement status and repayment schedule" />
              <CodeBlock method="POST" path="/api/telco/loans/:id/disburse" description="Disburse approved loan funds. Supports Idempotency-Key header." />
              <CodeBlock method="POST" path="/api/telco/loans/:id/repayments" description="Record a repayment against an active loan" />
              <CodeBlock method="GET" path="/api/telco/loans/:id/repayments" description="Get all repayment records for a loan" />

              <h3 className="text-sm font-semibold flex items-center gap-2 mt-4" data-testid="section-telco-consent">Consent Management</h3>
              <CodeBlock method="POST" path="/api/telco/consent" description="Record consent grant/revoke event with method (ussd, sms, app, web_portal, agent, ivr), purpose, and IP tracking" />
              <CodeBlock method="GET" path="/api/telco/consent/:profileId" description="Get consent history for a subscriber profile" />
              <CodeBlock method="GET" path="/api/telco/consent-summary" description="Aggregated consent statistics: total events, active, revoked, by method" />

              <h3 className="text-sm font-semibold flex items-center gap-2 mt-4" data-testid="section-idempotency">Idempotency</h3>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">
                  Critical write endpoints (decision engine, disbursement, bulk operations) support the <code className="text-primary">Idempotency-Key</code> header.
                  Send a unique UUID with your request. If the same key is sent again within 24 hours, the original response is replayed without re-executing the operation.
                  The response will include <code className="text-primary">X-Idempotent-Replayed: true</code> header.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Sandbox Environment</h2>
                <Badge variant="outline" className="text-[10px] bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">Available</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use the sandbox environment to test your integration without affecting production data. All sandbox requests use test data and return realistic responses.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-semibold">Sandbox Base URL</p>
                  <code className="text-[11px] font-mono text-primary mt-1 block" data-testid="text-sandbox-url">{baseUrl}/api/external/v1</code>
                  <p className="text-[10px] text-muted-foreground mt-1">Use sandbox API keys (prefix: sim_test_)</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-semibold">Rate Limits (Sandbox)</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Reads: 200/min · Writes: 60/min · Batch: 10/min</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Higher limits available on production keys</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-semibold">Quick Start</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                  <li>Generate a sandbox API key from the <strong>API Keys</strong> page</li>
                  <li>Use the Interactive Explorer above to test endpoints</li>
                  <li>Verify webhook delivery with the test ping feature</li>
                  <li>Switch to production keys when ready to go live</li>
                </ol>
              </div>
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
              <div className="bg-muted p-3 sm:p-4 rounded-md overflow-x-auto">
                <pre className="text-[10px] sm:text-xs font-mono whitespace-pre-wrap" data-testid="text-batch-example">{`POST /api/external/v1/borrowers
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
              <div className="bg-muted p-3 sm:p-4 rounded-md overflow-x-auto">
                <pre className="text-[10px] sm:text-xs font-mono whitespace-pre-wrap" data-testid="text-response-example">{`{
  "success": true,
  "message": "Borrower created successfully",
  "data": { ... },
  "timestamp": "2026-02-28T01:00:00.000Z"
}`}</pre>
              </div>
            </CardContent>
          </Card>

          <RateLimitDocs />
        </TabsContent>

        <TabsContent value="auth" className="space-y-4 mt-4">
          <AuthFlowDiagram />
        </TabsContent>

        <TabsContent value="examples" className="space-y-4 mt-4">
          <CodeExamples />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <WebhookDocs />
        </TabsContent>

        <TabsContent value="sdks" className="space-y-4 mt-4">
          <SdkSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
