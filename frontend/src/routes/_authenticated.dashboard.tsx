import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarDays, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { billsApi } from "@/lib/api/bills";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BR Transport" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({
    totalBills: 0,
    todayBills: 0,
    monthBills: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await billsApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bills Generated
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalBills}
            </div>
            <p className="text-xs text-muted-foreground">
              Total number of challans generated
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Bills
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.todayBills}
            </div>
            <p className="text-xs text-muted-foreground">
              How many bills were created today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month's Bills
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.monthBills}
            </div>
            <p className="text-xs text-muted-foreground">
              Number of bills generated this month
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
