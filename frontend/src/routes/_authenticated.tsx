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
      <div className="flex flex-1 flex-col w-full min-h-screen bg-muted/20">
        <header className="sticky top-0 z-50 flex h-14 md:hidden items-center gap-3 border-b bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 px-4 shrink-0 shadow-sm">
          <SidebarTrigger className="text-sidebar-foreground" />
          <div className="flex items-center gap-2">
            <img src="/BR.png" alt="BR Transport Logo" className="h-7 w-7 rounded-md object-contain shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">BR Transport</span>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
