import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { queryClient, setGlobalOrgId } from "@/lib/queryClient";

interface OrgSwitcherContextType {
  selectedOrgId: string | null;
  selectedOrgName: string | null;
  setSelectedOrg: (orgId: string | null, orgName: string | null) => void;
}

const OrgSwitcherContext = createContext<OrgSwitcherContextType | null>(null);

export function OrgSwitcherProvider({ children }: { children: ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState<string | null>(null);

  const setSelectedOrg = useCallback((orgId: string | null, orgName: string | null) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    setGlobalOrgId(orgId);
    const skipAuth = (q: any) => !(q.queryKey[0] as string)?.startsWith("/api/auth/");
    queryClient.removeQueries({ predicate: (q) => skipAuth(q) && !q.observers.length });
    queryClient.resetQueries({ predicate: skipAuth });
  }, []);

  return (
    <OrgSwitcherContext.Provider value={{ selectedOrgId, selectedOrgName, setSelectedOrg }}>
      {children}
    </OrgSwitcherContext.Provider>
  );
}

export function useOrgSwitcher() {
  const ctx = useContext(OrgSwitcherContext);
  if (!ctx) throw new Error("useOrgSwitcher must be used within OrgSwitcherProvider");
  return ctx;
}
