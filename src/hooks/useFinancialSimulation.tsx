"use client";

import { useMemo } from "react";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { createCalculator } from "@/domains/shared/createCalculator";
import { CalculatorSource } from "@/domains/shared/CalculatorSource";
import { createSimulator } from "@/domains/simulation";
import { convertExpenseToExpenseSource } from "@/domains/expense/source";
import { convertIncomeToIncomeSource } from "@/domains/income/source";

interface UseFinancialSimulationProps {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomes?: Income[];
  simulationYears: number;
}

// チャート用のデータポイント型
interface SimulationDataPoint {
  year: string;
  deposits: number;
  total: number;
  [key: string]: string | number; // 動的なキー（investment_*, income_*, expense_*）
}

// チャート用の結果型
interface ChartSimulationResult {
  simulationData: SimulationDataPoint[];
  finalYearData: SimulationDataPoint;
  hasData: boolean;
  netMonthlyCashFlow: number;
  totalBaseAmount: number;
  initialTotal: number;
}

/**
 * 計算結果をチャート用のデータ形式に変換する関数
 */
function convertToChartData(
  simulationResult: ReturnType<ReturnType<typeof createSimulator>["simulate"]>,
  unifiedCalculator: ReturnType<typeof createCalculator<CalculatorSource>>
): ChartSimulationResult {
  const { yearlyData, currentMonthlyCashFlow, hasData } = simulationResult;

  // チャート用のデータ形式に変換
  const simulationData: SimulationDataPoint[] = yearlyData.map((yearData) => {
    const chartData: SimulationDataPoint = {
      year: `${yearData.year}年目`,
      deposits: yearData.deposits,
      total: yearData.deposits,
    };

    // unifiedCalculatorから全てのソースを取得
    const sources = unifiedCalculator.getSources();

    // 各支出項目を個別にマイナスのバーとして追加
    sources
      .filter((source) => source.type === "expense")
      .forEach((expenseSource) => {
        const expenseKey = `expense_${expenseSource.id}`;
        const yearlyExpenseAmount =
          yearData.expenseBreakdown.get(expenseSource.id) || 0;
        chartData[expenseKey] = -Math.round(yearlyExpenseAmount);
      });

    // 各収入項目を個別にPositiveバーとして追加
    sources
      .filter((source) => source.type === "income")
      .forEach((incomeSource) => {
        const incomeKey = `income_${incomeSource.id}`;
        const yearlyIncomeAmount =
          yearData.incomeBreakdown.get(incomeSource.id) || 0;
        chartData[incomeKey] = Math.round(yearlyIncomeAmount);
      });

    return chartData;
  });

  // 最終年のデータ
  const finalYearData = simulationData[simulationData.length - 1] || {
    year: "0年目",
    deposits: 0,
    total: 0,
  };

  return {
    simulationData,
    finalYearData,
    hasData,
    netMonthlyCashFlow: currentMonthlyCashFlow.net,
    totalBaseAmount: 0, // 投資は無視するため0
    initialTotal: yearlyData[0]?.deposits || 0,
  };
}

/**
 * 新しいIncomeCalculatorを使用したファイナンシャルシミュレーションフック
 * 既存のuseFinancialSimulationと同じインターフェースを維持
 */
export function useFinancialSimulation({
  assets,
  expenses = [],
  incomes = [],
  simulationYears,
}: UseFinancialSimulationProps) {
  return useMemo(() => {
    // 統合されたCalculatorインスタンスを作成
    const unifiedCalculator = createCalculator<CalculatorSource>();

    // Income[]をIncomeSourceに変換してCalculatorに追加
    incomes.forEach((income) => {
      unifiedCalculator.addSource(convertIncomeToIncomeSource(income));
    });

    // Expense[]をExpenseSourceに変換してCalculatorに追加
    expenses.forEach((expense) => {
      unifiedCalculator.addSource(convertExpenseToExpenseSource(expense));
    });

    // シミュレーターを作成
    const simulator = createSimulator(unifiedCalculator, {
      initialDeposits: assets.deposits,
      simulationYears,
    });

    // シミュレーションを実行
    const simulationResult = simulator.simulate();

    // チャート用のデータ形式に変換
    return convertToChartData(simulationResult, unifiedCalculator);
  }, [assets, expenses, incomes, simulationYears]);
}
