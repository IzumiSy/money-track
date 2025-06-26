"use client";

import ExpensesForm from "@/components/ExpensesForm";
import { toast } from "sonner";

export default function ExpensesPage() {
  const handleExpensesSubmit = () => {
    toast.success("支出が保存されました");
  };

  return (
    <div className="space-y-8">
      <ExpensesForm onSubmit={handleExpensesSubmit} />
    </div>
  );
}
