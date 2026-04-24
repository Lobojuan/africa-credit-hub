import { useState, useEffect, createContext, useContext } from "react";
import { flushSync } from "react-dom";

declare global {}

type Theme = "light" | "dark";
type VisualStyle = "pan-african" | "scandinavian";

const ThemeContext = createContext<{
  theme: Theme;
  visualStyle: VisualStyle;
  toggleTheme: () => void;
  setVisualStyle: (style: VisualStyle) => void;
}>({ theme: "light", visualStyle: "scandinavian", toggleTheme: () => {}, setVisualStyle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const migrated = localStorage.getItem("theme_v25_migrated");
      if (!migrated) {
        localStorage.setItem("theme", "light");
        localStorage.setItem("visualStyle", "scandinavian");
        localStorage.setItem("theme_v25_migrated", "1");
        return "light";
      }
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
    }
    return "light";
  });

  const [visualStyle, setVisualStyleState] = useState<VisualStyle>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("visualStyle");
      if (stored === "pan-african" || stored === "scandinavian") return stored;
    }
    return "scandinavian";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "scandinavian");
    root.classList.add(theme);
    if (visualStyle === "scandinavian") {
      root.classList.add("scandinavian");
    }
    localStorage.setItem("theme", theme);
    localStorage.setItem("visualStyle", visualStyle);
  }, [theme, visualStyle]);

  const toggleTheme = () => {
    const toggle = (prev: Theme): Theme => prev === "light" ? "dark" : "light";

    if (!document.startViewTransition) {
      setTheme(toggle);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(toggle);
      });
    });
  };

  const setVisualStyle = (style: VisualStyle) => {
    if (!document.startViewTransition) {
      setVisualStyleState(style);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        setVisualStyleState(style);
      });
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, visualStyle, toggleTheme, setVisualStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
