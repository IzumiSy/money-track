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
          simulationMonths: 0,
        })
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください"
      );
    });

    it("シミュレーション期間が1201ヶ月の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, {
          simulationMonths: 1201,
        })
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください"
      );
    });

    it("シミュレーション期間が1ヶ月の場合は正常に動作する", () => {
      expect(() =>
        createSimulator(calculator, {
          simulationMonths: 1,
        })
      ).not.toThrow();
    });

    it("シミュレーション期間が1200ヶ月の場合は正常に動作する", () => {
      expect(() =>
        createSimulator(calculator, {
          simulationMonths: 1200,
        })
      ).not.toThrow();
    });

    it("シミュレーション期間が負の値の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, {
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

  describe("資産の残高追跡テスト", () => {
    it("資産の積立による残高増加が正しく追跡される", () => {
      // 資産ソース（積立あり）
      const asset: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: (monthIndex: number) => {
          // 最初の12ヶ月は月5万円積立
          if (monthIndex < 12) {
            return { income: 0, expense: 50000 };
          }
          return { income: 0, expense: 0 };
        },
        getMetadata: () => ({
          baseAmount: 1000000, // 初期残高100万円
        }),
      };

      calculator.addSource(asset);

      const simulator = createSimulator(calculator, {
        simulationMonths: 24,
      });

      const result = simulator.simulate();

      // 初月の資産残高確認
      expect(result.monthlyData[0].assetBalances.get("asset-1")).toBe(1050000); // 100万 + 5万

      // 6ヶ月目の資産残高確認
      expect(result.monthlyData[5].assetBalances.get("asset-1")).toBe(1300000); // 100万 + 5万 × 6

      // 12ヶ月目の資産残高確認（最後の積立月）
      expect(result.monthlyData[11].assetBalances.get("asset-1")).toBe(1600000); // 100万 + 5万 × 12

      // 13ヶ月目以降は積立なし
      expect(result.monthlyData[12].assetBalances.get("asset-1")).toBe(1600000);
      expect(result.monthlyData[23].assetBalances.get("asset-1")).toBe(1600000);
    });

    it("資産の引き出しによる残高減少が正しく追跡される", () => {
      // 資産ソース（引き出しあり）
      const asset: CalculatorSource = {
        id: "asset-1",
        name: "退職金",
        type: "asset",
        calculate: (monthIndex: number) => {
          // 12ヶ月目から月10万円引き出し
          if (monthIndex >= 12 && monthIndex < 24) {
            return { income: 100000, expense: 0 };
          }
          return { income: 0, expense: 0 };
        },
        getMetadata: () => ({
          baseAmount: 5000000, // 初期残高500万円
        }),
      };

      calculator.addSource(asset);

      const simulator = createSimulator(calculator, {
        simulationMonths: 36,
      });

      const result = simulator.simulate();

      // 最初の12ヶ月は引き出しなし
      expect(result.monthlyData[0].assetBalances.get("asset-1")).toBe(5000000);
      expect(result.monthlyData[11].assetBalances.get("asset-1")).toBe(5000000);

      // 13ヶ月目から引き出し開始
      expect(result.monthlyData[12].assetBalances.get("asset-1")).toBe(4900000); // 500万 - 10万
      expect(result.monthlyData[23].assetBalances.get("asset-1")).toBe(3800000); // 500万 - 10万 × 12

      // 25ヶ月目以降は引き出しなし
      expect(result.monthlyData[24].assetBalances.get("asset-1")).toBe(3800000);
      expect(result.monthlyData[35].assetBalances.get("asset-1")).toBe(3800000);
    });

    it("複数の資産が独立して管理される", () => {
      // 資産1: 積立のみ
      const asset1: CalculatorSource = {
        id: "asset-1",
        name: "つみたてNISA",
        type: "asset",
        calculate: () => ({ income: 0, expense: 30000 }), // 月3万円積立
        getMetadata: () => ({ baseAmount: 0 }),
      };

      // 資産2: 引き出しのみ
      const asset2: CalculatorSource = {
        id: "asset-2",
        name: "定期預金",
        type: "asset",
        calculate: () => ({ income: 20000, expense: 0 }), // 月2万円引き出し
        getMetadata: () => ({ baseAmount: 1000000 }),
      };

      // 通常の収入
      const income: CalculatorSource = {
        id: "income-1",
        name: "給与",
        type: "income",
        calculate: () => ({ income: 250000, expense: 0 }),
      };

      calculator.addSource(asset1);
      calculator.addSource(asset2);
      calculator.addSource(income);

      const simulator = createSimulator(calculator, {
        simulationMonths: 12,
      });

      const result = simulator.simulate();

      // 初月
      expect(result.monthlyData[0].assetBalances.get("asset-1")).toBe(30000);
      expect(result.monthlyData[0].assetBalances.get("asset-2")).toBe(980000);

      // 6ヶ月目
      expect(result.monthlyData[5].assetBalances.get("asset-1")).toBe(180000); // 3万 × 6
      expect(result.monthlyData[5].assetBalances.get("asset-2")).toBe(880000); // 100万 - 2万 × 6

      // 12ヶ月目
      expect(result.monthlyData[11].assetBalances.get("asset-1")).toBe(360000); // 3万 × 12
      expect(result.monthlyData[11].assetBalances.get("asset-2")).toBe(760000); // 100万 - 2万 × 12

      // 収入は資産残高に影響しない
      expect(result.monthlyData[0].assetBalances.has("income-1")).toBe(false);
    });

    it("積立と引き出しが同時に発生する資産の残高が正しく計算される", () => {
      // 資産ソース（積立と引き出しが重複）
      const asset: CalculatorSource = {
        id: "asset-1",
        name: "フレキシブル資産",
        type: "asset",
        calculate: (monthIndex: number) => {
          if (monthIndex < 6) {
            // 最初の6ヶ月は積立のみ（月5万円）
            return { income: 0, expense: 50000 };
          } else if (monthIndex >= 6 && monthIndex < 12) {
            // 6-11ヶ月目は積立と引き出し両方
            return { income: 30000, expense: 50000 }; // 差し引き2万円の積立
          } else {
            // 12ヶ月目以降は引き出しのみ（月3万円）
            return { income: 30000, expense: 0 };
          }
        },
        getMetadata: () => ({
          baseAmount: 2000000, // 初期残高200万円
        }),
      };

      calculator.addSource(asset);

      const simulator = createSimulator(calculator, {
        simulationMonths: 18,
      });

      const result = simulator.simulate();

      // 最初の6ヶ月（積立のみ）
      expect(result.monthlyData[0].assetBalances.get("asset-1")).toBe(2050000); // 200万 + 5万
      expect(result.monthlyData[5].assetBalances.get("asset-1")).toBe(2300000); // 200万 + 5万 × 6

      // 6-11ヶ月目（積立と引き出し）
      expect(result.monthlyData[6].assetBalances.get("asset-1")).toBe(2320000); // 230万 + 2万
      expect(result.monthlyData[11].assetBalances.get("asset-1")).toBe(2420000); // 230万 + 2万 × 6

      // 12ヶ月目以降（引き出しのみ）
      expect(result.monthlyData[12].assetBalances.get("asset-1")).toBe(2390000); // 242万 - 3万
      expect(result.monthlyData[17].assetBalances.get("asset-1")).toBe(2240000); // 242万 - 3万 × 6
    });
  });
});
