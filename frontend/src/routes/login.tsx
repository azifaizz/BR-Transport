import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Truck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { extractApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — BR Transport" },
      { name: "description", content: "Admin sign in for BR Transport management system." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/bills/new" replace />;
  }

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
      void navigate({ to: "/bills/new", replace: true });
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <img src="/BR.png" alt="BR Transport Logo" className="h-10 w-10 rounded-md object-contain bg-white/10 p-1 shrink-0" />
          <div>
            <p className="text-lg font-semibold tracking-tight">BR Transport</p>
            <p className="text-xs text-sidebar-foreground/70">Management System</p>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Run your transport
            <br />
            <span className="text-accent">operations with ease.</span>
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/70">
            Generate bills, track records, and manage your business — all from a single admin
            console.
          </p>
        </div>

        <p className="text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} BR Transport. All rights reserved.
        </p>

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/BR.png" alt="BR Transport Logo" className="h-10 w-10 rounded-md object-contain shrink-0" />
            <div>
              <p className="text-base font-semibold">BR Transport</p>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your admin credentials to continue.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@brtransport.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Trouble signing in? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
