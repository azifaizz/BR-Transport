import { createFileRoute, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";

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
        search={{ redirect: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}
