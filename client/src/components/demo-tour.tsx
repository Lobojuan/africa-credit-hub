import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar";
import {
  X, ChevronRight, ChevronLeft, Sparkles,
  LayoutDashboard, Users, CreditCard, Search, Shield,
  FileText, MessageCircle, Globe, Moon, History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TourStep = {
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  target?: string;
  navigateTo?: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    titleKey: "demoTour.steps.welcome.title",
    descriptionKey: "demoTour.steps.welcome.desc",
    icon: Sparkles,
  },
  {
    titleKey: "demoTour.steps.dashboard.title",
    descriptionKey: "demoTour.steps.dashboard.desc",
    icon: LayoutDashboard,
    target: "[data-testid='stat-borrowers']",
    navigateTo: "/",
  },
  {
    titleKey: "demoTour.steps.borrowers.title",
    descriptionKey: "demoTour.steps.borrowers.desc",
    icon: Users,
    target: "[data-testid='nav-borrowers']",
  },
  {
    titleKey: "demoTour.steps.creditAccounts.title",
    descriptionKey: "demoTour.steps.creditAccounts.desc",
    icon: CreditCard,
    target: "[data-testid='nav-credit-accounts']",
  },
  {
    titleKey: "demoTour.steps.search.title",
    descriptionKey: "demoTour.steps.search.desc",
    icon: Search,
    target: "[data-testid='nav-credit-search']",
  },
  {
    titleKey: "demoTour.steps.makerChecker.title",
    descriptionKey: "demoTour.steps.makerChecker.desc",
    icon: Shield,
    target: "[data-testid='nav-pending-approvals']",
  },
  {
    titleKey: "demoTour.steps.disputes.title",
    descriptionKey: "demoTour.steps.disputes.desc",
    icon: FileText,
    target: "[data-testid='nav-disputes']",
  },
  {
    titleKey: "demoTour.steps.chatbot.title",
    descriptionKey: "demoTour.steps.chatbot.desc",
    icon: MessageCircle,
    target: "[data-testid='button-open-chatbot']",
  },
  {
    titleKey: "demoTour.steps.language.title",
    descriptionKey: "demoTour.steps.language.desc",
    icon: Globe,
    target: "[data-testid='select-language']",
  },
  {
    titleKey: "demoTour.steps.theme.title",
    descriptionKey: "demoTour.steps.theme.desc",
    icon: Moon,
    target: "[data-testid='button-theme-toggle']",
  },
  {
    titleKey: "demoTour.steps.explore.title",
    descriptionKey: "demoTour.steps.explore.desc",
    icon: History,
  },
];

export function DemoTour({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [, navigate] = useLocation();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const currentStep = TOUR_STEPS[step];
  const totalSteps = TOUR_STEPS.length;

  const isSidebarTarget = currentStep.target?.includes("nav-");

  const updateHighlight = useCallback(() => {
    if (!currentStep.target) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setHighlightRect(null);
    }
  }, [currentStep.target]);

  useEffect(() => {
    if (isSidebarTarget) {
      if (isMobile) setOpenMobile(true);
      else setOpen(true);
    } else if (isMobile) {
      setOpenMobile(false);
    }
    if (currentStep.navigateTo) {
      navigate(currentStep.navigateTo);
    }
    const timer = setTimeout(updateHighlight, 400);
    return () => clearTimeout(timer);
  }, [step, currentStep.navigateTo, navigate, updateHighlight, isSidebarTarget, isMobile, setOpen, setOpenMobile]);

  useEffect(() => {
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [updateHighlight]);

  const goNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else onClose();
  };

  const goPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const Icon = currentStep.icon;

  const cardStyle: React.CSSProperties = {};
  if (highlightRect) {
    const padding = 12;
    const cardWidth = 340;
    const cardHeight = 220;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = highlightRect.right + padding;
    let top = highlightRect.top;

    if (left + cardWidth > viewportW) {
      left = highlightRect.left - cardWidth - padding;
    }
    if (left < padding) {
      left = Math.max(padding, highlightRect.left);
      top = highlightRect.bottom + padding;
    }
    if (top + cardHeight > viewportH) {
      top = viewportH - cardHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    cardStyle.position = "fixed";
    cardStyle.left = `${left}px`;
    cardStyle.top = `${top}px`;
  }

  return (
    <div className="fixed inset-0 z-[100]" data-testid="demo-tour-overlay">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {highlightRect && (
        <div
          className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] bg-transparent pointer-events-none"
          style={{
            left: highlightRect.left - 4,
            top: highlightRect.top - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            zIndex: 101,
          }}
        />
      )}

      <Card
        className={`z-[102] w-[340px] shadow-2xl border-primary/20 ${!highlightRect ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : ""}`}
        style={highlightRect ? cardStyle : undefined}
        data-testid="demo-tour-card"
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {t("demoTour.stepOf", { current: step + 1, total: totalSteps })}
                </p>
                <h3 className="text-sm font-semibold leading-tight">
                  {t(currentStep.titleKey)}
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onClose}
              data-testid="button-tour-close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {t(currentStep.descriptionKey)}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={goPrev}
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  {t("demoTour.prev")}
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={goNext}
                data-testid="button-tour-next"
              >
                {step < totalSteps - 1 ? (
                  <>
                    {t("demoTour.next")}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  t("demoTour.finish")
                )}
              </Button>
            </div>
          </div>

          <button
            className="w-full text-center text-xs text-muted-foreground/60 mt-3 hover:text-muted-foreground transition-colors"
            onClick={onClose}
            data-testid="button-tour-skip"
          >
            {t("demoTour.skip")}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
