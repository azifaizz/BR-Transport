import { FileText, LayoutDashboard, Truck, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "All Bills",
    url: "/bills",
    icon: FileText,
  },
  {
    title: "Bill Generation",
    url: "/bills/new",
    icon: FileText,
  },
  {
    title: "Deleted Bills",
    url: "/bills/deleted",
    icon: FileText,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      void navigate({ to: "/login", replace: true });
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border h-[72px] px-6 justify-center">
        <div className="flex items-center gap-3">
          <img src="/BR.png" alt="BR Transport Logo" className="h-9 w-9 rounded-md object-contain shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-sidebar-foreground">BR Transport</span>
            <span className="text-[10px] font-medium text-sidebar-foreground/70 uppercase tracking-wider">Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mt-4">Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.url === '/bills' 
                  ? location.pathname === '/bills' 
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors font-medium cursor-pointer"
              tooltip="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
