"use client";

import { useState } from "react";
import FinancialAssetsForm, {
  FinancialAsset,
} from "@/components/FinancialAssetsForm";
import FinancialAssetsChart from "@/components/FinancialAssetsChart";

export default function FinancialAssetsPage() {
  const [financialAssets, setFinancialAssets] = useState<FinancialAsset>({
    deposits: 0,
    investments: 0,
  });

  const handleFinancialAssetsSubmit = (assets: FinancialAsset) => {
    setFinancialAssets(assets);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <FinancialAssetsForm
          onSubmit={handleFinancialAssetsSubmit}
          initialData={financialAssets}
        />
        <div className="xl:col-span-1">
          <FinancialAssetsChart assets={financialAssets} />
        </div>
      </div>
    </div>
  );
}
