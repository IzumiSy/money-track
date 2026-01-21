import { describe, it, expect } from "vitest";
import { convertIncomeToIncomeSource } from "./source";
import { GroupedIncome } from "@/features/group/types";
import { Cycle } from "@/core/calculator/Cycle";

describe("convertIncomeToIncomeSource", () => {
  it("should convert a GroupedIncome to CalculatorSource with correct properties", () => {
    const income: GroupedIncome = {
      id: "income1",
      groupId: "group1",
      name: "給与",
      cycles: [],
      color: "#10B981",
      assetSourceId: "asset1",
    };

    const source = convertIncomeToIncomeSource(income);

    expect(source.id).toBe("income1");
    expect(source.name).toBe("給与");
    expect(source.type).toBe("income");
    expect(source.getMetadata?.()).toEqual({
      color: "#10B981",
      originalIncome: income,
      assetSourceId: "asset1",
    });
  });

  it("should return zero income when no cycles are defined", () => {
    const income: GroupedIncome = {
      id: "income1",
      groupId: "group1",
      name: "空の収入",
      cycles: [],
      color: "#10B981",
      assetSourceId: "asset1",
    };

    const source = convertIncomeToIncomeSource(income);

    expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
    expect(source.calculate(12)).toEqual({ income: 0, expense: 0 });
    expect(source.calculate(100)).toEqual({ income: 0, expense: 0 });
  });

  describe("monthly cycle", () => {
    it("should calculate monthly income correctly", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 300000,
        startMonthIndex: 0,
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "給与",
        cycles: [monthlyCycle],
        color: "#10B981",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 毎月発生する
      expect(source.calculate(0)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(1)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(11)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(12)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(100)).toEqual({ income: 300000, expense: 0 });
    });

    it("should respect startMonthIndex for monthly cycle", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 200000,
        startMonthIndex: 6, // 7ヶ月目から開始
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "副業収入",
        cycles: [monthlyCycle],
        color: "#3B82F6",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 開始前
      expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(5)).toEqual({ income: 0, expense: 0 });

      // 開始後
      expect(source.calculate(6)).toEqual({ income: 200000, expense: 0 });
      expect(source.calculate(7)).toEqual({ income: 200000, expense: 0 });
      expect(source.calculate(100)).toEqual({ income: 200000, expense: 0 });
    });

    it("should respect endMonthIndex for monthly cycle", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 150000,
        startMonthIndex: 0,
        endMonthIndex: 23, // 2年間のみ
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "期間限定収入",
        cycles: [monthlyCycle],
        color: "#F59E0B",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 期間内
      expect(source.calculate(0)).toEqual({ income: 150000, expense: 0 });
      expect(source.calculate(23)).toEqual({ income: 150000, expense: 0 });

      // 期間外
      expect(source.calculate(24)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(36)).toEqual({ income: 0, expense: 0 });
    });
  });

  describe("yearly cycle", () => {
    it("should calculate yearly income correctly (bonus)", () => {
      const yearlyCycle: Cycle = {
        id: "cycle1",
        type: "yearly",
        amount: 500000,
        startMonthIndex: 5, // 6月にボーナス（0ベース）
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "夏季ボーナス",
        cycles: [yearlyCycle],
        color: "#8B5CF6",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 開始前
      expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(4)).toEqual({ income: 0, expense: 0 });

      // 1年目6月
      expect(source.calculate(5)).toEqual({ income: 500000, expense: 0 });

      // 1年目7月〜翌年5月
      expect(source.calculate(6)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(16)).toEqual({ income: 0, expense: 0 });

      // 2年目6月（月インデックス17）
      expect(source.calculate(17)).toEqual({ income: 500000, expense: 0 });

      // 3年目6月（月インデックス29）
      expect(source.calculate(29)).toEqual({ income: 500000, expense: 0 });
    });

    it("should handle yearly cycle starting from month 0", () => {
      const yearlyCycle: Cycle = {
        id: "cycle1",
        type: "yearly",
        amount: 100000,
        startMonthIndex: 0,
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "年間配当",
        cycles: [yearlyCycle],
        color: "#EC4899",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      expect(source.calculate(0)).toEqual({ income: 100000, expense: 0 });
      expect(source.calculate(1)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(12)).toEqual({ income: 100000, expense: 0 });
      expect(source.calculate(24)).toEqual({ income: 100000, expense: 0 });
    });
  });

  describe("custom cycle", () => {
    it("should calculate custom monthly interval correctly", () => {
      const customCycle: Cycle = {
        id: "cycle1",
        type: "custom",
        interval: 6,
        intervalUnit: "month",
        amount: 80000,
        startMonthIndex: 0,
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "半年ごとの収入",
        cycles: [customCycle],
        color: "#06B6D4",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 6ヶ月ごと
      expect(source.calculate(0)).toEqual({ income: 80000, expense: 0 });
      expect(source.calculate(1)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(6)).toEqual({ income: 80000, expense: 0 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(12)).toEqual({ income: 80000, expense: 0 });
      expect(source.calculate(18)).toEqual({ income: 80000, expense: 0 });
    });

    it("should calculate custom yearly interval correctly", () => {
      const customCycle: Cycle = {
        id: "cycle1",
        type: "custom",
        interval: 3,
        intervalUnit: "year",
        amount: 1000000,
        startMonthIndex: 0,
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "3年ごとの収入",
        cycles: [customCycle],
        color: "#84CC16",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 3年ごと（36ヶ月間隔）
      expect(source.calculate(0)).toEqual({ income: 1000000, expense: 0 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(24)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(35)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(36)).toEqual({ income: 1000000, expense: 0 });
      expect(source.calculate(72)).toEqual({ income: 1000000, expense: 0 });
    });
  });

  describe("multiple cycles (salary + bonus scenario)", () => {
    it("should sum amounts from monthly salary and yearly bonus", () => {
      const salaryCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 300000,
        startMonthIndex: 0,
      };

      const summerBonusCycle: Cycle = {
        id: "cycle2",
        type: "yearly",
        amount: 600000,
        startMonthIndex: 5, // 6月
      };

      const winterBonusCycle: Cycle = {
        id: "cycle3",
        type: "yearly",
        amount: 600000,
        startMonthIndex: 11, // 12月
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "給与＋ボーナス",
        cycles: [salaryCycle, summerBonusCycle, winterBonusCycle],
        color: "#10B981",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 通常月は給与のみ
      expect(source.calculate(0)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(4)).toEqual({ income: 300000, expense: 0 });

      // 6月は給与＋夏ボーナス
      expect(source.calculate(5)).toEqual({ income: 900000, expense: 0 });

      // 7〜11月は給与のみ
      expect(source.calculate(6)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(10)).toEqual({ income: 300000, expense: 0 });

      // 12月は給与＋冬ボーナス
      expect(source.calculate(11)).toEqual({ income: 900000, expense: 0 });

      // 翌年も同様
      expect(source.calculate(17)).toEqual({ income: 900000, expense: 0 }); // 翌年6月
      expect(source.calculate(23)).toEqual({ income: 900000, expense: 0 }); // 翌年12月
    });

    it("should handle income with different start and end periods", () => {
      const cycle1: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 250000,
        startMonthIndex: 0,
        endMonthIndex: 35, // 最初の3年間
      };

      const cycle2: Cycle = {
        id: "cycle2",
        type: "monthly",
        amount: 350000,
        startMonthIndex: 36, // 4年目から昇給
      };

      const income: GroupedIncome = {
        id: "income1",
        groupId: "group1",
        name: "昇給込み給与",
        cycles: [cycle1, cycle2],
        color: "#F97316",
        assetSourceId: "asset1",
      };

      const source = convertIncomeToIncomeSource(income);

      // 最初の3年間
      expect(source.calculate(0)).toEqual({ income: 250000, expense: 0 });
      expect(source.calculate(35)).toEqual({ income: 250000, expense: 0 });

      // 4年目以降
      expect(source.calculate(36)).toEqual({ income: 350000, expense: 0 });
      expect(source.calculate(48)).toEqual({ income: 350000, expense: 0 });
    });
  });

  it("should always return expense as 0", () => {
    const income: GroupedIncome = {
      id: "income1",
      groupId: "group1",
      name: "テスト収入",
      cycles: [
        {
          id: "cycle1",
          type: "monthly",
          amount: 300000,
          startMonthIndex: 0,
        },
      ],
      color: "#10B981",
      assetSourceId: "asset1",
    };

    const source = convertIncomeToIncomeSource(income);

    // 支出は常に0
    for (let i = 0; i < 100; i++) {
      expect(source.calculate(i).expense).toBe(0);
    }
  });
});
