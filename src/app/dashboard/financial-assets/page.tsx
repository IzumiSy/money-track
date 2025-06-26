"use client";

import FinancialAssetsForm from "@/components/FinancialAssetsForm";

export default function FinancialAssetsPage() {
  const handleFinancialAssetsSubmit = () => {
    // 保存完了のフィードバックを提供
    alert("資産情報が保存されました！シミュレータで確認できます。");
  };

  return <FinancialAssetsForm onSubmit={handleFinancialAssetsSubmit} />;
}
