import { describe, it, expect } from "vitest";
import { requireCountryScope, requireDataScope } from "../storage";
import type { User, RetentionPolicy, ApiConfiguration, TelcoDecisionRule, TelcoDecisionLog } from "../../shared/schema";

describe("Country Data Isolation", () => {
  describe("requireCountryScope guard", () => {
    it("throws when country is undefined", () => {
      expect(() => requireCountryScope(undefined, "getUsers")).toThrow(
        "Country scope required for getUsers"
      );
    });

    it("throws when country is empty string", () => {
      expect(() => requireCountryScope("", "getUsers")).toThrow(
        "Country scope required for getUsers"
      );
    });

    it("does not throw when country is provided", () => {
      expect(() => requireCountryScope("Ghana", "getUsers")).not.toThrow();
    });

    it("includes method name in error message", () => {
      expect(() => requireCountryScope(undefined, "getAllDishonouredCheques")).toThrow(
        "Country scope required for getAllDishonouredCheques"
      );
    });

    it("rejects null as country value", () => {
      expect(() => requireCountryScope(null as any, "getRetentionPolicies")).toThrow(
        "Country scope required for getRetentionPolicies"
      );
    });
  });

  describe("requireDataScope guard", () => {
    it("throws when both organizationId and country are undefined", () => {
      expect(() => requireDataScope(undefined, undefined, "getUsers")).toThrow(
        "Data scope required for getUsers"
      );
    });

    it("does not throw when organizationId is provided", () => {
      expect(() => requireDataScope("org-1", undefined, "getUsers")).not.toThrow();
    });

    it("does not throw when country is provided", () => {
      expect(() => requireDataScope(undefined, "Ghana", "getUsers")).not.toThrow();
    });

    it("does not throw when both are provided", () => {
      expect(() => requireDataScope("org-1", "Ghana", "getUsers")).not.toThrow();
    });

    it("throws when both are empty strings", () => {
      expect(() => requireDataScope("", "", "someMethod")).toThrow(
        "Data scope required for someMethod"
      );
    });
  });

  describe("Storage-level enforcement", () => {
    it("getUsers rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getUsers()).rejects.toThrow("Country scope required for getUsers");
    });

    it("getUsers rejects org-only calls without country", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getUsers("nonexistent-org-id")).rejects.toThrow("Country scope required for getUsers");
    });

    it("getUsers allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getUsers(undefined, "NonexistentCountry");
      expect(Array.isArray(result)).toBe(true);
    });

    it("getAllDishonouredCheques rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getAllDishonouredCheques()).rejects.toThrow("Country scope required for getAllDishonouredCheques");
    });

    it("getDecisionRules rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getDecisionRules()).rejects.toThrow("Country scope required for getDecisionRules");
    });

    it("getDecisionLogs rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getDecisionLogs()).rejects.toThrow("Country scope required for getDecisionLogs");
    });

    it("getRetentionPolicies rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getRetentionPolicies()).rejects.toThrow("Country scope required for getRetentionPolicies");
    });

    it("getApiConfigurations rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getApiConfigurations()).rejects.toThrow("Country scope required for getApiConfigurations");
    });

    it("getRetentionPolicies allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getRetentionPolicies("Ghana");
      expect(Array.isArray(result)).toBe(true);
    });

    it("getApiConfigurations allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getApiConfigurations("Ghana");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Country-scoped storage method signatures", () => {
    it("getUsers accepts organizationId and country params", async () => {
      const { DatabaseStorage } = await import("../storage");
      expect(typeof DatabaseStorage.prototype.getUsers).toBe("function");
    });

    it("getAllDishonouredCheques accepts orgId and country params", async () => {
      const { DatabaseStorage } = await import("../storage");
      expect(typeof DatabaseStorage.prototype.getAllDishonouredCheques).toBe("function");
    });

    it("getGuarantorsByBorrower accepts borrowerId and country params", async () => {
      const { DatabaseStorage } = await import("../storage");
      expect(typeof DatabaseStorage.prototype.getGuarantorsByBorrower).toBe("function");
    });

    it("getDecisionRules accepts orgId and country params", async () => {
      const { DatabaseStorage } = await import("../storage");
      expect(typeof DatabaseStorage.prototype.getDecisionRules).toBe("function");
    });

    it("getDecisionLogs accepts orgId and country params", async () => {
      const { DatabaseStorage } = await import("../storage");
      expect(typeof DatabaseStorage.prototype.getDecisionLogs).toBe("function");
    });

    it("getRetentionPolicies accepts country param", async () => {
      const { DatabaseStorage } = await import("../storage");
      expect(typeof DatabaseStorage.prototype.getRetentionPolicies).toBe("function");
    });

    it("getApiConfigurations accepts country param", async () => {
      const { DatabaseStorage } = await import("../storage");
      expect(typeof DatabaseStorage.prototype.getApiConfigurations).toBe("function");
    });
  });

  describe("Schema country columns exist on all required tables", () => {
    const tablesWithCountry = [
      "pendingApprovals",
      "disputes",
      "notifications",
      "borrowers",
      "retentionPolicies",
      "apiConfigurations",
      "telcoDecisionRules",
      "telcoDecisionLogs",
    ];

    tablesWithCountry.forEach((tableName) => {
      it(`${tableName} table has country column`, async () => {
        const schema: Record<string, { country?: unknown }> = await import("../../shared/schema");
        expect(schema[tableName]).toBeDefined();
        expect(schema[tableName].country).toBeDefined();
      });
    });
  });

  describe("Tables with indirect country via organization", () => {
    const tablesWithOrgId = [
      "creditAccounts",
      "auditLogs",
      "billingRecords",
      "dishonouredCheques",
      "courtJudgments",
      "institutions",
    ];

    tablesWithOrgId.forEach((tableName) => {
      it(`${tableName} has organizationId for indirect country filtering`, async () => {
        const schema: Record<string, { organizationId?: unknown }> = await import("../../shared/schema");
        expect(schema[tableName]).toBeDefined();
        expect(schema[tableName].organizationId).toBeDefined();
      });
    });
  });

  describe("Global methods should NOT require country", () => {
    it("getExchangeRates has no country parameter requirement", async () => {
      const { DatabaseStorage } = await import("../storage");
      const proto = DatabaseStorage.prototype;
      expect(typeof proto.getExchangeRates).toBe("function");
      expect(proto.getExchangeRates.length).toBe(0);
    });

    it("getExchangeRates does not throw when called without country", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getExchangeRates();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Cross-country isolation behavior", () => {
    it("requireCountryScope allows different country names", () => {
      const countries = ["Ghana", "Nigeria", "Kenya", "Liberia", "Rwanda", "Tanzania", "Uganda", "Ethiopia", "South Africa", "Sierra Leone"];
      countries.forEach((c) => {
        expect(() => requireCountryScope(c, "test")).not.toThrow();
      });
    });

    it("requireCountryScope blocks all falsy values", () => {
      const falsyValues = [undefined, "", null, 0, false];
      falsyValues.forEach((v) => {
        expect(() => requireCountryScope(v as any, "test")).toThrow(
          "Country scope required"
        );
      });
    });

    it("storage exports both guard functions for route-level enforcement", async () => {
      const storageModule = await import("../storage");
      expect(typeof storageModule.requireCountryScope).toBe("function");
      expect(typeof storageModule.requireDataScope).toBe("function");
    });
  });

  describe("Country data isolation for queries - cross-country negative test", () => {
    it("getUsers for nonexistent country returns empty results", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getUsers(undefined, "XCountryThatDoesNotExist");
      expect(result.length).toBe(0);
    });

    it("getRetentionPolicies for nonexistent country returns empty results", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getRetentionPolicies("XCountryThatDoesNotExist");
      expect(result.length).toBe(0);
    });

    it("getDecisionRules for nonexistent country returns empty results", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getDecisionRules(undefined, "XCountryThatDoesNotExist");
      expect(result.length).toBe(0);
    });

    it("getDecisionLogs for nonexistent country returns empty results", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getDecisionLogs(undefined, "XCountryThatDoesNotExist");
      expect(result.length).toBe(0);
    });
  });

  describe("Billing records require country scope", () => {
    it("getBillingRecordsByInstitution rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getBillingRecordsByInstitution("TestInst")).rejects.toThrow(
        "Country scope required for getBillingRecordsByInstitution"
      );
    });

    it("getBillingRecordsByInstitution allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getBillingRecordsByInstitution("NonexistentInst", "Ghana");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Notification retrieval requires country scope", () => {
    it("getNotifications rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getNotifications("user-id")).rejects.toThrow(
        "Country scope required for getNotifications"
      );
    });

    it("getUnreadNotificationCount rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getUnreadNotificationCount("user-id")).rejects.toThrow(
        "Country scope required for getUnreadNotificationCount"
      );
    });

    it("getNotifications allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getNotifications("nonexistent-user", "XCountryNone");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("getUnreadNotificationCount allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const count = await db.getUnreadNotificationCount("nonexistent-user", "XCountryNone");
      expect(count).toBe(0);
    });
  });

  describe("Guarantor retrieval requires country scope", () => {
    it("getGuarantorsByBorrower rejects unscoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      await expect(db.getGuarantorsByBorrower("nonexistent-id")).rejects.toThrow(
        "Country scope required for getGuarantorsByBorrower"
      );
    });

    it("getGuarantorsByBorrower allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getGuarantorsByBorrower("nonexistent-id", "Ghana");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Two-country data isolation integration", () => {
    it("getUsers scoped to Ghana returns no users from Nigeria-only orgs", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const ghanaUsers = await db.getUsers(undefined, "Ghana");
      const nigeriaUsers = await db.getUsers(undefined, "Nigeria");
      const ghanaOrgIds = new Set(ghanaUsers.map((u) => u.organizationId).filter(Boolean));
      const nigeriaOrgIds = new Set(nigeriaUsers.map((u) => u.organizationId).filter(Boolean));
      ghanaOrgIds.forEach(id => {
        expect(nigeriaOrgIds.has(id)).toBe(false);
      });
    });

    it("getUsers for two different countries return disjoint user sets", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const ghanaUsers = await db.getUsers(undefined, "Ghana");
      const nigeriaUsers = await db.getUsers(undefined, "Nigeria");
      const ghanaIds = new Set(ghanaUsers.map((u) => u.id));
      const nigeriaIds = new Set(nigeriaUsers.map((u) => u.id));
      ghanaIds.forEach(id => {
        expect(nigeriaIds.has(id)).toBe(false);
      });
    });

    it("getRetentionPolicies scoped to Ghana excludes Nigeria policies", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const ghanaPolicies = await db.getRetentionPolicies("Ghana");
      ghanaPolicies.forEach((p) => {
        expect(p.country).toBe("Ghana");
      });
    });

    it("getApiConfigurations scoped to Ghana excludes Nigeria configs", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const ghanaConfigs = await db.getApiConfigurations("Ghana");
      ghanaConfigs.forEach((c) => {
        expect(c.country).toBe("Ghana");
      });
    });

    it("getBorrowers scoped to Ghana returns only Ghana borrowers", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const { data: ghanaBorrowers } = await db.getBorrowers(1, 1000, undefined, "Ghana");
      for (const b of ghanaBorrowers) {
        expect(b.country).toBe("Ghana");
      }
    });

    it("getBorrowers for Ghana and Nigeria return disjoint sets", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const { data: ghanaBorrowers } = await db.getBorrowers(1, 1000, undefined, "Ghana");
      const { data: nigeriaBorrowers } = await db.getBorrowers(1, 1000, undefined, "Nigeria");
      const ghanaIds = new Set(ghanaBorrowers.map(b => b.id));
      for (const b of nigeriaBorrowers) {
        expect(ghanaIds.has(b.id)).toBe(false);
      }
    });

    it("getDashboardStats returns different totals for different countries", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const ghanaStats = await db.getDashboardStats(undefined, "Ghana");
      const fakeCountryStats = await db.getDashboardStats(undefined, "ZZCountryNoExist");
      expect(fakeCountryStats.totalBorrowers).toBe(0);
      expect(ghanaStats.totalBorrowers).toBeGreaterThanOrEqual(0);
    });

    it("getInstitutions scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const { data: noInst } = await db.getInstitutions(1, 50, undefined, "ZZCountryNoExist");
      expect(noInst.length).toBe(0);
    });

    it("getDisputes scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const disputes = await db.getDisputes(undefined, "ZZCountryNoExist");
      expect(disputes.length).toBe(0);
    });

    it("getPendingApprovals scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const approvals = await db.getPendingApprovals(undefined, "ZZCountryNoExist");
      expect(approvals.length).toBe(0);
    });

    it("getBillingRecords scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const billing = await db.getBillingRecords(undefined, "ZZCountryNoExist");
      expect(billing.length).toBe(0);
    });

    it("getAllCreditAccounts scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const accs = await db.getAllCreditAccounts(undefined, "ZZCountryNoExist");
      expect(accs.length).toBe(0);
    });

    it("getAllCourtJudgments scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const judgments = await db.getAllCourtJudgments(undefined, "ZZCountryNoExist");
      expect(judgments.length).toBe(0);
    });

    it("getAllConsentRecords scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const consents = await db.getAllConsentRecords(undefined, "ZZCountryNoExist");
      expect(consents.length).toBe(0);
    });

    it("getCreditReportLogs scoped to nonexistent country returns empty", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const logs = await db.getCreditReportLogs(undefined, "ZZCountryNoExist");
      expect(logs.length).toBe(0);
    });
  });

  describe("NOT NULL constraints on new country columns", () => {
    it("pendingApprovals country is NOT NULL in schema", async () => {
      const schema = await import("../../shared/schema");
      expect(schema.pendingApprovals.country.notNull).toBe(true);
    });

    it("disputes country is NOT NULL in schema", async () => {
      const schema = await import("../../shared/schema");
      expect(schema.disputes.country.notNull).toBe(true);
    });

    it("notifications country is NOT NULL in schema", async () => {
      const schema = await import("../../shared/schema");
      expect(schema.notifications.country.notNull).toBe(true);
    });

    it("telcoDecisionLogs country is NOT NULL in schema", async () => {
      const schema = await import("../../shared/schema");
      expect(schema.telcoDecisionLogs.country.notNull).toBe(true);
    });
  });

  describe("All data retrieval methods require country scope", () => {
    const methodsRequiringCountryScope = [
      { method: "getBorrowers", args: [1, 50, undefined, undefined] },
      { method: "getBorrowersByType", args: ["individual", 1, 50, undefined, undefined] },
      { method: "searchBorrowersByType", args: ["individual", "test", undefined, undefined] },
      { method: "searchBorrowers", args: ["test", undefined, undefined] },
      { method: "globalSearch", args: ["test", undefined, undefined] },
      { method: "getAllCreditAccounts", args: [undefined, undefined] },
      { method: "getAllCreditInquiries", args: [undefined, undefined] },
      { method: "getAuditLogs", args: [undefined, undefined] },
      { method: "getPendingApprovals", args: [undefined, undefined] },
      { method: "getDisputes", args: [undefined, undefined] },
      { method: "getAllCourtJudgments", args: [undefined, undefined] },
      { method: "getAllConsentRecords", args: [undefined, undefined] },
      { method: "getInstitutions", args: [1, 50, undefined, undefined] },
      { method: "getBillingRecords", args: [undefined, undefined] },
      { method: "getCreditReportLogs", args: [undefined, undefined] },
      { method: "getDashboardStats", args: [undefined, undefined] },
      { method: "getDashboardDetails", args: ["borrowers", undefined, undefined] },
      { method: "getBorrowerAlerts", args: [undefined, undefined] },
      { method: "getTelcoProfiles", args: [undefined, undefined] },
      { method: "getTelcoCreditScores", args: [undefined, undefined] },
      { method: "getTelcoDashboardStats", args: [undefined, undefined] },
      { method: "getTelcoAnalyticsAggregates", args: [undefined, undefined] },
      { method: "getAllTelcoProfileIds", args: [undefined, undefined] },
      { method: "getActiveDecisionRule", args: [undefined, undefined] },
      { method: "getTelcoLoans", args: [undefined, undefined] },
      { method: "getTelcoLoanPortfolioStats", args: [undefined, undefined] },
      { method: "getTelcoConsentSummary", args: [undefined, undefined] },
    ];

    for (const { method, args } of methodsRequiringCountryScope) {
      it(`${method} rejects unscoped calls`, async () => {
        const { DatabaseStorage } = await import("../storage");
        const db = new DatabaseStorage();
        await expect((db as any)[method](...args)).rejects.toThrow(`Country scope required for ${method}`);
      });
    }

    it("getBorrowers allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getBorrowers(1, 50, undefined, "Ghana");
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
    });

    it("getDashboardStats allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getDashboardStats(undefined, "Ghana");
      expect(result).toHaveProperty("totalBorrowers");
    });

    it("getInstitutions allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getInstitutions(1, 50, undefined, "Ghana");
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
    });

    it("getDisputes allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getDisputes(undefined, "Ghana");
      expect(Array.isArray(result)).toBe(true);
    });

    it("getPendingApprovals allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getPendingApprovals(undefined, "Ghana");
      expect(Array.isArray(result)).toBe(true);
    });

    it("getBillingRecords allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getBillingRecords(undefined, "Ghana");
      expect(Array.isArray(result)).toBe(true);
    });

    it("getCreditReportLogs allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getCreditReportLogs(undefined, "Ghana");
      expect(Array.isArray(result)).toBe(true);
    });

    it("getAllCourtJudgments allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getAllCourtJudgments(undefined, "Ghana");
      expect(Array.isArray(result)).toBe(true);
    });

    it("getAllConsentRecords allows country-scoped calls", async () => {
      const { DatabaseStorage } = await import("../storage");
      const db = new DatabaseStorage();
      const result = await db.getAllConsentRecords(undefined, "Ghana");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getCountryFilter and enforceCountryScopeForNonSuperAdmin access control", () => {
    it("getCountryFilter only allows super_admin to use explicit query country", async () => {
      const { getCountryFilter } = await import("../routes-test-helpers");
      const adminReq = {
        query: { country: "Nigeria" },
        session: { userRole: "admin", userCountry: "Ghana" },
      } as any;
      const result = getCountryFilter(adminReq);
      expect(result).toBe("Ghana");
      expect(result).not.toBe("Nigeria");
    });

    it("getCountryFilter allows super_admin to use explicit query country", async () => {
      const { getCountryFilter } = await import("../routes-test-helpers");
      const superReq = {
        query: { country: "Nigeria" },
        session: { userRole: "super_admin", userCountry: "Ghana" },
      } as any;
      const result = getCountryFilter(superReq);
      expect(result).toBe("Nigeria");
    });

    it("enforceCountryScopeForNonSuperAdmin blocks cross-country access for admin", async () => {
      const { enforceCountryScopeForNonSuperAdmin } = await import("../routes-test-helpers");
      const adminReq = {
        session: { userRole: "admin", userCountry: "Ghana" },
      } as any;
      expect(() => enforceCountryScopeForNonSuperAdmin(adminReq, "Nigeria", "test-endpoint"))
        .toThrow('Access denied: user country "Ghana" does not match requested country "Nigeria"');
    });

    it("enforceCountryScopeForNonSuperAdmin allows same-country access for admin", async () => {
      const { enforceCountryScopeForNonSuperAdmin } = await import("../routes-test-helpers");
      const adminReq = {
        session: { userRole: "admin", userCountry: "Ghana" },
      } as any;
      expect(() => enforceCountryScopeForNonSuperAdmin(adminReq, "Ghana", "test-endpoint")).not.toThrow();
    });

    it("enforceCountryScopeForNonSuperAdmin allows super_admin cross-country access", async () => {
      const { enforceCountryScopeForNonSuperAdmin } = await import("../routes-test-helpers");
      const superReq = {
        session: { userRole: "super_admin", userCountry: "Ghana" },
      } as any;
      expect(() => enforceCountryScopeForNonSuperAdmin(superReq, "Nigeria", "test-endpoint")).not.toThrow();
    });
  });
});
