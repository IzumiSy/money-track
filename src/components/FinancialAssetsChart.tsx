"use client";

import { useState } from "react";
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
import { Expense } from "@/contexts/ExpensesContext";

interface FinancialAssetsChartProps {
  assets: FinancialAsset;
  expenses?: Expense[];
}

const COLORS = {
  deposits: "#3B82F6", // Blue
};

export default function FinancialAssetsChart({
  assets,
  expenses = [],
}: FinancialAssetsChartProps) {
  const { deposits, investments } = assets;
  const [simulationYears, setSimulationYears] = useState(30);

  // 月額積立の合計額を計算
  const totalMonthlyInvestments = investments.reduce(
    (sum, inv) => sum + inv.monthlyAmount,
    0
  );

  // 月額支出の合計額を計算
  const totalMonthlyExpenses = expenses.reduce(
    (sum, exp) => sum + exp.monthlyAmount,
    0
  );

  const total = deposits; // 初期値は預金のみ

  // 資産推移シミュレーション計算（投資ごとに個別計算、支出を考慮）
  const generateSimulationData = () => {
    const data = [];
    let currentDeposits = deposits;

    for (let year = 0; year <= simulationYears; year++) {
      // 支出による預金の減少を計算（年間支出額）
      const yearlyExpenses = totalMonthlyExpenses * 12 * year;
      const depositsAfterExpenses = Math.max(
        0,
        currentDeposits - yearlyExpenses
      );

      const yearData: any = {
        year: `${year}年目`,
        deposits: Math.round(depositsAfterExpenses),
      };

      let totalInvestmentValue = 0;

      // 各投資の将来価値を個別に計算
      investments.forEach((inv, index) => {
        if (inv.monthlyAmount > 0) {
          // 月額積立の将来価値計算（年複利を月複利に変換）
          const monthlyRate = inv.returnRate / 12;
          const months = year * 12;

          let futureValue = 0;
          if (monthlyRate > 0) {
            // 複利計算式: PMT * (((1 + r)^n - 1) / r)
            futureValue =
              (inv.monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1)) /
              monthlyRate;
          } else {
            // リターン率が0の場合は単純な積立額の合計
            futureValue = inv.monthlyAmount * months;
          }

          const investmentKey = `investment_${inv.id}`;
          yearData[investmentKey] = Math.round(futureValue);
          totalInvestmentValue += futureValue;
        }
      });

      // 年間支出額をマイナスのバーとして追加（0年目以降）
      if (totalMonthlyExpenses > 0) {
        yearData.expenses = -Math.round(totalMonthlyExpenses * 12);
      }

      yearData.total = Math.round(depositsAfterExpenses + totalInvestmentValue);
      data.push(yearData);
    }

    return data;
  };

  // データが0の場合の処理
  if (total === 0 && totalMonthlyInvestments === 0) {
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
                月額積立合計
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(totalMonthlyInvestments)}円/月
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                月額支出合計
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(totalMonthlyExpenses)}円/月
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
                {simulationYears}年後予想
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(finalYear.total)}円
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 資産推移シミュレーション */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            資産推移シミュレーション
          </h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              期間:
            </label>
            <select
              value={simulationYears}
              onChange={(e) => setSimulationYears(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value={10}>10年</option>
              <option value={30}>30年</option>
              <option value={50}>50年</option>
            </select>
          </div>
        </div>
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
              {investments.map((investment, index) => (
                <Bar
                  key={investment.id}
                  dataKey={`investment_${investment.id}`}
                  stackId="a"
                  fill={investment.color}
                  name={investment.name || `投資 #${index + 1}`}
                  radius={
                    index === investments.length - 1
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0]
                  }
                />
              ))}
              {totalMonthlyExpenses > 0 && (
                <Bar dataKey="expenses" fill="#EF4444" name="年間支出" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
