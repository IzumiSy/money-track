"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { FinancialAsset } from "./FinancialAssetsForm";

interface FinancialAssetsChartProps {
  assets: FinancialAsset;
}

const COLORS = {
  deposits: "#3B82F6", // Blue
  investments: "#10B981", // Green
};

// シミュレーション用のパラメータ（後で設定可能にする予定）
const SIMULATION_PARAMS = {
  annualIncome: 5000000, // 年収500万円
  annualExpenses: 4000000, // 年間支出400万円
  investmentReturn: 0.05, // 投資リターン5%
  simulationYears: 30, // シミュレーション期間30年
};

export default function FinancialAssetsChart({
  assets,
}: FinancialAssetsChartProps) {
  const { deposits, investments } = assets;
  const total = deposits + investments;

  // 30年間のキャッシュフローシミュレーション計算
  const generateSimulationData = () => {
    const data = [];
    let currentDeposits = deposits;
    let currentInvestments = investments;

    const { annualIncome, annualExpenses, investmentReturn, simulationYears } =
      SIMULATION_PARAMS;

    // 年間の余剰資金（貯蓄可能額）
    const annualSavings = annualIncome - annualExpenses;

    for (let year = 0; year <= simulationYears; year++) {
      if (year === 0) {
        // 初年度は現在の資産
        data.push({
          year: `${year}年目`,
          deposits: Math.round(currentDeposits),
          investments: Math.round(currentInvestments),
          total: Math.round(currentDeposits + currentInvestments),
        });
      } else {
        // 投資リターンを適用
        currentInvestments *= 1 + investmentReturn;

        // 年間貯蓄の半分を預金、半分を投資に回すと仮定
        const savingsToDeposits = annualSavings * 0.3; // 30%を預金
        const savingsToInvestments = annualSavings * 0.7; // 70%を投資

        currentDeposits += savingsToDeposits;
        currentInvestments += savingsToInvestments;

        data.push({
          year: `${year}年目`,
          deposits: Math.round(currentDeposits),
          investments: Math.round(currentInvestments),
          total: Math.round(currentDeposits + currentInvestments),
        });
      }
    }

    return data;
  };

  // データが0の場合の処理
  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          キャッシュフローシミュレータ
        </h2>
        <div className="text-center py-12">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            資産情報を入力すると、30年間のキャッシュフローシミュレーションが表示されます
          </p>
        </div>
      </div>
    );
  }

  const simulationData = generateSimulationData();
  const finalYear = simulationData[simulationData.length - 1];

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("ja-JP").format(value);
  };

  const formatTooltip = (value: number, name: string) => {
    return [`${formatNumber(value)}円`, name];
  };

  return (
    <div className="space-y-6">
      {/* シミュレーション結果サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                現在の預金
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(deposits)}円
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                現在の投資
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(investments)}円
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                現在の合計
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(total)}円
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                30年後予想
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(finalYear.total)}円
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* シミュレーション設定表示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          シミュレーション設定
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-400">年収:</span>
            <span className="ml-1 text-blue-800 dark:text-blue-200">
              {formatNumber(SIMULATION_PARAMS.annualIncome)}円
            </span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">年間支出:</span>
            <span className="ml-1 text-blue-800 dark:text-blue-200">
              {formatNumber(SIMULATION_PARAMS.annualExpenses)}円
            </span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">
              投資リターン:
            </span>
            <span className="ml-1 text-blue-800 dark:text-blue-200">
              {(SIMULATION_PARAMS.investmentReturn * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">期間:</span>
            <span className="ml-1 text-blue-800 dark:text-blue-200">
              {SIMULATION_PARAMS.simulationYears}年
            </span>
          </div>
        </div>
      </div>

      {/* 30年間キャッシュフローシミュレーション */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          30年間資産推移シミュレーション
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                interval={4}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={(value) => `${formatNumber(value / 1000000)}M`}
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Bar
                dataKey="deposits"
                stackId="a"
                fill={COLORS.deposits}
                name="預金"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="investments"
                stackId="a"
                fill={COLORS.investments}
                name="投資"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
