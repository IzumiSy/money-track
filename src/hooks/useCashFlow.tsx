"use client";

import { useIncome } from "@/contexts/IncomeContext";
import { useExpenses } from "@/contexts/ExpensesContext";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";

export function useCashFlow() {
  const { incomes, getTotalMonthlyIncome } = useIncome();
  const { expenses, getTotalMonthlyExpenses } = useExpenses();
  const { financialAssets } = useFinancialAssets();

  // 月次純キャッシュフロー（収入 - 支出）を計算
  const getNetMonthlyCashFlow = () => {
    return getTotalMonthlyIncome() - getTotalMonthlyExpenses();
  };

  // 調整済み預金額（基本預金額 + 純キャッシュフロー効果）を計算
  // 将来的にはシミュレーション期間を考慮して計算できる
  const getAdjustedDeposits = (months: number = 1) => {
    const netCashFlow = getNetMonthlyCashFlow();
    const totalCashFlowEffect = netCashFlow * months;
    return (
      financialAssets.deposits +
      (totalCashFlowEffect > 0 ? totalCashFlowEffect : 0)
    );
  };

  // キャッシュフローサマリーを取得
  const getCashFlowSummary = () => {
    const totalIncome = getTotalMonthlyIncome();
    const totalExpenses = getTotalMonthlyExpenses();
    const netCashFlow = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      incomes,
      expenses,
      baseDeposits: financialAssets.deposits,
      adjustedDeposits: getAdjustedDeposits(),
    };
  };

  return {
    getNetMonthlyCashFlow,
    getAdjustedDeposits,
    getCashFlowSummary,
  };
}
