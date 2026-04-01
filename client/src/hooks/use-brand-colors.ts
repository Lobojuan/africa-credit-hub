import { useTheme } from "@/components/theme-provider";

export interface BrandColors {
  panelGradient: string;
  headerGradient: string;
  headerGradientSubtle: string;
  iconGradient: string;
  iconGradientSubtle: string;
  accent: string;
  accentLight: string;
  accentMuted: string;
  accentFg: string;
  secondary: string;
  secondaryLight: string;
  textGradient: string;
  heroGradient: string;
  heroDotPattern: string;
  glowA: string;
  glowB: string;
  accentGlow: string;
  accentGlowFaint: string;
  chartPrimary: string;
  chartSecondary: string;
  chartAccent: string;
  badgeBg: string;
  badgeText: string;
}

const panAfricanColors: BrandColors = {
  panelGradient: "linear-gradient(135deg, hsl(175 55% 22%) 0%, hsl(175 45% 16%) 40%, hsl(200 30% 12%) 100%)",
  headerGradient: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))",
  headerGradientSubtle: "linear-gradient(135deg, hsl(175 55% 35%), hsl(175 45% 28%))",
  iconGradient: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))",
  iconGradientSubtle: "linear-gradient(135deg, hsl(175 55% 28% / 0.15), hsl(43 80% 55% / 0.1))",
  accent: "hsl(175 55% 28%)",
  accentLight: "hsl(175 55% 35%)",
  accentMuted: "hsl(175 55% 28% / 0.3)",
  accentFg: "white",
  secondary: "hsl(43 80% 55%)",
  secondaryLight: "hsl(43 80% 65%)",
  textGradient: "linear-gradient(135deg, hsl(175 55% 32%), hsl(43 80% 50%))",
  heroGradient: "linear-gradient(135deg, hsl(175 55% 18%) 0%, hsl(175 55% 12%) 40%, hsl(200 30% 10%) 100%)",
  heroDotPattern: "radial-gradient(circle at 25% 25%, hsl(175 55% 28%) 1px, transparent 1px), radial-gradient(circle at 75% 75%, hsl(43 80% 55%) 1px, transparent 1px)",
  glowA: "hsl(175 55% 28%)",
  glowB: "hsl(43 80% 55%)",
  accentGlow: "rgba(218, 165, 32, 0.3)",
  accentGlowFaint: "rgba(218, 165, 32, 0.15)",
  chartPrimary: "hsl(175 55% 28%)",
  chartSecondary: "hsl(175 55% 50%)",
  chartAccent: "hsl(43 80% 55%)",
  badgeBg: "hsl(175 55% 28% / 0.1)",
  badgeText: "hsl(175 55% 28%)",
};

const scandinavianColors: BrandColors = {
  panelGradient: "linear-gradient(135deg, hsl(210 35% 22%) 0%, hsl(215 30% 16%) 40%, hsl(220 25% 12%) 100%)",
  headerGradient: "linear-gradient(135deg, hsl(210 40% 40%), hsl(215 35% 32%))",
  headerGradientSubtle: "linear-gradient(135deg, hsl(210 40% 45%), hsl(215 35% 38%))",
  iconGradient: "linear-gradient(135deg, hsl(210 45% 48%), hsl(215 40% 38%))",
  iconGradientSubtle: "linear-gradient(135deg, hsl(210 40% 48% / 0.15), hsl(215 35% 55% / 0.1))",
  accent: "hsl(210 45% 42%)",
  accentLight: "hsl(210 45% 52%)",
  accentMuted: "hsl(210 40% 48% / 0.3)",
  accentFg: "white",
  secondary: "hsl(210 30% 60%)",
  secondaryLight: "hsl(210 35% 70%)",
  textGradient: "linear-gradient(135deg, hsl(210 45% 42%), hsl(215 35% 55%))",
  heroGradient: "linear-gradient(135deg, hsl(210 30% 18%) 0%, hsl(215 25% 12%) 40%, hsl(220 20% 10%) 100%)",
  heroDotPattern: "radial-gradient(circle at 25% 25%, hsl(210 40% 48%) 1px, transparent 1px), radial-gradient(circle at 75% 75%, hsl(215 35% 55%) 1px, transparent 1px)",
  glowA: "hsl(210 40% 48%)",
  glowB: "hsl(215 35% 55%)",
  accentGlow: "rgba(66, 135, 245, 0.3)",
  accentGlowFaint: "rgba(66, 135, 245, 0.15)",
  chartPrimary: "hsl(210 45% 42%)",
  chartSecondary: "hsl(210 40% 55%)",
  chartAccent: "hsl(215 35% 60%)",
  badgeBg: "hsl(210 40% 48% / 0.1)",
  badgeText: "hsl(210 45% 42%)",
};

export function useBrandColors(): BrandColors {
  const { visualStyle } = useTheme();
  return visualStyle === "scandinavian" ? scandinavianColors : panAfricanColors;
}

export function getBrandColors(visualStyle: string): BrandColors {
  return visualStyle === "scandinavian" ? scandinavianColors : panAfricanColors;
}

export function withAlpha(hslColor: string, alpha: number): string {
  const cleaned = hslColor.replace(/\)$/, "");
  if (cleaned.includes("/")) {
    return cleaned.replace(/\/\s*[\d.]+/, `/ ${alpha}`) + ")";
  }
  return `${cleaned} / ${alpha})`;
}
