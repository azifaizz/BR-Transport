import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BR Transport" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPlaceholder,
});

function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    void navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">BR Transport</p>
              <p className="text-xs text-muted-foreground">Admin console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name ?? user?.email}</p>
              {user?.name ? (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              You're signed in. The full dashboard layout (sidebar navigation, modules, and
              content area) ships in Module 2.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Module 1 complete: authentication is wired to your Spring Boot backend at{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}
              </code>
              .
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
