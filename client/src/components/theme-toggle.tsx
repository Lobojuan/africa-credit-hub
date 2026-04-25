import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, visualStyle, toggleTheme, setVisualStyle } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          data-testid="button-theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Mode</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={toggleTheme}
          data-testid="menu-toggle-mode"
        >
          {theme === "light" ? (
            <><Moon className="w-4 h-4 mr-2" /> Switch to Dark</>
          ) : (
            <><Sun className="w-4 h-4 mr-2" /> Switch to Light</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Visual Style</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setVisualStyle("pan-african")}
          data-testid="menu-style-pan-african"
          className={visualStyle === "pan-african" ? "bg-accent" : ""}
        >
          <Palette className="w-4 h-4 mr-2" />
          Pan-African
          {visualStyle === "pan-african" && <span className="ml-auto text-xs text-primary">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setVisualStyle("scandinavian")}
          data-testid="menu-style-scandinavian"
          className={visualStyle === "scandinavian" ? "bg-accent" : ""}
        >
          <Palette className="w-4 h-4 mr-2" />
          Scandinavian
          {visualStyle === "scandinavian" && <span className="ml-auto text-xs text-primary">Active</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
