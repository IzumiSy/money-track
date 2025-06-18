"use client";

import { useMemo } from "react";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";

interface SimulationDataPoint {
  year: string;
  deposits: number;
  total: number;
  [key: string]: string | number; // 動的なキー（investment_*, income_*, expense_*）
}

interface UseFinancialSimulationProps {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomes?: Income[];
  simulationYears: number;
}

export function useFinancialSimulation({
  assets,
  expenses = [],
  incomes = [],
  simulationYears,
}: UseFinancialSimulationProps) {
  const { deposits, investments } = assets;

  // 月額積立の合計額を計算（積立オプションから）
  const totalMonthlyInvestments = useMemo(() => {
    return investments.reduce((sum, inv) => {
      return (
        sum +
        inv.investmentOptions.reduce((optionSum, option) => {
          return optionSum + option.monthlyAmount;
        }, 0)
      );
    }, 0);
  }, [investments]);

  // 月額売却の合計額を計算（売却オプションから）
  const totalMonthlySellbacks = useMemo(() => {
    return investments.reduce((sum, inv) => {
      return (
        sum +
        inv.sellbackOptions.reduce((optionSum, option) => {
          return optionSum + option.monthlyAmount;
        }, 0)
      );
    }, 0);
  }, [investments]);

  // 月額収入の合計額を計算
  const totalMonthlyIncomes = useMemo(() => {
    return incomes.reduce((sum, income) => sum + income.monthlyAmount, 0);
  }, [incomes]);

  // 月額支出の合計額を計算
  const totalMonthlyExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.monthlyAmount, 0);
  }, [expenses]);

  // 純キャッシュフロー（収入 - 支出）を計算
  const netMonthlyCashFlow = useMemo(() => {
    return totalMonthlyIncomes - totalMonthlyExpenses;
  }, [totalMonthlyIncomes, totalMonthlyExpenses]);

  // ベース評価額の合計を計算
  const totalBaseAmount = useMemo(() => {
    return investments.reduce((sum, inv) => sum + inv.baseAmount, 0);
  }, [investments]);

  // 初期総資産額
  const initialTotal = useMemo(() => {
    return deposits + totalBaseAmount;
  }, [deposits, totalBaseAmount]);

  // 資産推移シミュレーション計算（収入・支出・投資を考慮）
  const simulationData = useMemo((): SimulationDataPoint[] => {
    const data: SimulationDataPoint[] = [];

    for (let year = 0; year <= simulationYears; year++) {
      // 年間の純キャッシュフロー（収入 - 支出）を計算
      const yearlyNetCashFlow = netMonthlyCashFlow * 12 * year;

      // 売却による預金の増加を計算（売却オプションから）
      let yearlySellbacks = 0;
      investments.forEach((inv) => {
        inv.sellbackOptions.forEach((option) => {
          const startTotalMonths =
            option.startYear * 12 + (option.startMonth - 1);
          const endTotalMonths = option.endYear * 12 + (option.endMonth - 1);
          const currentTotalMonths = year * 12;

          // 現在の年月が売却期間内かチェック
          if (
            currentTotalMonths >= startTotalMonths &&
            option.monthlyAmount > 0
          ) {
            // 実際の売却期間を計算
            const actualEndMonths = Math.min(
              endTotalMonths,
              currentTotalMonths
            );
            const sellbackMonths = actualEndMonths - startTotalMonths + 1;

            if (sellbackMonths > 0) {
              yearlySellbacks += option.monthlyAmount * sellbackMonths;
            }
          }
        });
      });

      // 調整済み預金額（基本預金 + 純キャッシュフロー + 売却収入）
      const adjustedDeposits = Math.max(
        0,
        deposits + yearlyNetCashFlow + yearlySellbacks
      );

      const yearData: SimulationDataPoint = {
        year: `${year}年目`,
        deposits: Math.round(adjustedDeposits),
        total: 0, // 後で計算
      };

      let totalInvestmentValue = 0;

      // 各投資の将来価値を個別に計算
      investments.forEach((inv) => {
        // ベース評価額の成長を計算
        let baseValue = 0;
        if (inv.baseAmount > 0) {
          const annualRate = inv.returnRate;
          baseValue = inv.baseAmount * Math.pow(1 + annualRate, year);
        }

        // 積立オプションの将来価値を計算
        let monthlyInvestmentValue = 0;
        inv.investmentOptions.forEach((option) => {
          // 各オプションの開始・終了時期を計算
          const startTotalMonths =
            option.startYear * 12 + (option.startMonth - 1);
          const endTotalMonths = option.endYear * 12 + (option.endMonth - 1);
          const currentTotalMonths = year * 12;

          // 現在の年月が積立期間内かチェック
          if (
            currentTotalMonths >= startTotalMonths &&
            option.monthlyAmount > 0
          ) {
            // 実際の積立期間を計算
            const actualEndMonths = Math.min(
              endTotalMonths,
              currentTotalMonths
            );
            const investmentMonths = actualEndMonths - startTotalMonths + 1;

            if (investmentMonths > 0) {
              const monthlyRate = inv.returnRate / 12;
              let optionValue = 0;

              if (monthlyRate > 0) {
                // 複利計算式: PMT * (((1 + r)^n - 1) / r)
                optionValue =
                  (option.monthlyAmount *
                    (Math.pow(1 + monthlyRate, investmentMonths) - 1)) /
                  monthlyRate;

                // 積立終了後の成長を計算
                if (currentTotalMonths > endTotalMonths) {
                  const growthMonths = currentTotalMonths - endTotalMonths;
                  optionValue =
                    optionValue * Math.pow(1 + monthlyRate, growthMonths);
                }
              } else {
                // リターン率が0の場合は単純な積立額の合計
                optionValue = option.monthlyAmount * investmentMonths;
              }

              monthlyInvestmentValue += optionValue;
            }
          }
        });

        // 総投資価値（ベース評価額 + 積立投資価値）
        let futureValue = baseValue + monthlyInvestmentValue;

        // 売却オプションによる投資価値の減少を計算
        inv.sellbackOptions.forEach((option) => {
          const startTotalMonths =
            option.startYear * 12 + (option.startMonth - 1);
          const endTotalMonths = option.endYear * 12 + (option.endMonth - 1);
          const currentTotalMonths = year * 12;

          // 現在の年月が売却期間内かチェック
          if (
            currentTotalMonths >= startTotalMonths &&
            option.monthlyAmount > 0
          ) {
            // 実際の売却期間を計算
            const actualEndMonths = Math.min(
              endTotalMonths,
              currentTotalMonths
            );
            const sellbackMonths = actualEndMonths - startTotalMonths + 1;

            if (sellbackMonths > 0) {
              const totalSellbackAmount = option.monthlyAmount * sellbackMonths;
              futureValue = Math.max(0, futureValue - totalSellbackAmount);
            }
          }
        });

        const investmentKey = `investment_${inv.id}`;
        yearData[investmentKey] = Math.round(futureValue);
        totalInvestmentValue += futureValue;
      });

      // 各支出項目を個別にマイナスのバーとして追加
      expenses.forEach((expense) => {
        const expenseKey = `expense_${expense.id}`;
        yearData[expenseKey] = -Math.round(expense.monthlyAmount * 12);
      });

      // 各収入項目を個別にPositiveバーとして追加
      incomes.forEach((income) => {
        const incomeKey = `income_${income.id}`;
        yearData[incomeKey] = Math.round(income.monthlyAmount * 12);
      });

      yearData.total = Math.round(adjustedDeposits + totalInvestmentValue);
      data.push(yearData);
    }

    return data;
  }, [
    simulationYears,
    netMonthlyCashFlow,
    deposits,
    investments,
    expenses,
    incomes,
  ]);

  // 最終年のデータ
  const finalYearData = useMemo(() => {
    return simulationData[simulationData.length - 1];
  }, [simulationData]);

  // データが存在するかどうかの判定
  const hasData = useMemo(() => {
    return initialTotal > 0 || totalMonthlyInvestments > 0;
  }, [initialTotal, totalMonthlyInvestments]);

  return {
    simulationData,
    finalYearData,
    hasData,
    totalMonthlyInvestments,
    totalMonthlySellbacks,
    totalMonthlyIncomes,
    totalMonthlyExpenses,
    netMonthlyCashFlow,
    totalBaseAmount,
    initialTotal,
  };
}
