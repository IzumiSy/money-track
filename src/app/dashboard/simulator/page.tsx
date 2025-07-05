"use client";

import FinancialAssetsChart from "@/components/FinancialAssetsChart";
import { useAssetManagement } from "@/hooks/useAssetManagement";

export default function SimulatorPage() {
  const { financialAssets } = useAssetManagement();

  return (
    <div className="space-y-8">
      {/* 資産状況チャート */}
      <FinancialAssetsChart assets={financialAssets} />
    </div>
  );
}
