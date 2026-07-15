import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Save, Printer, RefreshCcw } from "lucide-react";
import { format, parse } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { billsApi, Bill } from "@/lib/api/bills";
import { toast } from "sonner";
import { ThermalReceipt } from "./ThermalReceipt";

const formSchema = z.object({
  material: z.string().min(1, "Material is required"),
  party: z.string().min(1, "Party is required"),
  date: z.string().min(1, "Date is required"),
  inTime: z.string().min(1, "In Time is required"),
  outTime: z.string().min(1, "Out Time is required"),
  customer: z.string().min(1, "Customer is required"),
  vehicleNumber: z.string().min(1, "Vehicle is required"),
  emptyWeight: z.coerce.number({ invalid_type_error: "Required" }).min(0, "Invalid weight"),
  loadWeight: z.coerce.number({ invalid_type_error: "Required" }).min(0, "Invalid weight"),
  netWeight: z.coerce.number().min(0, "Invalid weight"),
  paymentType: z.string().min(1, "Payment is required"),
  deliveryType: z.string().min(1, "Delivery is required"),
  remarks: z.string().optional(),
});

export function BillForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [createdBill, setCreatedBill] = React.useState<Bill | null>(null);
  const [nextBillNumber, setNextBillNumber] = React.useState<number | null>(null);
  
  const firstInputRef = useRef<HTMLButtonElement>(null);

  const defaultValues = {
    material: "",
    party: "",
    date: "",
    inTime: "",
    outTime: "",
    customer: "",
    vehicleNumber: "",
    emptyWeight: "" as unknown as number,
    loadWeight: "" as unknown as number,
    netWeight: "" as unknown as number,
    paymentType: "",
    deliveryType: "",
    remarks: "Thank you for your business",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const emptyWeight = form.watch("emptyWeight");
  const loadWeight = form.watch("loadWeight");

  useEffect(() => {
    // Only calculate if both values are valid numbers and not empty strings
    if (loadWeight && emptyWeight && !isNaN(loadWeight) && !isNaN(emptyWeight)) {
      const net = (Number(loadWeight) - Number(emptyWeight)).toFixed(2);
      form.setValue("netWeight", parseFloat(net));
    } else {
      form.setValue("netWeight", "" as unknown as number);
    }
  }, [emptyWeight, loadWeight, form]);

  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const data = await billsApi.getNextBillNumber();
        setNextBillNumber(data.nextBillNumber);
      } catch (error) {
        console.error("Failed to fetch next bill number", error);
      }
    };
    if (!createdBill) {
      fetchNextNumber();
    }
  }, [createdBill]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await billsApi.createBill(values);
      toast.success("Bill saved successfully!");
      setCreatedBill(result);
    } catch (error) {
      toast.error("Failed to save bill. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    form.reset(defaultValues);
    setCreatedBill(null);
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      <div className="lg:col-span-2 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Bill Generation</CardTitle>
            <CardDescription>Enter transport details to generate a delivery challan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="mb-6 space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Bill Number (Auto Generated)
                  </label>
                  <Input
                    readOnly
                    className="bg-muted font-bold text-lg"
                    value={createdBill ? createdBill.billNumber : (nextBillNumber || "Auto Generated")}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date & Time */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col pt-2.5">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                ref={firstInputRef}
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  field.value
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? parse(field.value, "dd/MM/yyyy", new Date()) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, "dd/MM/yyyy") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="inTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>In Time</FormLabel>
                          <FormControl><Input placeholder="11.50 PM" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="outTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Out Time</FormLabel>
                          <FormControl><Input placeholder="12.37 AM" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Core Details */}
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Input list="materials-list" placeholder="Select or Enter Material" {...field} />
                        </FormControl>
                        <datalist id="materials-list">
                          <option value="M-Sand" />
                          <option value="20 MM" />
                          <option value="24 MM" />
                          <option value="6 MM" />
                          <option value="Jalli" />
                          <option value="P-Sand" />
                          <option value="Gravel" />
                          <option value="WMM" />
                        </datalist>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="party"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party</FormLabel>
                        <FormControl><Input placeholder="Enter party name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl><Input placeholder="Enter customer" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Number</FormLabel>
                        <FormControl><Input placeholder="Enter vehicle number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Weights */}
                  <FormField
                    control={form.control}
                    name="emptyWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empty Weight (MT)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" value={field.value ?? ""} onChange={field.onChange} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="loadWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Load Weight (MT)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" value={field.value ?? ""} onChange={field.onChange} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="netWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Weight (MT)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" value={field.value ?? ""} onChange={field.onChange} /></FormControl>
                        <FormDescription>Automatically calculated. You can edit this value if required.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment & Delivery */}
                  <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CASH PARTY">CASH PARTY</SelectItem>
                            <SelectItem value="CREDIT">CREDIT</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select delivery" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PARTY SIDE">PARTY SIDE</SelectItem>
                            <SelectItem value="COMPANY SIDE">COMPANY SIDE</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Remarks / Footer Message</FormLabel>
                        <FormControl><Input placeholder="Thank you for your business" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting || !!createdBill} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Bill
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button type="button" variant="secondary" disabled={!createdBill} onClick={handlePrint} className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Challan
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 print:block">
        <div className="sticky top-6">
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:hidden">
              <CardTitle>Print Preview</CardTitle>
              <CardDescription>This is how the thermal receipt will look.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center print:p-0">
              <ThermalReceipt bill={createdBill || (form.watch() as any)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
