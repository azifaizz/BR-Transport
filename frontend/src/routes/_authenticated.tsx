import { createFileRoute, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2, Truck, LogOut } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isBootstrapping, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleMobileLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      void navigate({ to: "/login", replace: true });
    } catch {
      toast.error("Failed to log out");
    }
  };

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        search={{ redirect: location.href }}
      />
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col w-full min-h-screen bg-muted/20">
        <header className="sticky top-0 z-50 flex h-14 md:hidden items-center gap-3 border-b bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 px-4 shrink-0 shadow-sm">
          <SidebarTrigger className="text-sidebar-foreground" />
          <div className="flex items-center gap-2">
            <img src="/BR.png" alt="BR Transport Logo" className="h-7 w-7 rounded-md object-contain shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">BR Transport</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleMobileLogout}
            className="ml-auto p-2 text-sidebar-foreground/80 hover:text-destructive transition-colors rounded-md cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
