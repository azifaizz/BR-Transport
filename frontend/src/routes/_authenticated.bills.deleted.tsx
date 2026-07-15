import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { billsApi, Bill } from "@/lib/api/bills";

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
      try {
        await billsApi.restoreBill(id);
        toast.success("Bill restored successfully");
        fetchDeletedBills();
      } catch (error) {
        toast.error("Failed to restore bill");
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Deleted Date</TableHead>
                  <TableHead>Deleted By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading deleted bills...
                    </TableCell>
                  </TableRow>
                ) : bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No deleted bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium text-muted-foreground">{bill.billNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{bill.date}</TableCell>
                      <TableCell className="text-muted-foreground">{bill.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{bill.material}</TableCell>
                      <TableCell className="text-muted-foreground text-destructive">
                        {bill.deletedAt ? format(new Date(bill.deletedAt), "dd/MM/yyyy HH:mm") : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {bill.deletedBy || "System"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => bill.id && handleRestore(bill.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
