"use client";

import { useState, useEffect } from "react";

export interface FinancialAsset {
  deposits: number;
  investments: number;
}

interface FinancialAssetsFormProps {
  onSubmit: (assets: FinancialAsset) => void;
  initialData?: FinancialAsset;
}

export default function FinancialAssetsForm({
  onSubmit,
  initialData,
}: FinancialAssetsFormProps) {
  const [deposits, setDeposits] = useState(initialData?.deposits || 0);
  const [investments, setInvestments] = useState(initialData?.investments || 0);

  // initialDataが変更されたときにフォームの状態を更新
  useEffect(() => {
    if (initialData) {
      setDeposits(initialData.deposits);
      setInvestments(initialData.investments);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ deposits, investments });
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("ja-JP").format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        金融資産の入力
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 預金額 */}
        <div>
          <label
            htmlFor="deposits"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            預金額
          </label>
          <div className="relative">
            <input
              type="number"
              id="deposits"
              value={deposits || ""}
              onChange={(e) => setDeposits(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="0"
              min="0"
            />
            <span className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
              円
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            普通預金、定期預金などの合計額
          </p>
        </div>

        {/* 積立投資 */}
        <div>
          <label
            htmlFor="investments"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            積立投資
          </label>
          <div className="relative">
            <input
              type="number"
              id="investments"
              value={investments || ""}
              onChange={(e) => setInvestments(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="0"
              min="0"
            />
            <span className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
              円
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            投資信託、株式などの積立投資の現在価値
          </p>
        </div>

        {/* 合計表示 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
              合計資産額
            </span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(deposits + investments)}円
            </span>
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          資産情報を保存
        </button>
      </form>
    </div>
  );
}
