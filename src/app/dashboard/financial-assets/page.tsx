"use client";

import FinancialAssetsForm, {
  FinancialAsset,
} from "@/components/FinancialAssetsForm";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";

export default function FinancialAssetsPage() {
  const { financialAssets, setFinancialAssets } = useFinancialAssets();

  const handleFinancialAssetsSubmit = (assets: FinancialAsset) => {
    setFinancialAssets(assets);
    // 保存完了のフィードバックを提供（オプション）
    alert("資産情報が保存されました！シミュレータで確認できます。");
  };

  return (
    <FinancialAssetsForm
      onSubmit={handleFinancialAssetsSubmit}
      initialData={financialAssets}
    />
  );
}
