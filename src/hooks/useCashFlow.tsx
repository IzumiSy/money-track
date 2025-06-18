"use client";

import { useIncome } from "@/contexts/IncomeContext";
import { useExpenses } from "@/contexts/ExpensesContext";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";

export function useCashFlow() {
  const { incomes, getTotalMonthlyIncome } = useIncome();
  const { expenses, getTotalMonthlyExpenses } = useExpenses();
  const { financialAssets } = useFinancialAssets();

  // 指定された年月における有効な収入の合計額を計算
  const getActiveIncomeForMonth = (year: number, month: number) => {
    return incomes.reduce((sum, income) => {
      // 開始年月が設定されていない場合は常に有効
      if (!income.startYear || !income.startMonth) {
        return sum + income.monthlyAmount;
      }

      // 開始年月をチェック
      const startYearMonth = income.startYear * 12 + income.startMonth - 1;
      const targetYearMonth = year * 12 + month - 1;

      if (targetYearMonth >= startYearMonth) {
        // 終了年月が設定されていない、または終了年月以前の場合は有効
        if (!income.endYear || !income.endMonth) {
          return sum + income.monthlyAmount;
        }

        const endYearMonth = income.endYear * 12 + income.endMonth - 1;
        if (targetYearMonth <= endYearMonth) {
          return sum + income.monthlyAmount;
        }
      }

      return sum;
    }, 0);
  };

  // 指定された年月における有効な支出の合計額を計算
  const getActiveExpenseForMonth = (year: number, month: number) => {
    return expenses.reduce((sum, expense) => {
      // 開始年月が設定されていない場合は常に有効
      if (!expense.startYear || !expense.startMonth) {
        return sum + expense.monthlyAmount;
      }

      // 開始年月をチェック
      const startYearMonth = expense.startYear * 12 + expense.startMonth - 1;
      const targetYearMonth = year * 12 + month - 1;

      if (targetYearMonth >= startYearMonth) {
        // 終了年月が設定されていない、または終了年月以前の場合は有効
        if (!expense.endYear || !expense.endMonth) {
          return sum + expense.monthlyAmount;
        }

        const endYearMonth = expense.endYear * 12 + expense.endMonth - 1;
        if (targetYearMonth <= endYearMonth) {
          return sum + expense.monthlyAmount;
        }
      }

      return sum;
    }, 0);
  };

  // 月次純キャッシュフロー（収入 - 支出）を計算
  const getNetMonthlyCashFlow = (year?: number, month?: number) => {
    if (year && month) {
      return (
        getActiveIncomeForMonth(year, month) -
        getActiveExpenseForMonth(year, month)
      );
    }
    // デフォルトは現在の年月
    const currentDate = new Date();
    return (
      getActiveIncomeForMonth(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      ) -
      getActiveExpenseForMonth(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      )
    );
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
