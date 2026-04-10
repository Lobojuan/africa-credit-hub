import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Shield, ArrowRight, ArrowLeft, CheckCircle2, CreditCard,
  Building2, Smartphone, Globe, Banknote, Loader2,
  Zap, Crown, Star, Copy, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    price: 299,
    period: "month",
    icon: Star,
    color: "text-blue-500",
    features: [
      "Up to 10 users",
      "5 countries",
      "Basic credit reports",
      "Email support",
      "Standard API access",
      "500 API calls/month",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 799,
    period: "month",
    icon: Zap,
    color: "text-primary",
    highlight: true,
    features: [
      "Up to 50 users",
      "20 countries",
      "Advanced analytics & AI scoring",
      "Priority support",
      "Full API access",
      "5,000 API calls/month",
      "Cross-border search",
      "Regulatory dashboards",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 1999,
    period: "month",
    icon: Crown,
    color: "text-amber-500",
    features: [
      "Unlimited users",
      "All 54 countries",
      "AI portfolio intelligence",
      "Dedicated account manager",
      "Unlimited API access",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment option",
    ],
  },
];

const PAYMENT_METHODS = [
  {
    id: "stripe",
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
    color: "bg-blue-500/10 text-blue-600",
    regions: ["Global"],
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer / Wire",
    description: "Direct bank-to-bank transfer",
    icon: Building2,
    color: "bg-green-500/10 text-green-600",
    regions: ["All Africa"],
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    description: "Cards, bank transfer, mobile money across 30+ African countries",
    icon: Globe,
    color: "bg-orange-500/10 text-orange-600",
    regions: ["Nigeria", "Ghana", "Kenya", "South Africa", "30+ countries"],
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Mobile money payment via Safaricom M-Pesa",
    icon: Smartphone,
    color: "bg-green-600/10 text-green-700",
    regions: ["Kenya", "Tanzania", "Mozambique", "DRC", "Lesotho", "Ghana", "Egypt"],
  },
  {
    id: "mobile_money",
    name: "Mobile Money",
    description: "MTN MoMo, Airtel Money, Orange Money",
    icon: Banknote,
    color: "bg-yellow-500/10 text-yellow-700",
    regions: ["West Africa", "Central Africa", "East Africa"],
  },
];

const BANK_DETAILS = {
  bankName: "Stanbic Bank Ghana",
  accountName: `${PLATFORM_COMPANY_NAME}`,
  accountNumber: "9040012345678",
  branchCode: "020100",
  swiftCode: "SBICGHAC",
  currency: "USD / GHS",
  reference: "CDH-SUB-{ORG_ID}",
};

export default function UpgradePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const brandColors = useBrandColors();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [step, setStep] = useState<"plan" | "payment" | "confirm">("plan");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("mtn");

  const { data: user } = useQuery({ queryKey: ["/api/auth/me"] });
  const currentTier = (user as any)?.organization?.subscriptionTier || "trial";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (step === "payment" || step === "confirm") {
      window.scrollTo(0, 0);
    }
  }, [step]);

  const plan = PLANS.find((p) => p.id === selectedPlan);
  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === selectedPayment);

  async function handleCheckout() {
    if (!selectedPlan || !selectedPayment) return;
    setLoading(true);

    try {
      if (selectedPayment === "stripe") {
        const res = await apiRequest("POST", "/api/payments/initiate", {
          plan: selectedPlan,
          method: "stripe",
        });
        const data = await res.json();
        if (data.stripeUrl) {
          document.body.style.pointerEvents = "auto";
          window.location.href = data.stripeUrl;
          return;
        }
        toast({ title: "Payment initiated", description: data.message });
        setStep("confirm");
        setLoading(false);
        return;
      }

      const res = await apiRequest("POST", "/api/payments/initiate", {
        plan: selectedPlan,
        method: selectedPayment,
        phone: selectedPayment === "mpesa" ? mpesaPhone : selectedPayment === "mobile_money" ? mobileMoneyPhone : undefined,
        provider: selectedPayment === "mobile_money" ? mobileMoneyProvider : undefined,
      });
      const data = await res.json();

      toast({
        title: "Payment initiated",
        description: data.message || "Your payment request has been submitted.",
      });

      if (data.redirectUrl) {
        document.body.style.pointerEvents = "auto";
        window.location.href = data.redirectUrl;
      } else {
        setStep("confirm");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function copyBankDetails() {
    const text = `Bank: ${BANK_DETAILS.bankName}\nAccount: ${BANK_DETAILS.accountName}\nAccount Number: ${BANK_DETAILS.accountNumber}\nBranch Code: ${BANK_DETAILS.branchCode}\nSWIFT: ${BANK_DETAILS.swiftCode}\nCurrency: ${BANK_DETAILS.currency}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Bank details copied to clipboard" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="upgrade-page">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColors.headerGradient }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">CDH Credit Registry</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/")} data-testid="link-back-dashboard">
            <ArrowLeft className="w-3 h-3 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          {["plan", "payment", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                step === s ? "bg-primary text-primary-foreground" :
                (i < ["plan", "payment", "confirm"].indexOf(step)) ? "bg-green-500 text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < ["plan", "payment", "confirm"].indexOf(step) ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline capitalize">{s === "confirm" ? "Complete" : `Select ${s}`}</span>
              {i < 2 && <div className={`h-0.5 w-8 sm:w-16 ${i < ["plan", "payment", "confirm"].indexOf(step) ? "bg-green-500" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {currentTier === "trial" && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8 flex items-center gap-3">
            <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">Trial</Badge>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              You're currently on a free trial. Upgrade to continue using the platform after your trial expires.
            </p>
          </div>
        )}

        {step === "plan" && (
          <>
            <h1 className="text-2xl font-bold mb-2" data-testid="text-upgrade-title">Choose Your Plan</h1>
            <p className="text-sm text-muted-foreground mb-8">Select the plan that fits your institution's needs. All plans include core credit registry features.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {PLANS.map((p) => {
                const Icon = p.icon;
                const isCurrentPlan = currentTier === p.id;
                return (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlan === p.id ? "ring-2 ring-primary border-primary" :
                      p.highlight ? "border-primary/50" : ""
                    } ${isCurrentPlan ? "opacity-60" : ""}`}
                    onClick={() => !isCurrentPlan && setSelectedPlan(p.id)}
                    data-testid={`plan-${p.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${p.color}`} />
                          <CardTitle className="text-base">{p.name}</CardTitle>
                        </div>
                        {p.highlight && <Badge className="text-xs">Popular</Badge>}
                        {isCurrentPlan && <Badge variant="outline" className="text-xs">Current</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">${p.price}</span>
                        <span className="text-sm text-muted-foreground">/{p.period}</span>
                      </div>
                      <ul className="space-y-2">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                disabled={!selectedPlan}
                onClick={() => setStep("payment")}
                className="gap-2"
                data-testid="button-continue-payment"
              >
                Continue to Payment <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Select Payment Method</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Choose the payment method most convenient for your institution. Upgrading to <strong>{plan?.name}</strong> at <strong>${plan?.price}/month</strong>.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <Card
                      key={pm.id}
                      className={`cursor-pointer transition-all ${
                        selectedPayment === pm.id ? "ring-2 ring-primary border-primary" : ""
                      }`}
                      onClick={() => setSelectedPayment(pm.id)}
                      data-testid={`payment-${pm.id}`}
                    >
                      <CardContent className="py-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pm.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{pm.name}</h3>
                          <p className="text-xs text-muted-foreground">{pm.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pm.regions.map((r) => (
                              <Badge key={r} variant="outline" className="text-[10px] px-1.5 py-0">{r}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          selectedPayment === pm.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                        } flex items-center justify-center`}>
                          {selectedPayment === pm.id && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {selectedPayment === "mpesa" && (
                  <Card className="border-green-200 dark:border-green-900">
                    <CardContent className="py-4">
                      <Label className="text-sm font-medium">M-Pesa Phone Number</Label>
                      <Input
                        placeholder="+254 7XX XXX XXX"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="mt-2"
                        data-testid="input-mpesa-phone"
                      />
                      <p className="text-xs text-muted-foreground mt-1">You will receive an STK push to confirm payment</p>
                    </CardContent>
                  </Card>
                )}

                {selectedPayment === "mobile_money" && (
                  <Card className="border-yellow-200 dark:border-yellow-900">
                    <CardContent className="py-4 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Mobile Money Provider</Label>
                        <div className="flex gap-2 mt-2">
                          {[
                            { id: "mtn", label: "MTN MoMo" },
                            { id: "airtel", label: "Airtel Money" },
                            { id: "orange", label: "Orange Money" },
                          ].map((p) => (
                            <Button
                              key={p.id}
                              variant={mobileMoneyProvider === p.id ? "default" : "outline"}
                              size="sm"
                              className="text-xs"
                              onClick={() => setMobileMoneyProvider(p.id)}
                              data-testid={`button-momo-${p.id}`}
                            >
                              {p.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone Number</Label>
                        <Input
                          placeholder="+233 XX XXX XXXX"
                          value={mobileMoneyPhone}
                          onChange={(e) => setMobileMoneyPhone(e.target.value)}
                          className="mt-1"
                          data-testid="input-momo-phone"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedPayment === "bank_transfer" && (
                  <Card className="border-green-200 dark:border-green-900">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold">Wire Transfer Details</h4>
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={copyBankDetails} data-testid="button-copy-bank">
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        {Object.entries(BANK_DETAILS).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span className="font-mono text-xs">{val}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 bg-muted/50 rounded p-2">
                        After completing the transfer, your account will be upgraded within 1-2 business days once payment is confirmed.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedPayment === "flutterwave" && (
                  <Card className="border-orange-200 dark:border-orange-900">
                    <CardContent className="py-4">
                      <p className="text-sm text-muted-foreground">
                        You'll be redirected to Flutterwave's secure checkout to complete payment via card, bank transfer, or mobile money available in your country.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {["Visa", "Mastercard", "Verve", "Bank Transfer", "M-Pesa", "MTN MoMo", "USSD"].map((m) => (
                          <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <Card className="sticky top-24">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-sm mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium">{plan?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Billing</span>
                        <span>Monthly</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${plan?.price}/mo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => { setStep("plan"); setSelectedPayment(null); }} data-testid="button-back-plan">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                disabled={!selectedPayment || loading || (selectedPayment === "mpesa" && !mpesaPhone) || (selectedPayment === "mobile_money" && !mobileMoneyPhone)}
                onClick={handleCheckout}
                className="gap-2"
                data-testid="button-pay-now"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedPayment === "bank_transfer" ? (
                  <>
                    I've Initiated the Transfer
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Pay ${plan?.price} Now
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3" data-testid="text-payment-success">
              {selectedPayment === "bank_transfer" ? "Transfer Noted" : "Payment Submitted"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedPayment === "bank_transfer"
                ? "We'll verify your bank transfer and upgrade your account within 1-2 business days. You'll receive a confirmation email once processed."
                : selectedPayment === "mpesa" || selectedPayment === "mobile_money"
                ? "Check your phone to confirm the payment. Your account will be upgraded automatically once payment is confirmed."
                : "Your payment is being processed. Your account will be upgraded shortly."}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate("/")} data-testid="button-go-dashboard">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/billing")} data-testid="button-view-billing">
                View Billing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
