import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Clock, Printer, Save, RefreshCcw, Download } from "lucide-react";
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
import { downloadBillAsPdf } from "@/lib/pdf-generator";

function TimeSelect({ value, onValueChange, className }: { value: string, onValueChange: (v: string) => void, className?: string }) {
  const [hour, minute] = value ? value.split(":") : ["", ""];
  
  const handleHourChange = (h: string) => {
    onValueChange(`${h}:${minute || "00"}`);
  }
  
  const handleMinuteChange = (m: string) => {
    onValueChange(`${hour || "12"}:${m}`);
  }
  
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select value={hour || undefined} onValueChange={handleHourChange}>
        <SelectTrigger className="flex-1 px-2 text-center">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
        </SelectContent>
      </Select>
      <span className="font-bold">:</span>
      <Select value={minute || undefined} onValueChange={handleMinuteChange}>
        <SelectTrigger className="flex-1 px-2 text-center">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function AutocompleteInput({ value, onValueChange, placeholder, options }: { value: string, onValueChange: (v: string) => void, placeholder: string, options: string[] }) {
  const [open, setOpen] = React.useState(false);
  const [filteredOptions, setFilteredOptions] = React.useState(options);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onValueChange(val);
    setFilteredOptions(options.filter(opt => opt.toLowerCase().includes(val.toLowerCase())));
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          setFilteredOptions(options.filter(opt => opt.toLowerCase().includes(value.toLowerCase())));
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
      />
      {open && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-[200px] overflow-auto py-1">
          {filteredOptions.map((opt) => (
            <div
              key={opt}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(e) => {
                e.preventDefault();
                onValueChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])$/;

const formSchema = z.object({
  material: z.string().min(1, "Material is required"),
  party: z.string().min(1, "Party is required"),
  date: z.string().min(1, "Date is required"),
  inTime: z.string().regex(timeRegex, "Invalid time"),
  inTimeAmPm: z.string().min(1, "Required"),
  outTime: z.string().regex(timeRegex, "Invalid time"),
  outTimeAmPm: z.string().min(1, "Required"),
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
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  
  const firstInputRef = useRef<HTMLButtonElement>(null);

  const defaultValues = {
    material: "",
    party: "",
    date: format(new Date(), "dd/MM/yyyy"),
    inTime: "",
    inTimeAmPm: "AM" as any,
    outTime: "",
    outTimeAmPm: "PM" as any,
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
    defaultValues: defaultValues as any,
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
    fetchNextNumber();
  }, [createdBill]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const apiValues: any = { ...values };
      apiValues.inTime = `${values.inTime} ${values.inTimeAmPm}`.trim();
      apiValues.outTime = `${values.outTime} ${values.outTimeAmPm}`.trim();
      delete apiValues.inTimeAmPm;
      delete apiValues.outTimeAmPm;

      if (apiValues.emptyWeight === "" || isNaN(apiValues.emptyWeight)) apiValues.emptyWeight = 0;
      if (apiValues.loadWeight === "" || isNaN(apiValues.loadWeight)) apiValues.loadWeight = 0;
      if (apiValues.netWeight === "" || isNaN(apiValues.netWeight)) apiValues.netWeight = 0;

      const result = await billsApi.createBill(apiValues as Bill);
      toast.success("Bill saved successfully!");
      setCreatedBill(result);
    } catch (error: any) {
      console.error("Failed to save bill:", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to save bill. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Form validation failed:", errors);
    const firstKey = Object.keys(errors)[0];
    const firstMsg = errors[firstKey]?.message || "Please check all required fields";
    toast.error(`Please fix field "${firstKey}": ${firstMsg}`);
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
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col pt-2.5">
                          <FormLabel>Date</FormLabel>
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                                onSelect={(date) => {
                                  field.onChange(date ? format(date, "dd/MM/yyyy") : "");
                                  if (date) setCalendarOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>In Time</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <TimeSelect value={field.value} onValueChange={field.onChange} className="flex-1" />
                            </FormControl>
                            <FormField
                              control={form.control}
                              name="inTimeAmPm"
                              render={({ field: ampmField }) => (
                                <Select onValueChange={ampmField.onChange} value={ampmField.value || undefined}>
                                  <FormControl>
                                    <SelectTrigger className="w-[85px]">
                                      <SelectValue placeholder="AM" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="PM">PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
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
                          <div className="flex gap-2">
                            <FormControl>
                              <TimeSelect value={field.value} onValueChange={field.onChange} className="flex-1" />
                            </FormControl>
                            <FormField
                              control={form.control}
                              name="outTimeAmPm"
                              render={({ field: ampmField }) => (
                                <Select onValueChange={ampmField.onChange} value={ampmField.value || undefined}>
                                  <FormControl>
                                    <SelectTrigger className="w-[85px]">
                                      <SelectValue placeholder="PM" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="PM">PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
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
                          <AutocompleteInput 
                            value={field.value} 
                            onValueChange={field.onChange} 
                            placeholder="Select or Enter Material" 
                            options={["M-Sand", "20 MM", "24 MM", "6 MM", "Jalli", "P-Sand", "Gravel", "WMM"]} 
                          />
                        </FormControl>
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting || !!createdBill} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Bill
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    {createdBill ? `Start Next Bill (${nextBillNumber || Number(createdBill.billNumber) + 1})` : "Reset"}
                  </Button>
                  <Button type="button" variant="secondary" disabled={!createdBill} onClick={handlePrint} className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Challan
                  </Button>
                  <Button 
                    type="button" 
                    variant="default" 
                    disabled={!createdBill} 
                    onClick={() => createdBill && downloadBillAsPdf(createdBill)} 
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
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
              <ThermalReceipt bill={createdBill || {
                ...form.watch(),
                inTime: form.watch("inTime") ? `${form.watch("inTime")} ${form.watch("inTimeAmPm") || ""}`.trim() : "",
                outTime: form.watch("outTime") ? `${form.watch("outTime")} ${form.watch("outTimeAmPm") || ""}`.trim() : "",
              } as any} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
