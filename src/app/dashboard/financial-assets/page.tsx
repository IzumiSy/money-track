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
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          金融資産
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          金融資産の情報を入力してください。資産状況の確認は
          <a
            href="/dashboard/simulator"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            シミュレータ
          </a>
          をご利用ください。
        </p>
      </div>

      <FinancialAssetsForm
        onSubmit={handleFinancialAssetsSubmit}
        initialData={financialAssets}
      />
    </div>
  );
}
