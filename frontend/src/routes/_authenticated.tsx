import { createFileRoute, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { Loader2, Truck } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

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
      <div className="flex flex-1 flex-col overflow-hidden bg-muted/20 w-full">
        <header className="flex h-14 md:hidden items-center gap-3 border-b bg-sidebar px-4 shrink-0">
          <SidebarTrigger className="text-sidebar-foreground" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Truck className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">BR Transport</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
