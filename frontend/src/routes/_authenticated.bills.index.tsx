import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Eye, Printer, Trash2 } from "lucide-react";
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
      // Fetching up to 100 recent bills for demo
      const data = await billsApi.getBills(0, 100);
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
      try {
        await billsApi.deleteBill(id);
        toast.success("Bill deleted successfully");
        fetchBills();
      } catch (error) {
        toast.error("Failed to delete bill");
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
          <div className="rounded-md border overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Net Weight</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading bills...
                    </TableCell>
                  </TableRow>
                ) : bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>{bill.date}</TableCell>
                      <TableCell>{bill.customer}</TableCell>
                      <TableCell>{bill.material}</TableCell>
                      <TableCell>{bill.vehicleNumber}</TableCell>
                      <TableCell>{bill.netWeight} MT</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => bill.id && handleDelete(bill.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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
