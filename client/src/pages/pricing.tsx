import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PricingPage() {
  return (
    <div className="py-20 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" data-testid="link-back-home">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>
          </Button>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl" data-testid="text-pricing-title">
            Infrastructure scaled for your institution.
          </h1>
          <p className="mt-4 text-xl text-muted-foreground" data-testid="text-pricing-subtitle">
            From local microfinance to national central banks, Africa Credit Hub provides the secure foundation for pan-African credit evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <Card className="flex flex-col border-zinc-200 dark:border-zinc-800" data-testid="card-pricing-growth">
            <CardHeader>
              <CardTitle className="text-2xl">Growth</CardTitle>
              <CardDescription>Perfect for digital lenders and growing MFIs needing alternative data.</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold" data-testid="text-price-growth">$499</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">+ $0.15 per API query</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Telco Alternative Credit Scoring</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Standard API Access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Up to 5 User Accounts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Email Support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline" data-testid="button-start-trial-growth">
                <Link href="/start-trial">Start Free Trial</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col border-teal-500 shadow-teal-900/20 shadow-xl relative scale-105 z-10" data-testid="card-pricing-commercial">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0 bg-teal-500 text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Commercial</CardTitle>
              <CardDescription>Built for Tier-1 and Tier-2 Commercial Institutions.</CardDescription>
              <div className="mt-4">
                <span className="text-xl font-medium text-muted-foreground">Starting at</span><br/>
                <span className="text-4xl font-bold" data-testid="text-price-commercial">$3,500</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">+ One-time Integration Fee</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Everything in Growth</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Role-Based Access (B2B/B2C/Telco)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Maker-Checker Workflow Enforcement</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Core Banking / RTGS Integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> 24/7 Dedicated SLA Support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-700" data-testid="button-contact-sales">
                <Link href="/contact-sales">Contact Sales</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50" data-testid="card-pricing-sovereign">
            <CardHeader>
              <CardTitle className="text-2xl">Sovereign</CardTitle>
              <CardDescription>National financial infrastructure & regulatory oversight.</CardDescription>
              <div className="mt-4 pt-2">
                <span className="text-3xl font-bold" data-testid="text-price-sovereign">Custom</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Perpetual licensing available</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Macroeconomic NPL Dashboards</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Strict Data Sovereignty Isolation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> SHA-256 Cryptographic Audit Logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Dedicated Cloud or On-Premise</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-500" /> Legacy Data Migration Team</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline" data-testid="button-request-briefing">
                <Link href="/contact-sales?tier=sovereign">Request Executive Briefing</Link>
              </Button>
            </CardFooter>
          </Card>

        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Looking for detailed transaction pricing, wallet funding, and technical integration details?
          </p>
          <Button asChild variant="outline" data-testid="link-partner-docs">
            <Link href="/partner-docs">
              View Full Partner Documentation →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
