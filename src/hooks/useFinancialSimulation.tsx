"use client";

import { useMemo } from "react";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { createIncomeCalculator } from "@/domains/income/IncomeCalculator";
import { createExpenseCalculator } from "@/domains/expense/ExpenseCalculator";
import {
  calculateFinancialSimulation,
  convertIncomeToIncomeSource,
  convertExpenseToExpenseSource,
} from "@/utils/financialSimulation";

interface UseFinancialSimulationProps {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomes?: Income[];
  simulationYears: number;
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
    // IncomeCalculatorインスタンスを作成
    const incomeCalculator = createIncomeCalculator();

    // Income[]をIncomeSourceに変換してCalculatorに追加
    incomes.forEach((income) => {
      incomeCalculator.addSource(convertIncomeToIncomeSource(income));
    });

    // ExpenseCalculatorインスタンスを作成
    const expenseCalculator = createExpenseCalculator();

    // Expense[]をExpenseSourceに変換してCalculatorに追加
    expenses.forEach((expense) => {
      expenseCalculator.addSource(convertExpenseToExpenseSource(expense));
    });

    // 新しい計算ロジックを使用
    return calculateFinancialSimulation({
      assets,
      expenses,
      incomeCalculator,
      expenseCalculator,
      incomes, // チャート表示用に元のIncome配列も渡す
      simulationYears,
    });
  }, [assets, expenses, incomes, simulationYears]);
}
