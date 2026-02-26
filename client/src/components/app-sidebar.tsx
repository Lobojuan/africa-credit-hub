import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Search,
  FileText,
  Shield,
  Settings,
  Database,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Borrowers", url: "/borrowers", icon: Users },
  { title: "Credit Accounts", url: "/credit-accounts", icon: CreditCard },
  { title: "Credit Search", url: "/search", icon: Search },
];

const reportItems = [
  { title: "Credit Reports", url: "/reports", icon: FileText },
  { title: "Audit Trail", url: "/audit", icon: Shield },
];

const adminItems = [
  { title: "User Management", url: "/users", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Credit Registry</span>
              <span className="text-[11px] text-muted-foreground">National Bank of Ethiopia</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Reports & Compliance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-[11px] text-muted-foreground">
          v1.0.0 — NBE Credit Registry
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
