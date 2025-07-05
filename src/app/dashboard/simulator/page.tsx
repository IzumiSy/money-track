"use client";

import GroupedFinancialAssetsChart from "@/components/GroupedFinancialAssetsChart";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";

export default function SimulatorPage() {
  const { financialAssets } = useFinancialAssets();

  return (
    <div className="space-y-8">
      {/* 資産状況チャート */}
      <GroupedFinancialAssetsChart assets={financialAssets} />
    </div>
  );
}
