import { describe, it, expect } from "vitest";
import { convertAssetToAssetSource } from "./source";
import { GroupedAsset } from "@/domains/group/types";

describe("convertAssetToAssetSource", () => {
  it("should convert a GroupedAsset to CalculatorSource", () => {
    const asset: GroupedAsset = {
      id: "asset1",
      groupId: "group1",
      name: "S&P500 Index",
      returnRate: 0.07,
      color: "#10B981",
      baseAmount: 1000000,
      contributionOptions: [],
      withdrawalOptions: [],
    };

    const source = convertAssetToAssetSource(asset);

    expect(source.id).toBe("asset1");
    expect(source.name).toBe("S&P500 Index");
    expect(source.type).toBe("asset");
    expect(source.getMetadata?.()).toEqual({
      color: "#10B981",
      returnRate: 0.07,
      baseAmount: 1000000,
      originalAsset: asset,
    });
  });

  it("should calculate contributions as expenses", () => {
    const asset: GroupedAsset = {
      id: "asset1",
      groupId: "group1",
      name: "Investment Fund",
      returnRate: 0.05,
      color: "#3B82F6",
      baseAmount: 0,
      contributionOptions: [
        {
          id: "contrib1",
          startYear: 0,
          startMonth: 1,
          endYear: 2,
          endMonth: 12,
          monthlyAmount: 50000,
        },
      ],
      withdrawalOptions: [],
    };

    const source = convertAssetToAssetSource(asset);

    // Month 0 (Year 0, Month 1)
    expect(source.calculate(0)).toEqual({ income: 0, expense: 50000 });

    // Month 12 (Year 1, Month 1)
    expect(source.calculate(12)).toEqual({ income: 0, expense: 50000 });

    // Month 35 (Year 2, Month 12)
    expect(source.calculate(35)).toEqual({ income: 0, expense: 50000 });

    // Month 36 (Year 3, Month 1) - outside range
    expect(source.calculate(36)).toEqual({ income: 0, expense: 0 });
  });

  it("should calculate withdrawals as income", () => {
    const asset: GroupedAsset = {
      id: "asset1",
      groupId: "group1",
      name: "Retirement Fund",
      returnRate: 0.04,
      color: "#EF4444",
      baseAmount: 5000000,
      contributionOptions: [],
      withdrawalOptions: [
        {
          id: "withdraw1",
          startYear: 10,
          startMonth: 1,
          endYear: 15,
          endMonth: 12,
          monthlyAmount: 100000,
        },
      ],
    };

    const source = convertAssetToAssetSource(asset);

    // Month 119 (Year 9, Month 12) - before withdrawal
    expect(source.calculate(119)).toEqual({ income: 0, expense: 0 });

    // Month 120 (Year 10, Month 1) - start of withdrawal
    expect(source.calculate(120)).toEqual({ income: 100000, expense: 0 });

    // Month 191 (Year 15, Month 12) - end of withdrawal
    expect(source.calculate(191)).toEqual({ income: 100000, expense: 0 });

    // Month 192 (Year 16, Month 1) - after withdrawal
    expect(source.calculate(192)).toEqual({ income: 0, expense: 0 });
  });

  it("should handle multiple contribution and withdrawal options", () => {
    const asset: GroupedAsset = {
      id: "asset1",
      groupId: "group1",
      name: "Complex Asset",
      returnRate: 0.06,
      color: "#8B5CF6",
      baseAmount: 2000000,
      contributionOptions: [
        {
          id: "contrib1",
          startYear: 0,
          startMonth: 1,
          endYear: 5,
          endMonth: 12,
          monthlyAmount: 30000,
        },
        {
          id: "contrib2",
          startYear: 3,
          startMonth: 6,
          endYear: 8,
          endMonth: 6,
          monthlyAmount: 20000,
        },
      ],
      withdrawalOptions: [
        {
          id: "withdraw1",
          startYear: 10,
          startMonth: 1,
          endYear: 12,
          endMonth: 12,
          monthlyAmount: 50000,
        },
      ],
    };

    const source = convertAssetToAssetSource(asset);

    // Month 0 - only first contribution
    expect(source.calculate(0)).toEqual({ income: 0, expense: 30000 });

    // Month 41 (Year 3, Month 6) - both contributions
    expect(source.calculate(41)).toEqual({ income: 0, expense: 50000 });

    // Month 71 (Year 5, Month 12) - both contributions
    expect(source.calculate(71)).toEqual({ income: 0, expense: 50000 });

    // Month 72 (Year 6, Month 1) - only second contribution
    expect(source.calculate(72)).toEqual({ income: 0, expense: 20000 });

    // Month 120 (Year 10, Month 1) - withdrawal starts
    expect(source.calculate(120)).toEqual({ income: 50000, expense: 0 });
  });

  it("should handle overlapping contributions and withdrawals", () => {
    const asset: GroupedAsset = {
      id: "asset1",
      groupId: "group1",
      name: "Flexible Asset",
      returnRate: 0.05,
      color: "#F59E0B",
      baseAmount: 1000000,
      contributionOptions: [
        {
          id: "contrib1",
          startYear: 0,
          startMonth: 1,
          endYear: 10,
          endMonth: 12,
          monthlyAmount: 25000,
        },
      ],
      withdrawalOptions: [
        {
          id: "withdraw1",
          startYear: 5,
          startMonth: 1,
          endYear: 7,
          endMonth: 12,
          monthlyAmount: 15000,
        },
      ],
    };

    const source = convertAssetToAssetSource(asset);

    // Month 60 (Year 5, Month 1) - both contribution and withdrawal
    expect(source.calculate(60)).toEqual({ income: 15000, expense: 25000 });
  });
});
