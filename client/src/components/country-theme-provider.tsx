import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  type CountryConfig,
  type CountryTheme,
  getCountryConfigByName,
  getSupportedCountries,
  GLOBAL_VIEW_THEME,
  getCountryConfig,
} from "@/lib/country-mode";

interface CountryContextType {
  activeCountry: string | null;
  activeConfig: CountryConfig | null;
  activeTheme: CountryTheme;
  isGlobalView: boolean;
  setCountry: (country: string | null) => Promise<void>;
  isSwitching: boolean;
}

const CountryContext = createContext<CountryContextType | null>(null);

function applyTheme(theme: CountryTheme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);
  root.style.setProperty("--sidebar", theme.sidebar);
  root.style.setProperty("--sidebar-foreground", theme.sidebarForeground);
  root.style.setProperty("--sidebar-border", theme.sidebarBorder);
  root.style.setProperty("--sidebar-primary", theme.sidebarPrimary);
  root.style.setProperty("--sidebar-accent", theme.sidebarAccent);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--ring", theme.ring);
  root.style.setProperty("--chart-1", theme.chart1);
  root.style.setProperty("--chart-2", theme.chart2);
}

export function CountryThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const serverCountry = (user as any)?.viewingCountry as string | undefined;

  const [activeCountry, setActiveCountry] = useState<string | null>(
    serverCountry && serverCountry !== "global" ? serverCountry : null
  );
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (serverCountry && serverCountry !== "global") {
      setActiveCountry(serverCountry);
    } else if (serverCountry === "global") {
      setActiveCountry(null);
    }
  }, [serverCountry]);

  const activeConfig = activeCountry ? getCountryConfigByName(activeCountry) : null;
  const isGlobalView = !activeCountry;
  const activeTheme = activeConfig?.theme || (isGlobalView ? GLOBAL_VIEW_THEME : (getCountryConfig()?.theme || GLOBAL_VIEW_THEME));

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const switchMutation = useMutation({
    mutationFn: async (country: string | null) => {
      const res = await apiRequest("POST", "/api/platform/set-country", {
        country: country || "global",
      });
      return res.json();
    },
  });

  const setCountry = useCallback(async (country: string | null) => {
    if (!isSuperAdmin) return;
    setIsSwitching(true);
    try {
      await switchMutation.mutateAsync(country);
      setActiveCountry(country);
      await queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0] as string;
          return key && !key.startsWith("/api/auth/");
        },
        refetchType: "all",
      });
      queryClient.setQueryData(["/api/auth/me"], (old: any) => {
        if (!old) return old;
        return { ...old, viewingCountry: country || "global" };
      });
    } finally {
      setIsSwitching(false);
    }
  }, [isSuperAdmin, switchMutation]);

  return (
    <CountryContext.Provider value={{ activeCountry, activeConfig, activeTheme, isGlobalView, setCountry, isSwitching }}>
      {children}
    </CountryContext.Provider>
  );
}

const defaultCountryContext: CountryContextType = {
  activeCountry: null,
  activeConfig: null,
  activeTheme: GLOBAL_VIEW_THEME,
  isGlobalView: true,
  setCountry: async () => {},
  isSwitching: false,
};

export function useCountryTheme(): CountryContextType {
  const ctx = useContext(CountryContext);
  return ctx || defaultCountryContext;
}
