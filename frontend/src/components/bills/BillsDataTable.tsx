import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Printer, Search, Trash2, RotateCcw, Download, FilterX } from "lucide-react";
import { downloadBillAsPdf } from "@/lib/pdf-generator";

import { cn } from "@/lib/utils";

import { Bill } from "@/lib/api/bills";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThermalReceipt } from "./ThermalReceipt";

interface BillsDataTableProps {
  data: Bill[];
  isDeletedView?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  isLoading?: boolean;
}

export function BillsDataTable({
  data,
  isDeletedView = false,
  onDelete,
  onRestore,
  isLoading = false,
}: BillsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [viewBill, setViewBill] = useState<Bill | null>(null);

  const columns = useMemo<ColumnDef<Bill>[]>(() => {
    const baseColumns: ColumnDef<Bill>[] = [
      {
        accessorKey: "billNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bill No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("billNumber")}</div>,
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "customer",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "material",
        meta: { className: "hidden md:table-cell" },
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Material
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "vehicleNumber",
        meta: { className: "hidden md:table-cell" },
        header: "Vehicle No",
      },
      {
        accessorKey: "paymentType",
        meta: { className: "hidden md:table-cell" },
        header: "Payment",
      },
    ];

    if (isDeletedView) {
      baseColumns.push(
        {
          accessorKey: "deletedDate",
          meta: { className: "hidden md:table-cell" },
          header: "Deleted Date",
          cell: ({ row }) => {
            const bill = row.original;
            return bill.deletedAt ? format(new Date(bill.deletedAt), "dd/MM/yyyy HH:mm") : "-";
          }
        },
        {
          accessorKey: "deletedBy",
          meta: { className: "hidden md:table-cell" },
          header: "Deleted By",
        }
      );
    } else {
      baseColumns.push(
        {
          accessorKey: "netWeight",
          meta: { className: "hidden md:table-cell" },
          header: "Net Weight",
        }
      );
    }

    // Actions Column
    baseColumns.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const bill = row.original;
        return (
          <div className="flex justify-end gap-2">
            {!isDeletedView && (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  title="Print/View"
                  onClick={() => setViewBill(bill)}
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  title="Download PDF"
                  onClick={() => downloadBillAsPdf(bill)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            {isDeletedView ? (
              <Button
                variant="default"
                size="icon"
                title="Restore"
                onClick={() => onRestore?.(bill.id!)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="icon"
                title="Delete"
                onClick={() => onDelete?.(bill.id!)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    });

    return baseColumns;
  }, [isDeletedView, onDelete, onRestore]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    // Customize global filter to search across multiple fields
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const searchFields = [
        row.original.billNumber?.toString() || "",
        row.original.customer || "",
        row.original.vehicleNumber || "",
        row.original.party || "",
        row.original.material || "",
        row.original.date || "",
      ];
      return searchFields.some(field => field.toLowerCase().includes(searchValue));
    },
  });

  // Extract unique values for filters
  const uniqueMaterials = useMemo(() => Array.from(new Set(data.map(d => d.material).filter(Boolean))), [data]);
  const uniquePaymentTypes = useMemo(() => Array.from(new Set(data.map(d => d.paymentType).filter(Boolean))), [data]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex w-full md:w-auto items-center space-x-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Material Filter */}
          <Select
            value={(table.getColumn("material")?.getFilterValue() as string) ?? ""}
            onValueChange={(val) => {
              table.getColumn("material")?.setFilterValue(val === "all" ? "" : val);
            }}
          >
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="All Materials" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {uniqueMaterials.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Type Filter */}
          <Select
            value={(table.getColumn("paymentType")?.getFilterValue() as string) ?? ""}
            onValueChange={(val) => {
              table.getColumn("paymentType")?.setFilterValue(val === "all" ? "" : val);
            }}
          >
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {uniquePaymentTypes.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => {
              table.resetColumnFilters();
              setGlobalFilter("");
            }}
            className="flex items-center gap-2"
          >
            <FilterX className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Table View */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={cn("whitespace-nowrap", (header.column.columnDef.meta as any)?.className)}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading bills...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn("whitespace-nowrap", (cell.column.columnDef.meta as any)?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 pt-2 pb-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing{" "}
          <strong>
            {table.getFilteredRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong>
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </strong>{" "}
          of <strong>{table.getFilteredRowModel().rows.length}</strong> Bills
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Bill View/Print Modal */}
      <Dialog open={!!viewBill} onOpenChange={(open) => !open && setViewBill(null)}>
        <DialogContent className="max-w-md print:max-w-none print:border-0 print:shadow-none print:p-0">
          <DialogHeader className="print:hidden">
            <DialogTitle>Challan Preview - #{viewBill?.billNumber}</DialogTitle>
            <DialogDescription>
              Print or download the thermal challan for {viewBill?.party}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center my-4 print:my-0">
            {viewBill && <ThermalReceipt bill={viewBill} />}
          </div>

          <div className="flex justify-end gap-2 print:hidden pt-2 border-t">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="default" onClick={() => viewBill && downloadBillAsPdf(viewBill)}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
