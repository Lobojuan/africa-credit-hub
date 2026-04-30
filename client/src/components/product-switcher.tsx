import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  ACTIVE_PRODUCT_STORAGE_KEY,
  PRODUCT_ORDER,
  PRODUCT_REGISTRY,
  getAccessibleProducts,
  getProductForPath,
  readActiveProduct,
  writeActiveProduct,
  type ProductId,
} from "@/lib/products";

export function ProductSwitcher() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [active, setActive] = useState<ProductId>(() => readActiveProduct());

  useEffect(() => {
    const fromUrl = getProductForPath(location);
    if (fromUrl && fromUrl.id !== active) {
      setActive(fromUrl.id);
      writeActiveProduct(fromUrl.id);
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onChange = (e: Event) => {
      const id = (e as CustomEvent<ProductId>).detail;
      if (id) setActive(id);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_PRODUCT_STORAGE_KEY && e.newValue) {
        setActive(e.newValue as ProductId);
      }
    };
    window.addEventListener("ach:active-product-changed", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("ach:active-product-changed", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const accessibleIds = new Set(getAccessibleProducts(user?.role, (user as any)?.allowedProducts).map((p) => p.id));
  const current = PRODUCT_REGISTRY[active];
  const CurrentIcon = current.icon;

  const choose = (id: ProductId) => {
    const p = PRODUCT_REGISTRY[id];
    writeActiveProduct(id);
    setActive(id);
    setLocation(p.primaryAuthRoute);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 px-2.5"
          data-testid="button-product-switcher"
          title={t("platform.switchProduct")}
        >
          <span
            className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${current.accentFrom}, ${current.accentTo})` }}
            aria-hidden
          >
            <CurrentIcon className="w-3 h-3" />
          </span>
          <span className="hidden sm:inline text-sm font-semibold truncate max-w-[120px]" data-testid="text-active-product">
            {t(current.nameKey, current.englishName)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("platform.headerProduct")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PRODUCT_ORDER.filter((id) => accessibleIds.has(id)).map((id) => {
          const p = PRODUCT_REGISTRY[id];
          const Icon = p.icon;
          const isActive = id === active;
          return (
            <DropdownMenuItem
              key={id}
              onSelect={() => choose(id)}
              className="gap-3 py-2.5 cursor-pointer"
              data-testid={`menuitem-product-${id}`}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${p.accentFrom}, ${p.accentTo})` }}
              >
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">{t(p.nameKey, p.englishName)}</span>
                <span className="text-[11px] text-muted-foreground truncate">{t(p.taglineKey, p.englishTagline)}</span>
              </div>
              {isActive && <Check className="w-4 h-4 text-emerald-600" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => setLocation("/choose-product")}
          className="gap-2 text-xs text-muted-foreground cursor-pointer"
          data-testid="menuitem-back-to-chooser"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {t("platform.backToChooser")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProductSwitcher;
