import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <FullPageLoader />;
  return <Navigate to={isAuthenticated ? "/bills/new" : "/login"} replace />;
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
