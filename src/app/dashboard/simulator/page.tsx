"use client";

import FinancialAssetsChart from "@/components/FinancialAssetsChart";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";

export default function SimulatorPage() {
  const { financialAssets } = useFinancialAssets();

  return (
    <div className="space-y-8">
      {/* 資産状況チャート */}
      <FinancialAssetsChart assets={financialAssets} useGroupFiltering />
    </div>
  );
}
