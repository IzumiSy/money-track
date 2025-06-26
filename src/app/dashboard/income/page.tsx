"use client";

import IncomeForm from "@/components/IncomeForm";

export default function IncomePage() {
  const handleIncomeSubmit = () => {
    // 保存完了のフィードバックを提供
  };

  return (
    <div className="space-y-6">
      <IncomeForm onSubmit={handleIncomeSubmit} />
    </div>
  );
}
