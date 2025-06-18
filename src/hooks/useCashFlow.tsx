"use client";

import { useIncome } from "@/contexts/IncomeContext";
import { useExpenses } from "@/contexts/ExpensesContext";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";
import { YearMonthDuration } from "@/types/YearMonth";

export function useCashFlow() {
  const { incomes, getTotalMonthlyIncome } = useIncome();
  const { expenses, getTotalMonthlyExpenses } = useExpenses();
  const { financialAssets } = useFinancialAssets();

  // 指定された年月における有効な収入の合計額を計算
  const getActiveIncomeForMonth = (year: number, month: number) => {
    const targetYearMonth = YearMonthDuration.from(year, month);

    return incomes.reduce((sum, income) => {
      // 開始年月が設定されていない場合は常に有効
      if (!income.startYearMonth) {
        // 終了年月が設定されていない、または終了年月以降の場合は有効
        if (
          !income.endYearMonth ||
          targetYearMonth.isBeforeOrEqual(income.endYearMonth)
        ) {
          return sum + income.monthlyAmount;
        }
        return sum;
      }

      // 開始年月以降かチェック
      if (targetYearMonth.isAfterOrEqual(income.startYearMonth)) {
        // 終了年月が設定されていない、または終了年月以前の場合は有効
        if (
          !income.endYearMonth ||
          targetYearMonth.isBeforeOrEqual(income.endYearMonth)
        ) {
          return sum + income.monthlyAmount;
        }
      }

      return sum;
    }, 0);
  };

  // 指定された年月における有効な支出の合計額を計算
  const getActiveExpenseForMonth = (year: number, month: number) => {
    const targetYearMonth = YearMonthDuration.from(year, month);

    return expenses.reduce((sum, expense) => {
      // 開始年月が設定されていない場合は常に有効
      if (!expense.startYearMonth) {
        // 終了年月が設定されていない、または終了年月以降の場合は有効
        if (
          !expense.endYearMonth ||
          targetYearMonth.isBeforeOrEqual(expense.endYearMonth)
        ) {
          return sum + expense.monthlyAmount;
        }
        return sum;
      }

      // 開始年月以降かチェック
      if (targetYearMonth.isAfterOrEqual(expense.startYearMonth)) {
        // 終了年月が設定されていない、または終了年月以前の場合は有効
        if (
          !expense.endYearMonth ||
          targetYearMonth.isBeforeOrEqual(expense.endYearMonth)
        ) {
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
