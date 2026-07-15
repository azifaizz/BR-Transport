import { createFileRoute } from "@tanstack/react-router";
import { BillForm } from "@/components/bills/BillForm";

export const Route = createFileRoute("/_authenticated/bills/new")({
  head: () => ({
    meta: [{ title: "New Bill — BR Transport" }],
  }),
  component: NewBillRoute,
});

function NewBillRoute() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create Bill</h2>
      </div>
      <div className="mx-auto w-full max-w-5xl">
        <BillForm />
      </div>
    </div>
  );
}
