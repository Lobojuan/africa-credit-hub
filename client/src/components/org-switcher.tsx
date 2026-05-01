import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrgSwitcher } from "@/hooks/use-org-switcher";
import { useAuth } from "@/hooks/use-auth";
import { Building2, ChevronDown, Check, Eye, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { isSingleCountryMode, getCountryConfig } from "@/lib/country-mode";

interface OrgListItem {
  id: string;
  name: string;
  type: string;
  status: string;
  country: string | null;
  subscriptionTier: string;
}

export function OrgSwitcher() {
  const { user } = useAuth();
  const { selectedOrgId, selectedOrgName, setSelectedOrg } = useOrgSwitcher();
  const [open, setOpen] = useState(false);

  const isPrivileged = user?.role === "super_admin" || user?.role === "platform_owner";

  const { data: orgs } = useQuery<OrgListItem[]>({
    queryKey: ["/api/admin/organizations/list"],
    enabled: isPrivileged,
  });

  if (!isPrivileged) return null;

  const displayName = selectedOrgName || "All Clients";

  const handleSelect = (orgId: string | null, orgName: string | null) => {
    setSelectedOrg(orgId, orgName);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs max-w-[200px]"
          data-testid="button-org-switcher"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{displayName}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] p-0">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Viewing Client Data</p>
          {isSingleCountryMode() && (() => {
            const cc = getCountryConfig();
            return cc ? (
              <div className="flex items-center gap-1.5 mt-1">
                <Globe className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-semibold text-blue-500" data-testid="text-org-switcher-country">{cc.name} Only</span>
              </div>
            ) : null;
          })()}
        </div>
        <Separator />
        <div className="max-h-[320px] overflow-y-auto">
          <button
            onClick={() => handleSelect(null, null)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors ${!selectedOrgId ? "bg-accent" : ""}`}
            data-testid="menu-item-all-clients"
          >
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm font-medium flex-1">All Clients</span>
            {!selectedOrgId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
          </button>
          <Separator />
          {orgs?.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelect(org.id, org.name)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors ${selectedOrgId === org.id ? "bg-accent" : ""}`}
              data-testid={`menu-item-org-${org.id}`}
            >
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm truncate">{org.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {org.type} · {org.country || "N/A"} · {org.subscriptionTier}
                </span>
              </div>
              {selectedOrgId === org.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          ))}
          {(!orgs || orgs.length === 0) && (
            <div className="p-3 text-xs text-muted-foreground text-center">
              No clients found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
