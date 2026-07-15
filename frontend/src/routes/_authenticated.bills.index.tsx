import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { billsApi, Bill } from "@/lib/api/bills";
import { BillsDataTable } from "@/components/bills/BillsDataTable";

export const Route = createFileRoute("/_authenticated/bills/")({
  head: () => ({
    meta: [
      { title: "All Bills — BR Transport" },
    ],
  }),
  component: AllBillsPage,
});

function AllBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    try {
      setLoading(true);
      // Fetching a large amount to rely on client-side pagination
      const data = await billsApi.getBills(0, 1000);
      setBills(data.content || []);
    } catch (error) {
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this bill?")) {
      // Optimistic UI Update: immediately remove it from state so it feels instant
      setBills(prev => prev.filter(b => b.id !== id));
      
      try {
        await billsApi.deleteBill(id);
        toast.success("Bill deleted successfully");
      } catch (error) {
        toast.error("Failed to delete bill");
        // Revert on error
        fetchBills();
      }
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">All Bills</h2>
        <Button asChild>
          <Link to="/bills/new">Create New Bill</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <BillsDataTable 
            data={bills} 
            isLoading={loading} 
            onDelete={handleDelete} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
