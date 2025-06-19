import { describe, it, expect, beforeEach } from "vitest";
import { calculateFinancialSimulation } from "./financialSimulation";
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

  describe("収入と支出が両方あるケース", () => {
    it("単一の収入と単一の支出がある場合", () => {
      // 収入ソースを追加
      const incomeSource: CalculatorSource = {
        id: "income-1",
        name: "給与収入",
        type: "income",
        calculate: (year: number, month: number) => ({
          income: 300000,
          expense: 0,
        }),
      };

      // 支出ソースを追加
      const expenseSource: CalculatorSource = {
        id: "expense-1",
        name: "家賃",
        type: "expense",
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 100000,
        }),
      };

      calculator.addSource(incomeSource);
      calculator.addSource(expenseSource);

      const breakdown = calculator.getBreakdown(2025, 1);

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
        calculate: (year: number, month: number) => ({
          income: 300000,
          expense: 0,
        }),
      };

      const bonusIncome: CalculatorSource = {
        id: "income-2",
        name: "ボーナス",
        type: "income",
        calculate: (year: number, month: number) => {
          // 6月と12月のみボーナス
          if (month === 6 || month === 12) {
            return { income: 500000, expense: 0 };
          }
          return { income: 0, expense: 0 };
        },
      };

      const sideJobIncome: CalculatorSource = {
        id: "income-3",
        name: "副業収入",
        type: "income",
        calculate: (year: number, month: number) => ({
          income: 50000,
          expense: 0,
        }),
      };

      // 複数の支出ソースを追加
      const rentExpense: CalculatorSource = {
        id: "expense-1",
        name: "家賃",
        type: "expense",
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 100000,
        }),
      };

      const foodExpense: CalculatorSource = {
        id: "expense-2",
        name: "食費",
        type: "expense",
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 50000,
        }),
      };

      const utilityExpense: CalculatorSource = {
        id: "expense-3",
        name: "光熱費",
        type: "expense",
        calculate: (year: number, month: number) => ({
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

      // 通常月（ボーナスなし）
      const breakdownJanuary = calculator.getBreakdown(2025, 1);
      expect(breakdownJanuary).toEqual({
        "income-1": { income: 300000, expense: 0 },
        "income-3": { income: 50000, expense: 0 },
        "expense-1": { income: 0, expense: 100000 },
        "expense-2": { income: 0, expense: 50000 },
        "expense-3": { income: 0, expense: 20000 },
      });

      // ボーナス月
      const breakdownJune = calculator.getBreakdown(2025, 6);
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
        calculate: (year: number, month: number) => {
          // 2025年1月から6月まで
          if (year === 2025 && month >= 1 && month <= 6) {
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
        calculate: (year: number, month: number) => ({
          income: 250000,
          expense: 0,
        }),
      };

      // 期間限定の支出ソース
      const limitedExpense: CalculatorSource = {
        id: "expense-1",
        name: "ローン返済",
        type: "expense",
        calculate: (year: number, month: number) => {
          // 2025年1月から12月まで
          if (year === 2025) {
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
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 150000,
        }),
      };

      calculator.addSource(limitedIncome);
      calculator.addSource(regularIncome);
      calculator.addSource(limitedExpense);
      calculator.addSource(regularExpense);

      // 2025年3月（期間限定の収入・支出あり）
      const breakdown2025March = calculator.getBreakdown(2025, 3);
      expect(breakdown2025March).toEqual({
        "income-1": { income: 200000, expense: 0 },
        "income-2": { income: 250000, expense: 0 },
        "expense-1": { income: 0, expense: 30000 },
        "expense-2": { income: 0, expense: 150000 },
      });

      // 2025年7月（期間限定の収入なし、支出あり）
      const breakdown2025July = calculator.getBreakdown(2025, 7);
      expect(breakdown2025July).toEqual({
        "income-2": { income: 250000, expense: 0 },
        "expense-1": { income: 0, expense: 30000 },
        "expense-2": { income: 0, expense: 150000 },
      });

      // 2026年1月（期間限定の収入・支出なし）
      const breakdown2026January = calculator.getBreakdown(2026, 1);
      expect(breakdown2026January).toEqual({
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
        calculate: (year: number, month: number) => ({
          income: 100000,
          expense: 0,
        }),
      };

      // 非アクティブな収入ソース（0円）
      const inactiveIncome: CalculatorSource = {
        id: "income-2",
        name: "非アクティブ収入",
        type: "income",
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 0,
        }),
      };

      // アクティブな支出ソース
      const activeExpense: CalculatorSource = {
        id: "expense-1",
        name: "アクティブ支出",
        type: "expense",
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 50000,
        }),
      };

      // 非アクティブな支出ソース（0円）
      const inactiveExpense: CalculatorSource = {
        id: "expense-2",
        name: "非アクティブ支出",
        type: "expense",
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 0,
        }),
      };

      calculator.addSource(activeIncome);
      calculator.addSource(inactiveIncome);
      calculator.addSource(activeExpense);
      calculator.addSource(inactiveExpense);

      const breakdown = calculator.getBreakdown(2025, 1);

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
        calculate: (year: number, month: number) => ({
          income: 200000,
          expense: 0,
        }),
      };

      // 同じ名前の支出ソース（フリーランス関連の経費）
      const expenseSource: CalculatorSource = {
        id: "expense-1",
        name: "フリーランス",
        type: "expense",
        calculate: (year: number, month: number) => ({
          income: 0,
          expense: 50000,
        }),
      };

      calculator.addSource(incomeSource);
      calculator.addSource(expenseSource);

      const breakdown = calculator.getBreakdown(2025, 1);

      // IDが異なるため、両方のソースが含まれる
      expect(breakdown).toEqual({
        "income-1": { income: 200000, expense: 0 },
        "expense-1": { income: 0, expense: 50000 },
      });
    });

    it("年によって変動する収入と支出がある場合", () => {
      // 年次昇給がある収入
      const salaryWithRaise: CalculatorSource = {
        id: "income-1",
        name: "給与（昇給あり）",
        type: "income",
        calculate: (year: number, month: number) => {
          const baseAmount = 300000;
          const raisePerYear = 10000;
          const yearsFromStart = year - 2025;
          return {
            income: baseAmount + raisePerYear * yearsFromStart,
            expense: 0,
          };
        },
      };

      // インフレで増加する支出
      const inflationExpense: CalculatorSource = {
        id: "expense-1",
        name: "生活費（インフレ）",
        type: "expense",
        calculate: (year: number, month: number) => {
          const baseAmount = 100000;
          const inflationRate = 0.02; // 年2%
          const yearsFromStart = year - 2025;
          return {
            income: 0,
            expense: Math.round(
              baseAmount * Math.pow(1 + inflationRate, yearsFromStart)
            ),
          };
        },
      };

      calculator.addSource(salaryWithRaise);
      calculator.addSource(inflationExpense);

      // 2025年
      const breakdown2025 = calculator.getBreakdown(2025, 1);
      expect(breakdown2025).toEqual({
        "income-1": { income: 300000, expense: 0 },
        "expense-1": { income: 0, expense: 100000 },
      });

      // 2026年
      const breakdown2026 = calculator.getBreakdown(2026, 1);
      expect(breakdown2026).toEqual({
        "income-1": { income: 310000, expense: 0 },
        "expense-1": { income: 0, expense: 102000 },
      });

      // 2027年
      const breakdown2027 = calculator.getBreakdown(2027, 1);
      expect(breakdown2027).toEqual({
        "income-1": { income: 320000, expense: 0 },
        "expense-1": { income: 0, expense: 104040 },
      });
    });
  });

  describe("calculateFinancialSimulationとの統合テスト", () => {
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

      const result = calculateFinancialSimulation({
        initialDeposits: 1000000,
        unifiedCalculator: calculator,
        simulationYears: 3,
      });

      // 月間純キャッシュフロー = 300000 - 200000 = 100000
      expect(result.netMonthlyCashFlow).toBe(100000);

      // 年間純キャッシュフロー = 100000 * 12 = 1200000
      // 1年目: 1000000 + 1200000 = 2200000
      expect(result.simulationData[0].deposits).toBe(2200000);

      // IDにハイフンが含まれているため、正しいキー名を使用
      expect(result.simulationData[0]["income_income-1"]).toBe(3600000); // 300000 * 12
      expect(result.simulationData[0]["expense_expense-1"]).toBe(-2400000); // -200000 * 12

      // 2年目: 1000000 + 2400000 = 3400000
      expect(result.simulationData[1].deposits).toBe(3400000);

      // 3年目: 1000000 + 3600000 = 4600000
      expect(result.simulationData[2].deposits).toBe(4600000);
    });
  });
});
