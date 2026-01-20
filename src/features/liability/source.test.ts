import { describe, it, expect } from "vitest";
import { convertLiabilityToLiabilitySource } from "./source";
import { GroupedLiability } from "@/features/group/types";
import { Cycle } from "@/core/calculator/Cycle";

describe("convertLiabilityToLiabilitySource", () => {
  it("should convert a GroupedLiability to CalculatorSource with correct properties", () => {
    const liability: GroupedLiability = {
      id: "liability1",
      groupId: "group1",
      name: "住宅ローン",
      cycles: [],
      color: "#EF4444",
      assetSourceId: "asset1",
      principal: 30000000,
      totalAmount: 35000000,
    };

    const source = convertLiabilityToLiabilitySource(liability);

    expect(source.id).toBe("liability1");
    expect(source.name).toBe("住宅ローン");
    expect(source.type).toBe("liability");
    expect(source.getMetadata?.()).toEqual({
      color: "#EF4444",
      originalLiability: liability,
      assetSourceId: "asset1",
      principal: 30000000,
      totalAmount: 35000000,
    });
  });

  it("should return zero expense when no cycles are defined", () => {
    const liability: GroupedLiability = {
      id: "liability1",
      groupId: "group1",
      name: "空の負債",
      cycles: [],
      color: "#EF4444",
      assetSourceId: "asset1",
      principal: 1000000,
      totalAmount: 1000000,
    };

    const source = convertLiabilityToLiabilitySource(liability);

    expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
    expect(source.calculate(12)).toEqual({ income: 0, expense: 0 });
    expect(source.calculate(100)).toEqual({ income: 0, expense: 0 });
  });

  describe("monthly repayment cycle", () => {
    it("should calculate monthly repayment correctly", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 100000,
        startMonthIndex: 0,
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "住宅ローン",
        cycles: [monthlyCycle],
        color: "#EF4444",
        assetSourceId: "asset1",
        principal: 30000000,
        totalAmount: 35000000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 毎月返済
      expect(source.calculate(0)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(1)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(100)).toEqual({ income: 0, expense: 100000 });
    });

    it("should respect startMonthIndex for repayment", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 50000,
        startMonthIndex: 3, // 4ヶ月目から返済開始
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "カーローン",
        cycles: [monthlyCycle],
        color: "#3B82F6",
        assetSourceId: "asset1",
        principal: 3000000,
        totalAmount: 3200000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 開始前
      expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(2)).toEqual({ income: 0, expense: 0 });

      // 開始後
      expect(source.calculate(3)).toEqual({ income: 0, expense: 50000 });
      expect(source.calculate(4)).toEqual({ income: 0, expense: 50000 });
      expect(source.calculate(100)).toEqual({ income: 0, expense: 50000 });
    });

    it("should respect endMonthIndex for repayment", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 80000,
        startMonthIndex: 0,
        endMonthIndex: 59, // 5年間（60ヶ月）
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "5年ローン",
        cycles: [monthlyCycle],
        color: "#10B981",
        assetSourceId: "asset1",
        principal: 4800000,
        totalAmount: 4800000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 期間内
      expect(source.calculate(0)).toEqual({ income: 0, expense: 80000 });
      expect(source.calculate(59)).toEqual({ income: 0, expense: 80000 });

      // 期間外
      expect(source.calculate(60)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(100)).toEqual({ income: 0, expense: 0 });
    });
  });

  describe("yearly repayment cycle", () => {
    it("should calculate yearly repayment correctly", () => {
      const yearlyCycle: Cycle = {
        id: "cycle1",
        type: "yearly",
        amount: 1200000,
        startMonthIndex: 0, // 毎年1月
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "年払いローン",
        cycles: [yearlyCycle],
        color: "#8B5CF6",
        assetSourceId: "asset1",
        principal: 6000000,
        totalAmount: 6000000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 1年目1月
      expect(source.calculate(0)).toEqual({ income: 0, expense: 1200000 });

      // 1年目2月〜12月
      expect(source.calculate(1)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 0 });

      // 2年目1月
      expect(source.calculate(12)).toEqual({ income: 0, expense: 1200000 });

      // 3年目1月
      expect(source.calculate(24)).toEqual({ income: 0, expense: 1200000 });
    });

    it("should handle yearly repayment starting in specific month", () => {
      const yearlyCycle: Cycle = {
        id: "cycle1",
        type: "yearly",
        amount: 600000,
        startMonthIndex: 6, // 7月に年払い
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "7月払いローン",
        cycles: [yearlyCycle],
        color: "#F59E0B",
        assetSourceId: "asset1",
        principal: 3000000,
        totalAmount: 3000000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 開始前
      expect(source.calculate(0)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(5)).toEqual({ income: 0, expense: 0 });

      // 1年目7月
      expect(source.calculate(6)).toEqual({ income: 0, expense: 600000 });

      // 1年目8月〜翌年6月
      expect(source.calculate(7)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(17)).toEqual({ income: 0, expense: 0 });

      // 2年目7月
      expect(source.calculate(18)).toEqual({ income: 0, expense: 600000 });
    });
  });

  describe("custom repayment cycle", () => {
    it("should calculate custom monthly interval correctly", () => {
      const customCycle: Cycle = {
        id: "cycle1",
        type: "custom",
        interval: 2,
        intervalUnit: "month",
        amount: 100000,
        startMonthIndex: 0,
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "隔月返済",
        cycles: [customCycle],
        color: "#EC4899",
        assetSourceId: "asset1",
        principal: 2400000,
        totalAmount: 2400000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 2ヶ月ごと
      expect(source.calculate(0)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(1)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(2)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(3)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(4)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 100000 });
    });

    it("should calculate custom yearly interval correctly", () => {
      const customCycle: Cycle = {
        id: "cycle1",
        type: "custom",
        interval: 2,
        intervalUnit: "year",
        amount: 500000,
        startMonthIndex: 0,
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "隔年返済",
        cycles: [customCycle],
        color: "#06B6D4",
        assetSourceId: "asset1",
        principal: 2500000,
        totalAmount: 2500000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 2年ごと（24ヶ月間隔）
      expect(source.calculate(0)).toEqual({ income: 0, expense: 500000 });
      expect(source.calculate(12)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(23)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(24)).toEqual({ income: 0, expense: 500000 });
      expect(source.calculate(36)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(48)).toEqual({ income: 0, expense: 500000 });
    });
  });

  describe("multiple repayment cycles", () => {
    it("should sum amounts from multiple cycles in the same month", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 100000,
        startMonthIndex: 0,
      };

      const bonusCycle: Cycle = {
        id: "cycle2",
        type: "yearly",
        amount: 500000,
        startMonthIndex: 5, // 6月にボーナス返済
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "ボーナス払いローン",
        cycles: [monthlyCycle, bonusCycle],
        color: "#84CC16",
        assetSourceId: "asset1",
        principal: 18000000,
        totalAmount: 20000000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 通常月
      expect(source.calculate(0)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(4)).toEqual({ income: 0, expense: 100000 });

      // 6月はボーナス返済含む
      expect(source.calculate(5)).toEqual({ income: 0, expense: 600000 });

      // 7月以降は通常
      expect(source.calculate(6)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(11)).toEqual({ income: 0, expense: 100000 });

      // 翌年6月もボーナス返済含む
      expect(source.calculate(17)).toEqual({ income: 0, expense: 600000 });
    });

    it("should handle multiple loans with different schedules", () => {
      const cycle1: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 80000,
        startMonthIndex: 0,
        endMonthIndex: 119, // 10年間
      };

      const cycle2: Cycle = {
        id: "cycle2",
        type: "monthly",
        amount: 50000,
        startMonthIndex: 60, // 5年目から別ローン開始
        endMonthIndex: 179, // 15年目まで
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "複合ローン",
        cycles: [cycle1, cycle2],
        color: "#F97316",
        assetSourceId: "asset1",
        principal: 15600000,
        totalAmount: 15600000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 最初の5年間はcycle1のみ
      expect(source.calculate(0)).toEqual({ income: 0, expense: 80000 });
      expect(source.calculate(59)).toEqual({ income: 0, expense: 80000 });

      // 5〜10年目は両方
      expect(source.calculate(60)).toEqual({ income: 0, expense: 130000 });
      expect(source.calculate(119)).toEqual({ income: 0, expense: 130000 });

      // 10〜15年目はcycle2のみ
      expect(source.calculate(120)).toEqual({ income: 0, expense: 50000 });
      expect(source.calculate(179)).toEqual({ income: 0, expense: 50000 });

      // 15年目以降は終了
      expect(source.calculate(180)).toEqual({ income: 0, expense: 0 });
    });
  });

  describe("real-world scenarios", () => {
    it("should handle typical mortgage scenario (35-year loan)", () => {
      const mortgageCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 120000,
        startMonthIndex: 0,
        endMonthIndex: 419, // 35年間
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "住宅ローン（35年）",
        cycles: [mortgageCycle],
        color: "#EF4444",
        assetSourceId: "asset1",
        principal: 40000000,
        totalAmount: 50400000, // 35年×12ヶ月×12万
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 開始
      expect(source.calculate(0)).toEqual({ income: 0, expense: 120000 });

      // 中間
      expect(source.calculate(209)).toEqual({ income: 0, expense: 120000 }); // 約17年目

      // 終了間際
      expect(source.calculate(419)).toEqual({ income: 0, expense: 120000 });

      // 終了後
      expect(source.calculate(420)).toEqual({ income: 0, expense: 0 });
    });

    it("should handle car loan with bonus payments", () => {
      const monthlyCycle: Cycle = {
        id: "cycle1",
        type: "monthly",
        amount: 30000,
        startMonthIndex: 0,
        endMonthIndex: 59, // 5年間
      };

      const summerBonusCycle: Cycle = {
        id: "cycle2",
        type: "yearly",
        amount: 150000,
        startMonthIndex: 5, // 6月
        endMonthIndex: 53, // 5年目の6月まで（約4.5年）
      };

      const winterBonusCycle: Cycle = {
        id: "cycle3",
        type: "yearly",
        amount: 150000,
        startMonthIndex: 11, // 12月
        endMonthIndex: 59, // 5年目の12月まで
      };

      const liability: GroupedLiability = {
        id: "liability1",
        groupId: "group1",
        name: "カーローン（ボーナス併用）",
        cycles: [monthlyCycle, summerBonusCycle, winterBonusCycle],
        color: "#3B82F6",
        assetSourceId: "asset1",
        principal: 3000000,
        totalAmount: 3300000,
      };

      const source = convertLiabilityToLiabilitySource(liability);

      // 通常月
      expect(source.calculate(0)).toEqual({ income: 0, expense: 30000 });
      expect(source.calculate(4)).toEqual({ income: 0, expense: 30000 });

      // 6月（ボーナス月）
      expect(source.calculate(5)).toEqual({ income: 0, expense: 180000 });

      // 12月（ボーナス月）
      expect(source.calculate(11)).toEqual({ income: 0, expense: 180000 });

      // 翌年の通常月
      expect(source.calculate(12)).toEqual({ income: 0, expense: 30000 });

      // ローン終了後
      expect(source.calculate(60)).toEqual({ income: 0, expense: 0 });
    });
  });

  it("should always return income as 0", () => {
    const liability: GroupedLiability = {
      id: "liability1",
      groupId: "group1",
      name: "テストローン",
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
      principal: 1000000,
      totalAmount: 1000000,
    };

    const source = convertLiabilityToLiabilitySource(liability);

    // 収入は常に0（負債は返済するだけ）
    for (let i = 0; i < 100; i++) {
      expect(source.calculate(i).income).toBe(0);
    }
  });
});
