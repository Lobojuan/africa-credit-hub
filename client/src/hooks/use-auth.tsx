import { createContext, useContext, useEffect, useCallback, useState, useRef, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn, clearCSRFToken, fetchCSRFToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Organization } from "@shared/schema";

type AuthUser = Omit<User, "password"> & { passwordExpired?: boolean; organization?: Organization | null };

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  passwordExpired: boolean;
  accountSuspended: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [accountSuspended, setAccountSuspended] = useState(false);
  const sessionExpiredRef = useRef(false);

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: Infinity,
    retry: false,
  });

  const handleIdleTimeout = useCallback(() => {
    if (sessionExpiredRef.current) return;
    sessionExpiredRef.current = true;

    queryClient.cancelQueries();
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();

    window.location.replace("/login");
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (sessionExpiredRef.current) {
        return new Response(JSON.stringify({ message: "Session expired" }), {
          status: 440,
          headers: { "Content-Type": "application/json" },
        });
      }
      const response = await originalFetch(...args);
      if (response.status === 440) {
        handleIdleTimeout();
      }
      if (response.status === 403) {
        try {
          const cloned = response.clone();
          const body = await cloned.json();
          if (body.message === "ACCOUNT_SUSPENDED") {
            setAccountSuspended(true);
          }
        } catch {}
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [handleIdleTimeout]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json() as Promise<AuthUser>;
    },
    onSuccess: (data) => {
      sessionExpiredRef.current = false;
      clearCSRFToken();
      fetchCSRFToken();
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      clearCSRFToken();
      window.location.replace("/");
    },
    onError: () => {
      clearCSRFToken();
      window.location.replace("/");
    },
  });

  const login = async (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const passwordExpired = !!(user && (user as AuthUser).passwordExpired);

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, passwordExpired, accountSuspended, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
