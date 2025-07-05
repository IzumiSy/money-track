"use client";

import GroupedIncomeForm from "@/components/GroupedIncomeForm";
import { toast } from "sonner";

export default function IncomePage() {
  const handleIncomeSubmit = () => {
    toast.success("収入情報を保存しました");
  };

  return (
    <div className="space-y-6">
      <GroupedIncomeForm onSubmit={handleIncomeSubmit} />
    </div>
  );
}
