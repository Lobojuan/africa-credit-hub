import { describe, expect, it } from "vitest";
import { normaliseDetectedLanguage } from "@/lib/language-detection";

describe("normaliseDetectedLanguage", () => {
  it("uses English for common English-speaking browser locales", () => {
    expect(normaliseDetectedLanguage("en-GB")).toBe("en");
    expect(normaliseDetectedLanguage("en-GH")).toBe("en");
    expect(normaliseDetectedLanguage("en_US")).toBe("en");
  });

  it("uses French for common French-speaking browser locales", () => {
    expect(normaliseDetectedLanguage("fr-FR")).toBe("fr");
    expect(normaliseDetectedLanguage("fr-CA")).toBe("fr");
  });

  it("preserves supported locales and falls back safely", () => {
    expect(normaliseDetectedLanguage("zh-HK")).toBe("zh-TW");
    expect(normaliseDetectedLanguage("pt-BR")).toBe("pt");
    expect(normaliseDetectedLanguage("de-DE")).toBe("en");
  });
});
