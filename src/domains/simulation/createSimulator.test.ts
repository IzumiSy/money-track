import { describe, it, expect, beforeEach } from "vitest";
import { createSimulator } from "./createSimulator";
import {
  createCalculator,
  Calculator,
  CalculatorSource,
} from "@/domains/shared";

describe("unifiedCalculator.getBreakdown", () => {
  let calculator: Calculator<CalculatorSource>;

  beforeEach(() => {
    calculator = createCalculator<CalculatorSource>();
  });

  describe("シミュレーション期間の検証", () => {
    it("シミュレーション期間が0ヶ月の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, {
          initialDeposits: 1000000,
          simulationMonths: 0,
        })
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください"
      );
    });

    it("シミュレーション期間が1201ヶ月の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, {
          initialDeposits: 1000000,
          simulationMonths: 1201,
        })
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください"
      );
    });

    it("シミュレーション期間が1ヶ月の場合は正常に動作する", () => {
      expect(() =>
        createSimulator(calculator, {
          initialDeposits: 1000000,
          simulationMonths: 1,
        })
      ).not.toThrow();
    });

    it("シミュレーション期間が1200ヶ月の場合は正常に動作する", () => {
      expect(() =>
        createSimulator(calculator, {
          initialDeposits: 1000000,
          simulationMonths: 1200,
        })
      ).not.toThrow();
    });

    it("シミュレーション期間が負の値の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, {
          initialDeposits: 1000000,
          simulationMonths: -5,
        })
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください"
      );
    });
  });

  describe("収入と支出が両方あるケース", () => {
    it("単一の収入と単一の支出がある場合", () => {
      // 収入ソースを追加
      const incomeSource: CalculatorSource = {
        id: "income-1",
        name: "給与収入",
        type: "income",
        calculate: () => ({
          income: 300000,
          expense: 0,
        }),
      };

      // 支出ソースを追加
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

      const breakdown = calculator.getBreakdown(0); // 最初の月

      expect(breakdown).toEqual({
        "income-1": { income: 300000, expense: 0 },
        "expense-1": { income: 0, expense: 100000 },
      });
    });

    it("複数の収入と複数の支出がある場合", () => {
      // 複数の収入ソースを追加
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
          // 6月と12月のみボーナス（月インデックス5と11）
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

      // 複数の支出ソースを追加
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
      // 期間限定の収入ソース
      const limitedIncome: CalculatorSource = {
        id: "income-1",
        name: "期間限定プロジェクト",
        type: "income",
        calculate: (monthIndex: number) => {
          // 最初の6ヶ月のみ（インデックス0-5）
          if (monthIndex >= 0 && monthIndex <= 5) {
            return { income: 200000, expense: 0 };
          }
          return { income: 0, expense: 0 };
        },
      };

      // 通常の収入ソース
      const regularIncome: CalculatorSource = {
        id: "income-2",
        name: "基本給",
        type: "income",
        calculate: () => ({
          income: 250000,
          expense: 0,
        }),
      };

      // 期間限定の支出ソース
      const limitedExpense: CalculatorSource = {
        id: "expense-1",
        name: "ローン返済",
        type: "expense",
        calculate: (monthIndex: number) => {
          // 最初の12ヶ月のみ（インデックス0-11）
          if (monthIndex >= 0 && monthIndex <= 11) {
            return { income: 0, expense: 30000 };
          }
          return { income: 0, expense: 0 };
        },
      };

      // 通常の支出ソース
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
      // アクティブな収入ソース
      const activeIncome: CalculatorSource = {
        id: "income-1",
        name: "アクティブ収入",
        type: "income",
        calculate: () => ({
          income: 100000,
          expense: 0,
        }),
      };

      // 非アクティブな収入ソース（0円）
      const inactiveIncome: CalculatorSource = {
        id: "income-2",
        name: "非アクティブ収入",
        type: "income",
        calculate: () => ({
          income: 0,
          expense: 0,
        }),
      };

      // アクティブな支出ソース
      const activeExpense: CalculatorSource = {
        id: "expense-1",
        name: "アクティブ支出",
        type: "expense",
        calculate: () => ({
          income: 0,
          expense: 50000,
        }),
      };

      // 非アクティブな支出ソース（0円）
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

      // 0円のソースは含まれない
      expect(breakdown).toEqual({
        "income-1": { income: 100000, expense: 0 },
        "expense-1": { income: 0, expense: 50000 },
      });
      expect(breakdown).not.toHaveProperty("income-2");
      expect(breakdown).not.toHaveProperty("expense-2");
    });

    it("同じ名前の収入と支出がある場合でも正しく処理される", () => {
      // 同じ名前の収入ソース
      const incomeSource: CalculatorSource = {
        id: "income-1",
        name: "フリーランス",
        type: "income",
        calculate: () => ({
          income: 200000,
          expense: 0,
        }),
      };

      // 同じ名前の支出ソース（フリーランス関連の経費）
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

      // IDが異なるため、両方のソースが含まれる
      expect(breakdown).toEqual({
        "income-1": { income: 200000, expense: 0 },
        "expense-1": { income: 0, expense: 50000 },
      });
    });

    it("月によって変動する収入と支出がある場合", () => {
      // 月次昇給がある収入
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

      // インフレで増加する支出
      const inflationExpense: CalculatorSource = {
        id: "expense-1",
        name: "生活費（インフレ）",
        type: "expense",
        calculate: (monthIndex: number) => {
          const baseAmount = 100000;
          const monthlyInflationRate = 0.002; // 月0.2%
          return {
            income: 0,
            expense: Math.round(
              baseAmount * Math.pow(1 + monthlyInflationRate, monthIndex)
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

  describe("createSimulatorとの統合テスト", () => {
    it("収入と支出の両方を含むシミュレーションが正しく動作する", () => {
      // 収入ソース
      const income: CalculatorSource = {
        id: "income-1",
        name: "月収",
        type: "income",
        calculate: () => ({ income: 300000, expense: 0 }),
      };

      // 支出ソース
      const expense: CalculatorSource = {
        id: "expense-1",
        name: "月間支出",
        type: "expense",
        calculate: () => ({ income: 0, expense: 200000 }),
      };

      calculator.addSource(income);
      calculator.addSource(expense);

      const simulator = createSimulator(calculator, {
        initialDeposits: 1000000,
        simulationMonths: 36, // 3年間
      });

      const result = simulator.simulate();

      // 月間純キャッシュフロー = 300000 - 200000 = 100000
      expect(result.currentMonthlyCashFlow.net).toBe(100000);
      expect(result.currentMonthlyCashFlow.income).toBe(300000);
      expect(result.currentMonthlyCashFlow.expense).toBe(200000);

      // 月次データの確認
      // 1ヶ月目: 1000000 + 100000 = 1100000
      expect(result.monthlyData[0].deposits).toBe(1100000);
      expect(result.monthlyData[0].monthIndex).toBe(0);

      // 12ヶ月目: 1000000 + 100000 * 12 = 2200000
      expect(result.monthlyData[11].deposits).toBe(2200000);
      expect(result.monthlyData[11].monthIndex).toBe(11);

      // 収入・支出のブレークダウンを確認（月次）
      expect(result.monthlyData[0].incomeBreakdown.get("income-1")).toBe(
        300000
      );
      expect(result.monthlyData[0].expenseBreakdown.get("expense-1")).toBe(
        200000
      );

      // 24ヶ月目: 1000000 + 100000 * 24 = 3400000
      expect(result.monthlyData[23].deposits).toBe(3400000);
      expect(result.monthlyData[23].monthIndex).toBe(23);

      // 36ヶ月目: 1000000 + 100000 * 36 = 4600000
      expect(result.monthlyData[35].deposits).toBe(4600000);
      expect(result.monthlyData[35].monthIndex).toBe(35);

      // hasDataフラグの確認
      expect(result.hasData).toBe(true);
    });
  });
});
