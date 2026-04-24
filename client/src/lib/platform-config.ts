export const PLATFORM_COMPANY_NAME =
  (import.meta.env.VITE_PLATFORM_COMPANY_NAME as string) || "Africa Credit Hub";
export const PLATFORM_SUPPORT_EMAIL =
  (import.meta.env.VITE_PLATFORM_SUPPORT_EMAIL as string) || "support@africacredithub.com";
export const PLATFORM_CONTACT_PHONE =
  (import.meta.env.VITE_PLATFORM_CONTACT_PHONE as string) || "";
export const PLATFORM_CTO_NAME =
  (import.meta.env.VITE_PLATFORM_CTO_NAME as string) || "Platform CTO";
export const PLATFORM_CTO_EMAIL =
  (import.meta.env.VITE_PLATFORM_CTO_EMAIL as string) || "cto@africacredithub.com";
export const PLATFORM_ADMIN_NAME =
  (import.meta.env.VITE_PLATFORM_ADMIN_NAME as string) || "Uffe Jon Carlson";
export const PLATFORM_REGISTRY_REF =
  (import.meta.env.VITE_PLATFORM_REGISTRY_REF as string) || "CDH-IP-2026-UJC-001";
export const PLATFORM_COPYRIGHT_YEAR = new Date().getFullYear();

export function supportEmailHref(subject?: string): string {
  const to = encodeURIComponent(PLATFORM_SUPPORT_EMAIL);
  const sub = subject ? `&su=${encodeURIComponent(subject)}` : "";
  return `https://mail.google.com/mail/?view=cm&to=${to}${sub}`;
}
