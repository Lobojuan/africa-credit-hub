import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ShieldCheck, ShieldAlert, ShieldOff, Plus, RefreshCw, Cpu } from "lucide-react";

interface MerchantSummary {
  id: string;
  shopName: string;
  vatRegistrationNumber: string | null;
  countryCode: string;
  city: string | null;
}

interface DeviceRow {
  id: string;
  serial: string;
  merchantId: string;
  countryCode: string;
  keyVaultBackend: string;
  keyReference: string | null;
  certifiedBy: string | null;
  certifiedAt: string | null;
  status: "pending" | "active" | "revoked";
  revokedReason: string | null;
  lastSeenAt: string | null;
  createdAt: string | null;
}

function StatusBadge({ status }: { status: DeviceRow["status"] }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600" data-testid={`badge-status-active`}>
        <ShieldCheck className="h-3 w-3 mr-1" /> Active
      </Badge>
    );
  }
  if (status === "revoked") {
    return (
      <Badge variant="destructive" data-testid={`badge-status-revoked`}>
        <ShieldOff className="h-3 w-3 mr-1" /> Revoked
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" data-testid={`badge-status-pending`}>
      <ShieldAlert className="h-3 w-3 mr-1" /> Pending
    </Badge>
  );
}

export default function LotoDevicesAdminPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [merchantFilter, setMerchantFilter] = useState<string>("all");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [serial, setSerial] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [certifier, setCertifier] = useState("");
  const [activate, setActivate] = useState(true);
  const [revokeFor, setRevokeFor] = useState<DeviceRow | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const merchantsQ = useQuery<MerchantSummary[]>({ queryKey: ["/api/loto/merchants"] });

  const devicesKey = ["/api/loto/devices", { status: statusFilter, merchantId: merchantFilter }];
  const devicesQ = useQuery<DeviceRow[]>({
    queryKey: devicesKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (merchantFilter !== "all") params.set("merchantId", merchantFilter);
      const url = `/api/loto/devices${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load devices");
      return res.json();
    },
  });

  const merchantsById = (merchantsQ.data ?? []).reduce<Record<string, MerchantSummary>>((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {});

  const registerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/loto/devices", {
        serial: serial.trim(),
        merchantId,
        certifiedBy: certifier.trim() || undefined,
        activate,
      });
    },
    onSuccess: () => {
      toast({ title: "Device registered", description: `${serial} is now ${activate ? "active" : "pending certification"}.` });
      setRegisterOpen(false);
      setSerial(""); setMerchantId(""); setCertifier(""); setActivate(true);
      queryClient.invalidateQueries({ queryKey: ["/api/loto/devices"] });
    },
    onError: (e: any) => {
      toast({ title: "Registration failed", description: e?.message ?? String(e), variant: "destructive" });
    },
  });

  const certifyMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/loto/devices/${id}/certify`, {}),
    onSuccess: () => {
      toast({ title: "Device certified" });
      queryClient.invalidateQueries({ queryKey: ["/api/loto/devices"] });
    },
    onError: (e: any) => toast({ title: "Certification failed", description: e?.message, variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("POST", `/api/loto/devices/${id}/revoke`, { reason }),
    onSuccess: () => {
      toast({ title: "Device revoked" });
      setRevokeFor(null);
      setRevokeReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/loto/devices"] });
    },
    onError: (e: any) => toast({ title: "Revocation failed", description: e?.message, variant: "destructive" }),
  });

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-loto-devices-admin">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-title">
            <Cpu className="h-7 w-7" /> Loto Fiscal — EFD Device Registry
          </h1>
          <p className="text-muted-foreground mt-1">
            Register, certify, and revoke fiscal devices that issue cryptographically signed receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => devicesQ.refetch()}
            data-testid="button-refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-register-device">
                <Plus className="h-4 w-4 mr-2" /> Register device
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-register-device">
              <DialogHeader>
                <DialogTitle>Register a new EFD</DialogTitle>
                <DialogDescription>
                  A fresh HMAC-SHA256 signing key is generated and stored under the active key vault. Enable
                  immediate certification only when the physical device has been inspected by DGI.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="serial">Device serial</Label>
                  <Input
                    id="serial"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    placeholder="e.g. EFD-CIV-000123"
                    data-testid="input-serial"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant</Label>
                  <Select value={merchantId} onValueChange={setMerchantId}>
                    <SelectTrigger id="merchant" data-testid="select-merchant">
                      <SelectValue placeholder="Pick a merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      {(merchantsQ.data ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.id} data-testid={`option-merchant-${m.id}`}>
                          {m.shopName} {m.city ? `· ${m.city}` : ""} ({m.countryCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certifier">Certifier (optional)</Label>
                  <Input
                    id="certifier"
                    value={certifier}
                    onChange={(e) => setCertifier(e.target.value)}
                    placeholder="DGI inspector name or ID"
                    data-testid="input-certifier"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={activate}
                    onChange={(e) => setActivate(e.target.checked)}
                    data-testid="checkbox-activate"
                  />
                  Activate immediately (otherwise device starts in "pending" state)
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRegisterOpen(false)} data-testid="button-cancel-register">
                  Cancel
                </Button>
                <Button
                  disabled={!serial.trim() || !merchantId || registerMutation.isPending}
                  onClick={() => registerMutation.mutate()}
                  data-testid="button-confirm-register"
                >
                  {registerMutation.isPending ? "Registering…" : "Register device"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Scope the device list by status or merchant.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Merchant</Label>
            <Select value={merchantFilter} onValueChange={setMerchantFilter}>
              <SelectTrigger className="w-72" data-testid="select-merchant-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All merchants</SelectItem>
                {(merchantsQ.data ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.shopName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>
            {devicesQ.data?.length ?? 0} device{(devicesQ.data?.length ?? 0) === 1 ? "" : "s"} match the current filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devicesQ.isLoading && <Skeleton className="h-32 w-full" />}
          {devicesQ.isError && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load</AlertTitle>
              <AlertDescription>{(devicesQ.error as Error)?.message}</AlertDescription>
            </Alert>
          )}
          {devicesQ.data && devicesQ.data.length === 0 && (
            <p className="text-muted-foreground" data-testid="text-empty">No devices match the current filters.</p>
          )}
          {devicesQ.data && devicesQ.data.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Key vault</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesQ.data.map((d) => {
                    const merchant = merchantsById[d.merchantId];
                    return (
                      <TableRow key={d.id} data-testid={`row-device-${d.id}`}>
                        <TableCell className="font-mono" data-testid={`text-serial-${d.id}`}>{d.serial}</TableCell>
                        <TableCell data-testid={`text-merchant-${d.id}`}>
                          {merchant ? `${merchant.shopName}${merchant.city ? ` · ${merchant.city}` : ""}` : d.merchantId}
                        </TableCell>
                        <TableCell>{d.countryCode}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.keyVaultBackend}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell className="text-xs">{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {d.status !== "active" && d.status !== "revoked" && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={certifyMutation.isPending}
                                onClick={() => certifyMutation.mutate(d.id)}
                                data-testid={`button-certify-${d.id}`}
                              >
                                Certify
                              </Button>
                            )}
                            {d.status !== "revoked" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => { setRevokeFor(d); setRevokeReason(""); }}
                                data-testid={`button-revoke-${d.id}`}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!revokeFor} onOpenChange={(o) => { if (!o) { setRevokeFor(null); setRevokeReason(""); } }}>
        <DialogContent data-testid="dialog-revoke">
          <DialogHeader>
            <DialogTitle>Revoke device {revokeFor?.serial}</DialogTitle>
            <DialogDescription>
              Revoked devices can no longer issue receipts. Existing signed receipts remain verifiable but new
              issuance is blocked. This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Hardware tampering detected, merchant deregistered, etc."
              data-testid="input-revoke-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeFor(null)} data-testid="button-cancel-revoke">Cancel</Button>
            <Button
              variant="destructive"
              disabled={revokeReason.trim().length < 3 || revokeMutation.isPending}
              onClick={() => revokeFor && revokeMutation.mutate({ id: revokeFor.id, reason: revokeReason.trim() })}
              data-testid="button-confirm-revoke"
            >
              {revokeMutation.isPending ? "Revoking…" : "Revoke device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
