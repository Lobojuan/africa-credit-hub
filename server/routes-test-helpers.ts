import { requireCountryScope } from "./storage";
import { getActiveCountryName } from "./country-mode";

export function getCountryFilter(req?: any): string | undefined {
  const explicitCountry = req?.query?.country as string | undefined;
  const hasExplicit = explicitCountry && explicitCountry !== "all" && explicitCountry !== "";

  if (req?.session?.userRole === "super_admin") {
    if (hasExplicit) return explicitCountry;
    if (!req.session.viewingCountry) return undefined;
    if (req.session.viewingCountry === "global") return undefined;
    return req.session.viewingCountry;
  }
  if (req?.session?.userCountry) {
    return req.session.userCountry;
  }
  const country = getActiveCountryName();
  return country || undefined;
}

export function enforceCountryScopeForNonSuperAdmin(req: any, country: string | undefined, endpoint: string): void {
  if (req.session?.userRole !== "super_admin") {
    requireCountryScope(country, endpoint);
    const userCountry = req.session?.userCountry;
    if (userCountry && country && country !== userCountry) {
      throw new Error(`Access denied: user country "${userCountry}" does not match requested country "${country}" for ${endpoint}`);
    }
  }
}
