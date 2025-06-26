"use client";

import FinancialAssetsForm from "@/components/FinancialAssetsForm";

export default function FinancialAssetsPage() {
  const handleFinancialAssetsSubmit = () => {
    // 保存完了のフィードバックを提供
  };

  return <FinancialAssetsForm onSubmit={handleFinancialAssetsSubmit} />;
}
