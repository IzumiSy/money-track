"use client";

import FinancialAssetsChart from "@/components/FinancialAssetsChart";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";
import { useExpenses } from "@/contexts/ExpensesContext";

export default function SimulatorPage() {
  const { financialAssets } = useFinancialAssets();
  const { expenses } = useExpenses();

  return (
    <div className="space-y-8">
      {/* 資産状況チャート */}
      <FinancialAssetsChart assets={financialAssets} expenses={expenses} />
    </div>
  );
}
