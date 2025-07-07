import { describe, it, expect } from "vitest";
import { convertAssetToAssetSource } from "./source";
import { GroupedAsset } from "@/domains/group/types";

describe("convertAssetToAssetSource", () => {
  const createMockAsset = (
    overrides?: Partial<GroupedAsset>
  ): GroupedAsset => ({
    id: "asset-1",
    groupId: "group-1",
    name: "投資信託",
    returnRate: 5, // 年利5%
    color: "#FF0000",
    baseAmount: 1000000, // 100万円
    contributionOptions: [],
    withdrawalOptions: [],
    ...overrides,
  });

  it("基本的な資産ソースを作成できる", () => {
    const asset = createMockAsset();
    const source = convertAssetToAssetSource(asset);

    expect(source.id).toBe("asset-1");
    expect(source.name).toBe("投資信託");
    expect(source.type).toBe("asset");
  });

  it("年利を月利に正しく変換する", () => {
    const asset = createMockAsset({ returnRate: 12 }); // 年利12%
    const source = convertAssetToAssetSource(asset);

    // 初月の計算
    const result = source.calculate(0);

    // 月利約1%（正確には0.9489%）の利息収入
    expect(result.income).toBeCloseTo(9489, 0);
    expect(result.expense).toBe(0);
  });

  it("複利計算が正しく行われる", () => {
    const asset = createMockAsset({ returnRate: 12 }); // 年利12%
    const source = convertAssetToAssetSource(asset);

    // 1ヶ月目
    const month1 = source.calculate(1);
    // 2ヶ月目は1ヶ月目の残高に対して利息計算
    expect(month1.income).toBeGreaterThan(9489); // 複利効果で初月より増加
  });

  it("積立オプションが正しく処理される", () => {
    const asset = createMockAsset({
      contributionOptions: [
        {
          id: "contrib-1",
          startYear: 1,
          startMonth: 1,
          endYear: 1,
          endMonth: 12,
          monthlyAmount: 50000, // 月5万円積立
        },
      ],
    });
    const source = convertAssetToAssetSource(asset);

    // 0ヶ月目（1年1月）
    const month0 = source.calculate(0);
    expect(month0.income).toBeGreaterThan(50000); // 利息 + 積立

    // 12ヶ月目（2年1月）- 積立期間外
    const month12 = source.calculate(12);
    expect(month12.income).toBeLessThan(50000); // 利息のみ
  });

  it("引き出しオプションが正しく処理される", () => {
    const asset = createMockAsset({
      withdrawalOptions: [
        {
          id: "withdraw-1",
          startYear: 2,
          startMonth: 1,
          endYear: 2,
          endMonth: 6,
          monthlyAmount: 30000, // 月3万円引き出し
        },
      ],
    });
    const source = convertAssetToAssetSource(asset);

    // 11ヶ月目（1年12月）- 引き出し前
    const month11 = source.calculate(11);
    expect(month11.expense).toBe(0);

    // 12ヶ月目（2年1月）- 引き出し開始
    const month12 = source.calculate(12);
    expect(month12.expense).toBe(30000);

    // 18ヶ月目（2年7月）- 引き出し終了後
    const month18 = source.calculate(18);
    expect(month18.expense).toBe(0);
  });

  it("複数の積立・引き出しオプションが同時に処理される", () => {
    const asset = createMockAsset({
      contributionOptions: [
        {
          id: "contrib-1",
          startYear: 1,
          startMonth: 1,
          endYear: 1,
          endMonth: 6,
          monthlyAmount: 30000,
        },
        {
          id: "contrib-2",
          startYear: 1,
          startMonth: 4,
          endYear: 1,
          endMonth: 9,
          monthlyAmount: 20000,
        },
      ],
      withdrawalOptions: [
        {
          id: "withdraw-1",
          startYear: 1,
          startMonth: 7,
          endYear: 1,
          endMonth: 12,
          monthlyAmount: 40000,
        },
      ],
    });
    const source = convertAssetToAssetSource(asset);

    // 3ヶ月目（1年4月）- 両方の積立が有効
    const month3 = source.calculate(3);
    expect(month3.income).toBeGreaterThan(50000); // 利息 + 30000 + 20000

    // 6ヶ月目（1年7月）- 積立1終了、引き出し開始
    const month6 = source.calculate(6);
    expect(month6.income).toBeGreaterThan(20000); // 利息 + 20000
    expect(month6.expense).toBe(40000);
  });

  it("メタデータが正しく返される", () => {
    const asset = createMockAsset();
    const source = convertAssetToAssetSource(asset);
    const metadata = source.getMetadata?.();

    expect(metadata).toEqual({
      color: "#FF0000",
      originalAsset: asset,
      assetType: "investment",
      returnRate: 5,
    });
  });
});
