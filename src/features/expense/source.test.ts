import { describe, it, expect } from "vitest";
import { convertExpenseToExpenseSource } from "./source";
import { GroupedExpense } from "@/features/group/types";
import { Cycle } from "@/core/calculator/Cycle";

describe("convertExpenseToExpenseSource", () => {
  it("should convert a GroupedExpense to CalculatorSource with correct properties", () => {
    const expense: GroupedExpense = {
      id: "expense1",
      groupId: "group1",
      name: "家賃",
      cycles: [],
      color: "#EF4444",
      assetSourceId: "asset1",
    };

    const source = convertExpenseToExpenseSource(expense);

    expect(source.id).toBe("expense1");
    expect(source.name).toBe("家賃");
    expect(source.type).toBe("expense");
    expect(source.getMetadata?.()).toEqual({
      color: "#EF4444",
      originalExpense: expense,
      assetSourceId: "asset1",
    });
  });

  it("should return zero expense when no cycles are defined", () => {
    const expense: GroupedExpense = {
      id: "expense1",
      groupId: "group1",
      name: "空の支出",
      cycles: [],
      color: "#EF4444",
      assetSourceId: "asset1",
    };

    const source = convertExpenseToExpenseSource(expense);

    expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
    expect(source.calculate(12)).toEqual({ income: 0, expense: 0 });
    expect(source.calculate(100)).toEqual({ income: 0, expense: 0 });
  });

  describe("monthly cycle", () => {
    it("should calculate monthly expense correctly", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 100000,
        startMonthIndex: 0,
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "家賃",
        cycles: [monthlyCycle],
        color: "#EF4444",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 毎月発生する
      expect(source.calculate(0)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(1)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(100)).toEqual({ income: 0, expense: 100000 });
    });

    it("should respect startMonthIndex for monthly cycle", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 50000,
        startMonthIndex: 6, // 7ヶ月目から開始
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "サブスクリプション",
        cycles: [monthlyCycle],
        color: "#3B82F6",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 開始前
      expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(5)).toEqual({ income: 0, expense: 0 });

      // 開始後
      expect(source.calculate(6)).toEqual({ income: 0, expense: 50000 });
      expect(source.calculate(7)).toEqual({ income: 0, expense: 50000 });
      expect(source.calculate(100)).toEqual({ income: 0, expense: 50000 });
    });

    it("should respect endMonthIndex for monthly cycle", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 30000,
        startMonthIndex: 0,
        endMonthIndex: 11, // 1年間のみ
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "期間限定支出",
        cycles: [monthlyCycle],
        color: "#10B981",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 期間内
      expect(source.calculate(0)).toEqual({ income: 0, expense: 30000 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 30000 });

      // 期間外
      expect(source.calculate(12)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(24)).toEqual({ income: 0, expense: 0 });
    });
  });

  describe("yearly cycle", () => {
    it("should calculate yearly expense correctly", () => {
      const yearlyCycle: Cycle = {
        id: "cycle1",
        type: "yearly",
        amount: 120000,
        startMonthIndex: 0, // 1月に発生
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "年会費",
        cycles: [yearlyCycle],
        color: "#8B5CF6",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 1年目1月（月インデックス0）
      expect(source.calculate(0)).toEqual({ income: 0, expense: 120000 });

      // 1年目2月〜12月（月インデックス1-11）は発生しない
      expect(source.calculate(1)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(6)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 0 });

      // 2年目1月（月インデックス12）
      expect(source.calculate(12)).toEqual({ income: 0, expense: 120000 });

      // 3年目1月（月インデックス24）
      expect(source.calculate(24)).toEqual({ income: 0, expense: 120000 });
    });

    it("should handle yearly cycle starting in specific month", () => {
      const yearlyCycle: Cycle = {
        id: "cycle1",
        type: "yearly",
        amount: 50000,
        startMonthIndex: 5, // 6月に発生（0ベース）
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "車検",
        cycles: [yearlyCycle],
        color: "#F59E0B",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 開始前
      expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(4)).toEqual({ income: 0, expense: 0 });

      // 1年目6月
      expect(source.calculate(5)).toEqual({ income: 0, expense: 50000 });

      // 1年目7月〜翌年5月
      expect(source.calculate(6)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(16)).toEqual({ income: 0, expense: 0 });

      // 2年目6月（月インデックス17）
      expect(source.calculate(17)).toEqual({ income: 0, expense: 50000 });

      // 3年目6月（月インデックス29）
      expect(source.calculate(29)).toEqual({ income: 0, expense: 50000 });
    });
  });

  describe("custom cycle", () => {
    it("should calculate custom monthly interval correctly", () => {
      const customCycle: Cycle = {
        id: "cycle1",
        type: "custom",
        interval: 3,
        intervalUnit: "month",
        amount: 15000,
        startMonthIndex: 0,
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "四半期払い",
        cycles: [customCycle],
        color: "#EC4899",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 3ヶ月ごと
      expect(source.calculate(0)).toEqual({ income: 0, expense: 15000 });
      expect(source.calculate(1)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(2)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(3)).toEqual({ income: 0, expense: 15000 });
      expect(source.calculate(4)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(6)).toEqual({ income: 0, expense: 15000 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 15000 });
    });

    it("should calculate custom yearly interval correctly", () => {
      const customCycle: Cycle = {
        id: "cycle1",
        type: "custom",
        interval: 2,
        intervalUnit: "year",
        amount: 200000,
        startMonthIndex: 0,
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "隔年払い",
        cycles: [customCycle],
        color: "#06B6D4",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 2年ごと（24ヶ月間隔）
      expect(source.calculate(0)).toEqual({ income: 0, expense: 200000 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(23)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(24)).toEqual({ income: 0, expense: 200000 });
      expect(source.calculate(36)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(48)).toEqual({ income: 0, expense: 200000 });
    });
  });

  describe("multiple cycles", () => {
    it("should sum amounts from multiple cycles in the same month", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 100000,
        startMonthIndex: 0,
      };

      const yearlyCycle: Cycle = {
        id: "cycle2",
        type: "yearly",
        amount: 50000,
        startMonthIndex: 0,
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "複合支出",
        cycles: [monthlyCycle, yearlyCycle],
        color: "#84CC16",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 1月は両方発生
      expect(source.calculate(0)).toEqual({ income: 0, expense: 150000 });

      // 2〜12月は月額のみ
      expect(source.calculate(1)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 100000 });

      // 翌年1月は両方発生
      expect(source.calculate(12)).toEqual({ income: 0, expense: 150000 });
    });

    it("should handle multiple cycles with different periods", () => {
      const cycle1: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 10000,
        startMonthIndex: 0,
        endMonthIndex: 5, // 最初の6ヶ月のみ
      };

      const cycle2: Cycle = {
        id: "cycle2",
        type: "monthly",
        amount: 20000,
        startMonthIndex: 3, // 4ヶ月目から開始
      };

      const expense: GroupedExpense = {
        id: "expense1",
        groupId: "group1",
        name: "重複期間あり支出",
        cycles: [cycle1, cycle2],
        color: "#F97316",
        assetSourceId: "asset1",
      };

      const source = convertExpenseToExpenseSource(expense);

      // 最初の3ヶ月はcycle1のみ
      expect(source.calculate(0)).toEqual({ income: 0, expense: 10000 });
      expect(source.calculate(2)).toEqual({ income: 0, expense: 10000 });

      // 4〜6ヶ月目は両方
      expect(source.calculate(3)).toEqual({ income: 0, expense: 30000 });
      expect(source.calculate(5)).toEqual({ income: 0, expense: 30000 });

      // 7ヶ月目以降はcycle2のみ
      expect(source.calculate(6)).toEqual({ income: 0, expense: 20000 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 20000 });
    });
  });

  it("should always return income as 0", () => {
    const expense: GroupedExpense = {
      id: "expense1",
      groupId: "group1",
      name: "テスト支出",
      cycles: [
        {
          id: "cycle1",
          type: "monthly",
          amount: 50000,
          startMonthIndex: 0,
        },
      ],
      color: "#EF4444",
      assetSourceId: "asset1",
    };

    const source = convertExpenseToExpenseSource(expense);

    // 収入は常に0
    for (let i = 0; i < 100; i++) {
      expect(source.calculate(i).income).toBe(0);
    }
  });
});
