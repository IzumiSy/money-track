"use client";

import ExpensesForm from "@/components/ExpensesForm";

export default function ExpensesPage() {
  const handleExpensesSubmit = () => {
    // 保存完了のフィードバックを提供
  };

  return (
    <div className="space-y-8">
      <ExpensesForm onSubmit={handleExpensesSubmit} />
    </div>
  );
}
