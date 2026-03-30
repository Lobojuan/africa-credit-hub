import { QueryClient, QueryFunction } from "@tanstack/react-query";

let _selectedOrgId: string | null = null;
let _csrfToken: string | null = null;

export function setGlobalOrgId(orgId: string | null) {
  _selectedOrgId = orgId;
}

export function getGlobalOrgId(): string | null {
  return _selectedOrgId;
}

export async function fetchCSRFToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  try {
    const res = await fetch("/api/auth/csrf-token", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      _csrfToken = data.token;
      return _csrfToken!;
    }
  } catch {}
  return "";
}

export function clearCSRFToken() {
  _csrfToken = null;
}

function appendOrgId(url: string): string {
  if (!_selectedOrgId) return url;
  if (url.startsWith("/api/auth/") || url.startsWith("/api/external/")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}orgId=${_selectedOrgId}`;
}

async function throwIfResNotOk(res: Response) {
  if (res.status === 440) {
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";

  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    const token = await fetchCSRFToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(appendOrgId(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiFormRequest(
  method: string,
  url: string,
  formData: FormData,
): Promise<Response> {
  const headers: Record<string, string> = {};

  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    const token = await fetchCSRFToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(appendOrgId(url), {
    method,
    headers,
    body: formData,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(appendOrgId(queryKey[0] as string), {
      credentials: "include",
    });

    if (res.status === 440) {
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
