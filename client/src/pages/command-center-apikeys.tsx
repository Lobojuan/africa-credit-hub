import { useQuery, useMutation } from "@tanstack/react-query";
import { Key, Globe, Shield, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CommandCenterApiKeysTab() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{
    keys: any[];
    configurations: any[];
  }>({
    queryKey: ["/api/platform/api-keys"],
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/platform/api-keys/${id}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/api-keys"] });
      toast({ title: "API key revoked" });
    },
  });

  const keys = data?.keys || [];
  const configs = data?.configurations || [];
  const activeKeys = keys.filter(k => k.status === "active");
  const revokedKeys = keys.filter(k => k.status === "revoked");

  return (
    <div className="space-y-4" data-testid="panel-api-keys">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground" data-testid="text-total-keys">{keys.length}</p>
          <p className="text-[10px] text-muted-foreground">Total API Keys</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{activeKeys.length}</p>
          <p className="text-[10px] text-muted-foreground">Active Keys</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{revokedKeys.length}</p>
          <p className="text-[10px] text-muted-foreground">Revoked</p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">{configs.length}</p>
          <p className="text-[10px] text-muted-foreground">API Integrations</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted p-4">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
        </div>
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No API keys issued yet</div>
        ) : (
          <div className="space-y-2">
            {keys.map(key => (
              <div key={key.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 bg-muted/50 hover:bg-accent transition-colors" data-testid={`apikey-row-${key.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{key.label}</span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${key.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {key.status}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted-foreground/20 text-muted-foreground border-border">
                      {key.permissions}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">{key.keyPrefix}••••••••</span>
                    <span className="text-[10px] text-muted-foreground">
                      Created: {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "—"}
                    </span>
                    {key.lastUsedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {key.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/20"
                    onClick={() => revokeMutation.mutate(key.id)}
                    disabled={revokeMutation.isPending}
                    data-testid={`button-revoke-${key.id}`}
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-foreground">External API Integrations</h3>
        </div>
        {configs.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No external API integrations configured</div>
        ) : (
          <div className="space-y-2">
            {configs.map(cfg => (
              <div key={cfg.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 bg-muted/50" data-testid={`apiconfig-row-${cfg.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{cfg.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted-foreground/20 text-muted-foreground border-border">
                      {cfg.category}
                    </Badge>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${cfg.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-muted-foreground/20 text-muted-foreground border-border"}`}>
                      {cfg.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {cfg.country && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {cfg.country}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono truncate">{cfg.baseUrl}</span>
                    <span className="text-[10px] text-muted-foreground">Auth: {cfg.authType}</span>
                    {cfg.lastTestedAt && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {cfg.lastTestStatus === "success" ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        Tested: {new Date(cfg.lastTestedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {cfg.description && <p className="text-[10px] text-muted-foreground mt-1">{cfg.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
