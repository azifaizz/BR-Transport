import React from "react";
import { Bill } from "@/lib/api/bills";

interface ThermalReceiptProps {
  bill: Bill;
}

export const ThermalReceipt = React.memo(function ThermalReceipt({ bill }: ThermalReceiptProps) {
  if (!bill) return null;

  return (
    <div className="w-[80mm] min-h-[100mm] bg-white text-black p-4 font-mono text-sm print:w-full print:p-0 mx-auto">
      <div className="text-center mb-4">
        <img src="/BR.png" alt="BR Transport Logo" className="h-12 w-auto mx-auto mb-1 object-contain" />
        <h2 className="text-lg font-bold mb-1 uppercase">Delivery challan</h2>
        {bill.billNumber && (
          <div className="text-sm font-bold mb-2">
            BILL NO : #{bill.billNumber}
          </div>
        )}
        <div className="flex justify-between text-xs font-semibold">
          <span>Date : {bill.date}</span>
          <span>IN : {bill.inTime}</span>
        </div>
      </div>
      
      <hr className="border-t-2 border-black border-dashed my-2" />
      
      <div className="space-y-2 py-2">
        <div className="flex justify-between">
          <span className="w-24">Material</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.material}</span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Party</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.party}</span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Date</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Out Time</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.outTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Customer</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.customer}</span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Vehicle</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.vehicleNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Empty</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">
            {String(bill.emptyWeight) !== "" && bill.emptyWeight !== undefined && !isNaN(Number(bill.emptyWeight)) ? `${Number(bill.emptyWeight).toFixed(2)} MT` : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Load</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">
            {String(bill.loadWeight) !== "" && bill.loadWeight !== undefined && !isNaN(Number(bill.loadWeight)) ? `${Number(bill.loadWeight).toFixed(2)} MT` : ""}
          </span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="w-24 font-bold">Net weight</span>
          <span className="px-2 font-bold">:</span>
          <span className="flex-1 text-right font-bold text-base">
            {String(bill.netWeight) !== "" && bill.netWeight !== undefined && !isNaN(Number(bill.netWeight)) ? `${Number(bill.netWeight).toFixed(2)} MT` : ""}
          </span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="w-24">Payment</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.paymentType}</span>
        </div>
        <div className="flex justify-between">
          <span className="w-24">Delivery</span>
          <span className="px-2">:</span>
          <span className="flex-1 text-right font-semibold">{bill.deliveryType}</span>
        </div>
      </div>

      <hr className="border-t-2 border-black border-dashed my-2" />
      
      <div className="text-center mt-4">
        <p className="text-sm font-semibold">{bill.remarks !== undefined ? bill.remarks : "Thank you for your business"}</p>
      </div>
      
      {/* Hidden print styles injected here to ensure clean thermal printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: 80mm 200mm; 
            margin: 0; 
          }
        }
      `}} />
    </div>
  );
});
