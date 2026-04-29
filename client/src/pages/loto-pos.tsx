import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LotoPosAnimation, type PosAnimationReceipt } from "@/components/loto-pos-animation";
import { Receipt, Cpu, Printer, ShieldCheck, AlertTriangle } from "lucide-react";

interface MerchantMe {
  id: string;
  shopName: string;
  vatRegistrationNumber: string | null;
  countryCode: string;
  currency: string;
  city: string | null;
}

interface DeviceRow {
  id: string;
  serial: string;
  merchantId: string;
  countryCode: string;
  status: "pending" | "active" | "revoked";
}

interface IssueResponse {
  ok: boolean;
  fiscalCode: string;
  qrPayload: string;
  deviceSerial: string;
  amount: string;
  vatAmount: string;
  currency: string;
  issuedAt: string;
  merchantName: string;
}

export default function LotoPosPage() {
  const { toast } = useToast();
  const [deviceId, setDeviceId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [items, setItems] = useState<string>("1");
  const [category, setCategory] = useState<string>("retail");
  const [lastReceipt, setLastReceipt] = useState<IssueResponse | null>(null);
  const [animationOpen, setAnimationOpen] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  const merchantQ = useQuery<{ id: string; shopName: string; vatRegistrationNumber: string | null; countryCode: string; currency: string; city: string | null } | null>({
    queryKey: ["/api/loto/merchants/me"],
  });
  const merchant = merchantQ.data ?? null;

  // Use the merchant self-service endpoint — non-admin POS users can't
  // hit the admin device list. /me returns devices for the caller's
  // linked merchant (or [] if none).
  const devicesQ = useQuery<DeviceRow[]>({
    queryKey: ["/api/loto/devices/me"],
    enabled: !!merchant?.id,
  });

  const activeDevices = (devicesQ.data ?? []).filter((d) => d.status === "active");

  // Auto-pick first active device
  useEffect(() => {
    if (!deviceId && activeDevices.length > 0) setDeviceId(activeDevices[0].id);
  }, [activeDevices, deviceId]);

  // Render QR whenever a new receipt is issued
  useEffect(() => {
    if (!lastReceipt || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, lastReceipt.qrPayload, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "M",
    }).catch((err) => console.error("QR render failed", err));
  }, [lastReceipt]);

  const issueMutation = useMutation<IssueResponse, Error, void>({
    mutationFn: async () => {
      const amt = Number(amount);
      const it = Number(items);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a positive amount.");
      if (!Number.isFinite(it) || it < 1) throw new Error("Items must be at least 1.");
      if (!deviceId) throw new Error("Select an active device.");
      const res = await apiRequest("POST", `/api/loto/devices/${deviceId}/issue`, {
        amount: amt,
        items: it,
        category,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLastReceipt(data);
      setAnimationOpen(true);
      toast({ title: "Receipt issued", description: `Fiscal code ${data.fiscalCode}` });
    },
    onError: (e) => toast({ title: "Issuance failed", description: e.message, variant: "destructive" }),
  });

  const handlePrint = () => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) {
      toast({ title: "Pop-up blocked", description: "Allow pop-ups to print the thermal receipt.", variant: "destructive" });
      return;
    }
    w.document.write(`<!doctype html><html><head><title>Loto Fiscal Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 16px; max-width: 280px; margin: 0 auto; color: #000; }
        h2 { text-align: center; font-size: 14px; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
        .total { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; font-weight: bold; }
        .qr { text-align: center; margin: 12px 0; }
        .footer { text-align: center; font-size: 10px; margin-top: 12px; }
      </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 250);
  };

  const animationReceipt: PosAnimationReceipt | null = lastReceipt
    ? {
        ticketNumber: lastReceipt.fiscalCode.slice(-6).padStart(6, "0"),
        fiscalCode: lastReceipt.fiscalCode,
        merchantName: lastReceipt.merchantName,
        city: merchant?.city ?? null,
        amount: Number(lastReceipt.amount),
        vatAmount: Number(lastReceipt.vatAmount),
        itemCount: Number(items) || 1,
        currency: lastReceipt.currency,
      }
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-loto-pos">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-title">
          <Receipt className="h-7 w-7" /> Loto Fiscal — Merchant POS
        </h1>
        <p className="text-muted-foreground mt-1">
          Issue a real, cryptographically signed lottery receipt. The QR carries an HMAC-SHA256 signature
          that consumer devices and DGI can independently verify.
        </p>
      </header>

      {merchantQ.isLoading && <Skeleton className="h-32 w-full" />}

      {!merchantQ.isLoading && !merchant && (
        <Alert variant="destructive" data-testid="alert-no-merchant">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No merchant profile</AlertTitle>
          <AlertDescription>
            Your account is not yet linked to a Loto Fiscal merchant. Ask your administrator to create the
            merchant record before you can issue receipts.
          </AlertDescription>
        </Alert>
      )}

      {merchant && (
        <>
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-merchant-shop">{merchant.shopName}</CardTitle>
              <CardDescription>
                {merchant.city ? `${merchant.city} · ` : ""}
                {merchant.countryCode} · VAT {merchant.vatRegistrationNumber ?? "—"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device">Active EFD</Label>
                  {devicesQ.isLoading && <Skeleton className="h-10 w-full mt-1" />}
                  {!devicesQ.isLoading && activeDevices.length === 0 && (
                    <Alert className="mt-2">
                      <Cpu className="h-4 w-4" />
                      <AlertTitle>No active fiscal device</AlertTitle>
                      <AlertDescription>
                        DGI must register and certify an EFD against this merchant before you can issue
                        receipts. You can browse the device registry under the admin tools.
                      </AlertDescription>
                    </Alert>
                  )}
                  {!devicesQ.isLoading && activeDevices.length > 0 && (
                    <Select value={deviceId} onValueChange={setDeviceId}>
                      <SelectTrigger id="device" data-testid="select-device">
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDevices.map((d) => (
                          <SelectItem key={d.id} value={d.id} data-testid={`option-device-${d.id}`}>
                            {d.serial} <Badge className="ml-2 bg-emerald-600 hover:bg-emerald-600">active</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="amount">Amount ({merchant.currency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="12500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      data-testid="input-amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="items">Items</Label>
                    <Input
                      id="items"
                      type="number"
                      min={1}
                      value={items}
                      onChange={(e) => setItems(e.target.value)}
                      data-testid="input-items"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="food">Food & beverages</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={!deviceId || !amount || issueMutation.isPending}
                  onClick={() => issueMutation.mutate()}
                  data-testid="button-issue"
                >
                  {issueMutation.isPending ? "Signing receipt…" : "Issue signed receipt"}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Last issued receipt
                </div>
                {!lastReceipt && (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-receipt">
                    Issue a receipt to see the printable thermal preview and QR code.
                  </p>
                )}
                {lastReceipt && (
                  <div className="rounded-lg border bg-card p-4">
                    <div ref={printRef}>
                      <h2>{lastReceipt.merchantName}</h2>
                      {merchant.city && <div className="row"><span>{merchant.city}</span><span>{merchant.countryCode}</span></div>}
                      <div className="row"><span>VAT</span><span>{merchant.vatRegistrationNumber ?? "—"}</span></div>
                      <div className="row"><span>Device</span><span data-testid="text-device-serial">{lastReceipt.deviceSerial}</span></div>
                      <div className="row"><span>Issued</span><span>{new Date(lastReceipt.issuedAt).toLocaleString()}</span></div>
                      <div className="row total"><span>TOTAL</span><span data-testid="text-total">{Number(lastReceipt.amount).toLocaleString()} {lastReceipt.currency}</span></div>
                      <div className="row"><span>VAT (18%)</span><span>{Number(lastReceipt.vatAmount).toLocaleString()} {lastReceipt.currency}</span></div>
                      <div className="row"><span>Fiscal code</span><span data-testid="text-fiscal-code">{lastReceipt.fiscalCode}</span></div>
                      <div className="qr">
                        <canvas ref={qrCanvasRef} data-testid="canvas-qr" />
                      </div>
                      <div className="footer">
                        Scan the QR with the Loto Fiscal app for a chance to win.<br />
                        Signature is verified cryptographically.
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={handlePrint} data-testid="button-print">
                        <Printer className="h-4 w-4 mr-2" /> Print thermal copy
                      </Button>
                      <Button variant="ghost" onClick={() => setAnimationOpen(true)} data-testid="button-replay-animation">
                        Replay animation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <LotoPosAnimation
        open={animationOpen}
        onOpenChange={setAnimationOpen}
        receipt={animationReceipt}
      />
    </div>
  );
}
