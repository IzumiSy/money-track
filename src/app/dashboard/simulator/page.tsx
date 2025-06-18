"use client";

import FinancialAssetsChart from "@/components/FinancialAssetsChart";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";
import Link from "next/link";

export default function SimulatorPage() {
  const { financialAssets } = useFinancialAssets();

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          シミュレータ
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          資産状況をビジュアルで確認できます。データの入力は
          <Link
            href="/dashboard/financial-assets"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            金融資産
          </Link>
          ページで行ってください。
        </p>
      </div>

      {/* 資産状況チャート */}
      <FinancialAssetsChart assets={financialAssets} />
    </div>
  );
}
