import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { billsApi, Bill } from "@/lib/api/bills";
import { BillsDataTable } from "@/components/bills/BillsDataTable";

export const Route = createFileRoute("/_authenticated/bills/deleted")({
  head: () => ({
    meta: [
      { title: "Deleted Bills — BR Transport" },
    ],
  }),
  component: DeletedBillsPage,
});

function DeletedBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeletedBills = async () => {
    try {
      setLoading(true);
      const data = await billsApi.getDeletedBills();
      setBills(data.content || []);
    } catch (error) {
      toast.error("Failed to fetch deleted bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedBills();
  }, []);

  const handleRestore = async (id: string) => {
    if (confirm("Are you sure you want to restore this bill?")) {
      // Optimistic UI Update: immediately remove it from state so it feels instant
      setBills(prev => prev.filter(b => b.id !== id));
      
      try {
        await billsApi.restoreBill(id);
        toast.success("Bill restored successfully");
      } catch (error) {
        toast.error("Failed to restore bill");
        // Revert on error
        fetchDeletedBills();
      }
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Deleted Bills</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soft Deleted Records</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Note: Deleted bills are only visible for 15 days. They are permanently removed afterward.
          </p>
        </CardHeader>
        <CardContent>
          <BillsDataTable 
            data={bills} 
            isDeletedView 
            isLoading={loading} 
            onRestore={handleRestore} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
