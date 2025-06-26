"use client";

import IncomeForm from "@/components/IncomeForm";

export default function IncomePage() {
  const handleIncomeSubmit = () => {
    // 保存完了のフィードバックを提供
    // alert("収入情報が保存されました！シミュレータで確認できます。");
  };

  return (
    <div className="space-y-6">
      <IncomeForm onSubmit={handleIncomeSubmit} />
    </div>
  );
}
