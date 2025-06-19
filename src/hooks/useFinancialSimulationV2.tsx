"use client";

import { useMemo } from "react";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { createIncomeCalculator } from "@/domains/income/IncomeCalculator";
import { createExpenseCalculator } from "@/domains/expense/ExpenseCalculator";
import {
  calculateFinancialSimulationV2,
  convertIncomeToIncomeSource,
  convertExpenseToExpenseSource,
} from "@/utils/financialSimulationV2";

interface UseFinancialSimulationV2Props {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomes?: Income[];
  simulationYears: number;
}

/**
 * 新しいIncomeCalculatorを使用したファイナンシャルシミュレーションフック
 * 既存のuseFinancialSimulationと同じインターフェースを維持
 */
export function useFinancialSimulationV2({
  assets,
  expenses = [],
  incomes = [],
  simulationYears,
}: UseFinancialSimulationV2Props) {
  return useMemo(() => {
    // IncomeCalculatorインスタンスを作成
    const incomeCalculator = createIncomeCalculator();

    // Income[]をIncomeSourceに変換してCalculatorに追加
    incomes.forEach((income) => {
      const incomeSource = convertIncomeToIncomeSource(income);
      incomeCalculator.addIncomeSource(incomeSource);
    });

    // ExpenseCalculatorインスタンスを作成
    const expenseCalculator = createExpenseCalculator();

    // Expense[]をExpenseSourceに変換してCalculatorに追加
    expenses.forEach((expense) => {
      const expenseSource = convertExpenseToExpenseSource(expense);
      expenseCalculator.addExpenseSource(expenseSource);
    });

    // 新しい計算ロジックを使用
    return calculateFinancialSimulationV2({
      assets,
      expenses,
      incomeCalculator,
      expenseCalculator,
      incomes, // チャート表示用に元のIncome配列も渡す
      simulationYears,
    });
  }, [assets, expenses, incomes, simulationYears]);
}
