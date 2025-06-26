"use client";

import ExpensesForm from "@/components/ExpensesForm";

export default function ExpensesPage() {
  const handleExpensesSubmit = () => {
    // 保存完了のフィードバックを提供
    // alert("支出情報が保存されました！シミュレータで確認できます。");
  };

  return (
    <div className="space-y-8">
      <ExpensesForm onSubmit={handleExpensesSubmit} />
    </div>
  );
}
