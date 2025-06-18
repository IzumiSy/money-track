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
import { Income } from "@/contexts/IncomeContext";
import { useFinancialSimulation } from "@/hooks/useFinancialSimulation";

interface FinancialAssetsChartProps {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomes?: Income[];
}

const COLORS = {
  deposits: "#3B82F6", // Blue
  income: "#10B981", // Green
};

export default function FinancialAssetsChart({
  assets,
  expenses = [],
  incomes = [],
}: FinancialAssetsChartProps) {
  const { investments } = assets;
  const [simulationYears, setSimulationYears] = useState(30);

  // シミュレーション計算ロジックをhookに委譲
  const { simulationData, hasData } = useFinancialSimulation({
    assets,
    expenses,
    incomes,
    simulationYears,
  });

  // データが0の場合の処理
  if (!hasData) {
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("ja-JP").format(value);
  };

  const formatTooltip = (value: number, name: string) => {
    return [`${formatNumber(value)}円`, name];
  };

  return (
    <div className="space-y-6">
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
              <option value={15}>15年</option>
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
                name="資産"
              />
              {investments.map((investment, index) => (
                <Bar
                  key={investment.id}
                  dataKey={`investment_${investment.id}`}
                  stackId="a"
                  fill={investment.color}
                  name={investment.name || `投資 #${index + 1}`}
                />
              ))}
              {incomes.map((income) => (
                <Bar
                  key={income.id}
                  dataKey={`income_${income.id}`}
                  stackId="b"
                  fill={income.color}
                  name={income.name}
                />
              ))}
              {investments.map((investment) => {
                const hasSellbackOptions =
                  investment.sellbackOptions &&
                  investment.sellbackOptions.length > 0;
                if (!hasSellbackOptions) return null;

                return (
                  <Bar
                    key={`sellback_income_${investment.id}`}
                    dataKey={`sellback_income_${investment.id}`}
                    stackId="b"
                    fill={investment.color}
                    name={`${
                      investment.name ||
                      `投資 #${investments.indexOf(investment) + 1}`
                    } 売却益`}
                    opacity={0.8}
                  />
                );
              })}
              {expenses.map((expense) => (
                <Bar
                  key={expense.id}
                  dataKey={`expense_${expense.id}`}
                  stackId="c"
                  fill={expense.color}
                  name={expense.name}
                />
              ))}
              {investments.map((investment) => {
                const hasInvestmentOptions =
                  investment.investmentOptions &&
                  investment.investmentOptions.length > 0;
                if (!hasInvestmentOptions) return null;

                return (
                  <Bar
                    key={`investment_expense_${investment.id}`}
                    dataKey={`investment_expense_${investment.id}`}
                    stackId="c"
                    fill={investment.color}
                    name={`${
                      investment.name ||
                      `投資 #${investments.indexOf(investment) + 1}`
                    } 積立`}
                    opacity={0.7}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
