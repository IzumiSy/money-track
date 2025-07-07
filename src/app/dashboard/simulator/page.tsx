"use client";

import FinancialAssetsChart from "@/components/FinancialAssetsChart";
import { useAssetManagement } from "@/hooks/useAssetManagement";

export default function SimulatorPage() {
  const { assets } = useAssetManagement();

  return (
    <div className="space-y-6">
      {/* 資産状況チャート */}
      <FinancialAssetsChart assets={assets} />
    </div>
  );
}
