"use client";

import { useMemo } from "react";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { createCalculator } from "@/domains/shared/createCalculator";
import { CalculatorSource } from "@/domains/shared/CalculatorSource";
import { calculateFinancialSimulation } from "@/utils/financialSimulation";
import { convertExpenseToExpenseSource } from "@/domains/expense/source";
import { convertIncomeToIncomeSource } from "@/domains/income/source";

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

    // 新しい計算ロジックを使用
    return calculateFinancialSimulation({
      initialDeposits: assets.deposits,
      unifiedCalculator,
      simulationYears,
    });
  }, [assets, expenses, incomes, simulationYears]);
}
