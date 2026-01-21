import { describe, it, expect, beforeEach } from "vitest";
import { createCalculator, Calculator, CalculatorSource } from "./index";

describe("Calculator.getBreakdown", () => {
  let calculator: Calculator<CalculatorSource>;

  beforeEach(() => {
    calculator = createCalculator<CalculatorSource>();
  });

  describe("収入と支出が両方あるケース", () => {
    it("単一の収入と単一の支出がある場合", () => {
      const incomeSource: CalculatorSource = {
        id: "income-1",
        name: "給与収入",
        type: "income",
        calculate: () => ({
          income: 300000,
          expense: 0,
        }),
      };

      const expenseSource: CalculatorSource = {
        id: "expense-1",
        name: "家賃",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 100000,
        }),
      };

      calculator.addSource(incomeSource);
      calculator.addSource(expenseSource);

      const breakdown = calculator.getBreakdown(0);

      expect(breakdown).toEqual({
        "income-1": { income: 300000, expense: 0 },
        "expense-1": { income: 0, expense: 100000 },
      });
    });

    it("複数の収入と複数の支出がある場合", () => {
      const salaryIncome: CalculatorSource = {
        id: "income-1",
        name: "給与収入",
        type: "income",
        calculate: () => ({
          income: 300000,
          expense: 0,
        }),
      };

      const bonusIncome: CalculatorSource = {
        id: "income-2",
        name: "ボーナス",
        type: "income",
        calculate: (monthIndex: number) => {
          if (monthIndex % 12 === 5 || monthIndex % 12 === 11) {
            return { income: 500000, expense: 0 };
          }
          return { income: 0, expense: 0 };
        },
      };

      const sideJobIncome: CalculatorSource = {
        id: "income-3",
        name: "副業収入",
        type: "income",
        calculate: () => ({
          income: 50000,
          expense: 0,
        }),
      };

      const rentExpense: CalculatorSource = {
        id: "expense-1",
        name: "家賃",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 100000,
        }),
      };

      const foodExpense: CalculatorSource = {
        id: "expense-2",
        name: "食費",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 50000,
        }),
      };

      const utilityExpense: CalculatorSource = {
        id: "expense-3",
        name: "光熱費",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 20000,
        }),
      };

      calculator.addSource(salaryIncome);
      calculator.addSource(bonusIncome);
      calculator.addSource(sideJobIncome);
      calculator.addSource(rentExpense);
      calculator.addSource(foodExpense);
      calculator.addSource(utilityExpense);

      // 通常月（ボーナスなし）- 1月（インデックス0）
      const breakdownJanuary = calculator.getBreakdown(0);
      expect(breakdownJanuary).toEqual({
        "income-1": { income: 300000, expense: 0 },
        "income-3": { income: 50000, expense: 0 },
        "expense-1": { income: 0, expense: 100000 },
        "expense-2": { income: 0, expense: 50000 },
        "expense-3": { income: 0, expense: 20000 },
      });

      // ボーナス月 - 6月（インデックス5）
      const breakdownJune = calculator.getBreakdown(5);
      expect(breakdownJune).toEqual({
        "income-1": { income: 300000, expense: 0 },
        "income-2": { income: 500000, expense: 0 },
        "income-3": { income: 50000, expense: 0 },
        "expense-1": { income: 0, expense: 100000 },
        "expense-2": { income: 0, expense: 50000 },
        "expense-3": { income: 0, expense: 20000 },
      });
    });

    it("期間限定の収入と支出がある場合", () => {
      const limitedIncome: CalculatorSource = {
        id: "income-1",
        name: "期間限定プロジェクト",
        type: "income",
        calculate: (monthIndex: number) => {
          if (monthIndex >= 0 && monthIndex <= 5) {
            return { income: 200000, expense: 0 };
          }
          return { income: 0, expense: 0 };
        },
      };

      const regularIncome: CalculatorSource = {
        id: "income-2",
        name: "基本給",
        type: "income",
        calculate: () => ({
          income: 250000,
          expense: 0,
        }),
      };

      const limitedExpense: CalculatorSource = {
        id: "expense-1",
        name: "ローン返済",
        type: "expense",
        calculate: (monthIndex: number) => {
          if (monthIndex >= 0 && monthIndex <= 11) {
            return { income: 0, expense: 30000 };
          }
          return { income: 0, expense: 0 };
        },
      };

      const regularExpense: CalculatorSource = {
        id: "expense-2",
        name: "生活費",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 150000,
        }),
      };

      calculator.addSource(limitedIncome);
      calculator.addSource(regularIncome);
      calculator.addSource(limitedExpense);
      calculator.addSource(regularExpense);

      // 3ヶ月目（期間限定の収入・支出あり）
      const breakdown3rdMonth = calculator.getBreakdown(2);
      expect(breakdown3rdMonth).toEqual({
        "income-1": { income: 200000, expense: 0 },
        "income-2": { income: 250000, expense: 0 },
        "expense-1": { income: 0, expense: 30000 },
        "expense-2": { income: 0, expense: 150000 },
      });

      // 7ヶ月目（期間限定の収入なし、支出あり）
      const breakdown7thMonth = calculator.getBreakdown(6);
      expect(breakdown7thMonth).toEqual({
        "income-2": { income: 250000, expense: 0 },
        "expense-1": { income: 0, expense: 30000 },
        "expense-2": { income: 0, expense: 150000 },
      });

      // 13ヶ月目（期間限定の収入・支出なし）
      const breakdown13thMonth = calculator.getBreakdown(12);
      expect(breakdown13thMonth).toEqual({
        "income-2": { income: 250000, expense: 0 },
        "expense-2": { income: 0, expense: 150000 },
      });
    });

    it("収入と支出が0のソースは含まれない", () => {
      const activeIncome: CalculatorSource = {
        id: "income-1",
        name: "アクティブ収入",
        type: "income",
        calculate: () => ({
          income: 100000,
          expense: 0,
        }),
      };

      const inactiveIncome: CalculatorSource = {
        id: "income-2",
        name: "非アクティブ収入",
        type: "income",
        calculate: () => ({
          income: 0,
          expense: 0,
        }),
      };

      const activeExpense: CalculatorSource = {
        id: "expense-1",
        name: "アクティブ支出",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 50000,
        }),
      };

      const inactiveExpense: CalculatorSource = {
        id: "expense-2",
        name: "非アクティブ支出",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 0,
        }),
      };

      calculator.addSource(activeIncome);
      calculator.addSource(inactiveIncome);
      calculator.addSource(activeExpense);
      calculator.addSource(inactiveExpense);

      const breakdown = calculator.getBreakdown(0);

      expect(breakdown).toEqual({
        "income-1": { income: 100000, expense: 0 },
        "expense-1": { income: 0, expense: 50000 },
      });
      expect(breakdown).not.toHaveProperty("income-2");
      expect(breakdown).not.toHaveProperty("expense-2");
    });

    it("同じ名前の収入と支出がある場合でも正しく処理される", () => {
      const incomeSource: CalculatorSource = {
        id: "income-1",
        name: "フリーランス",
        type: "income",
        calculate: () => ({
          income: 200000,
          expense: 0,
        }),
      };

      const expenseSource: CalculatorSource = {
        id: "expense-1",
        name: "フリーランス",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 50000,
        }),
      };

      calculator.addSource(incomeSource);
      calculator.addSource(expenseSource);

      const breakdown = calculator.getBreakdown(0);

      expect(breakdown).toEqual({
        "income-1": { income: 200000, expense: 0 },
        "expense-1": { income: 0, expense: 50000 },
      });
    });

    it("月によって変動する収入と支出がある場合", () => {
      const salaryWithRaise: CalculatorSource = {
        id: "income-1",
        name: "給与（昇給あり）",
        type: "income",
        calculate: (monthIndex: number) => {
          const baseAmount = 300000;
          const raisePerMonth = 1000;
          return {
            income: baseAmount + raisePerMonth * monthIndex,
            expense: 0,
          };
        },
      };

      const inflationExpense: CalculatorSource = {
        id: "expense-1",
        name: "生活費（インフレ）",
        type: "expense",
        calculate: (monthIndex: number) => {
          const baseAmount = 100000;
          const monthlyInflationRate = 0.002;
          return {
            income: 0,
            expense: Math.round(
              baseAmount * Math.pow(1 + monthlyInflationRate, monthIndex),
            ),
          };
        },
      };

      calculator.addSource(salaryWithRaise);
      calculator.addSource(inflationExpense);

      // 1ヶ月目（インデックス0）
      const breakdown1stMonth = calculator.getBreakdown(0);
      expect(breakdown1stMonth).toEqual({
        "income-1": { income: 300000, expense: 0 },
        "expense-1": { income: 0, expense: 100000 },
      });

      // 13ヶ月目（インデックス12）
      const breakdown13thMonth = calculator.getBreakdown(12);
      expect(breakdown13thMonth).toEqual({
        "income-1": { income: 312000, expense: 0 },
        "expense-1": { income: 0, expense: 102427 },
      });

      // 25ヶ月目（インデックス24）
      const breakdown25thMonth = calculator.getBreakdown(24);
      expect(breakdown25thMonth).toEqual({
        "income-1": { income: 324000, expense: 0 },
        "expense-1": { income: 0, expense: 104912 },
      });
    });
  });
});
