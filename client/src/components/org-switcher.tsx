import { useQuery } from "@tanstack/react-query";
import { useOrgSwitcher } from "@/hooks/use-org-switcher";
import { useAuth } from "@/hooks/use-auth";
import { Building2, ChevronDown, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const { data: orgs } = useQuery<OrgListItem[]>({
    queryKey: ["/api/admin/organizations/list"],
    enabled: user?.role === "super_admin",
  });

  if (user?.role !== "super_admin") return null;

  const displayName = selectedOrgName || "All Clients";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Viewing Client Data
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setSelectedOrg(null, null)}
          className={!selectedOrgId ? "bg-accent" : ""}
          data-testid="menu-item-all-clients"
        >
          <Building2 className="w-4 h-4 mr-2 text-amber-500" />
          <span className="font-medium">All Clients</span>
          {!selectedOrgId && (
            <Badge variant="secondary" className="ml-auto text-[10px] h-5">Active</Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[300px]">
          {orgs?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setSelectedOrg(org.id, org.name)}
              className={selectedOrgId === org.id ? "bg-accent" : ""}
              data-testid={`menu-item-org-${org.id}`}
            >
              <Building2 className="w-4 h-4 mr-2 text-primary shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm truncate">{org.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {org.type} • {org.country || "N/A"} • {org.subscriptionTier}
                </span>
              </div>
              {selectedOrgId === org.id && (
                <Badge variant="secondary" className="ml-auto text-[10px] h-5 shrink-0">Active</Badge>
              )}
            </DropdownMenuItem>
          ))}
          {(!orgs || orgs.length === 0) && (
            <div className="p-3 text-xs text-muted-foreground text-center">
              No clients found
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
