import { useState, useEffect, createContext, useContext } from "react";
import { flushSync } from "react-dom";

declare global {
  interface Document {
    startViewTransition?: (callback: () => void) => void;
  }
}

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: "light", toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
