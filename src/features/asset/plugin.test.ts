import { describe, it, expect } from "vitest";
import { AssetPlugin } from "./plugin";
import {
  MonthlyProcessingContext,
  PostMonthlyContext,
} from "@/core/plugin/types";
import { CalculatorSource } from "@/core/calculator";

/**
 * テスト用のsourceBalancesを作成するヘルパー
 */
function createSourceBalances(
  assetBalances?: Map<string, number>,
  liabilityBalances?: Map<string, number>,
): Map<string, Map<string, number>> {
  const sourceBalances = new Map<string, Map<string, number>>();
  sourceBalances.set("asset", assetBalances ?? new Map<string, number>());
  sourceBalances.set(
    "liability",
    liabilityBalances ?? new Map<string, number>(),
  );
  return sourceBalances;
}

/**
 * テスト用のMonthlyProcessingContextを作成するヘルパー
 */
function createMonthlyContext(overrides: {
  source: CalculatorSource;
  cashFlowChange: { income: number; expense: number };
  assetBalances?: Map<string, number>;
  liabilityBalances?: Map<string, number>;
  cashOutflows?: Map<string, number>;
  cashInflows?: Map<string, number>;
  allSources?: CalculatorSource[];
  monthIndex?: number;
}): MonthlyProcessingContext {
  const sourceBalances = createSourceBalances(
    overrides.assetBalances,
    overrides.liabilityBalances,
  );

  return {
    monthIndex: overrides.monthIndex ?? 0,
    source: overrides.source,
    cashFlowChange: overrides.cashFlowChange,
    sourceBalances,
    cashInflows: overrides.cashInflows ?? new Map<string, number>(),
    cashOutflows: overrides.cashOutflows ?? new Map<string, number>(),
    allSources: overrides.allSources ?? [],
  };
}

/**
 * テスト用のPostMonthlyContextを作成するヘルパー
 */
function createPostMonthlyContext(overrides: {
  allSources: CalculatorSource[];
  assetBalances?: Map<string, number>;
  liabilityBalances?: Map<string, number>;
  cashInflows?: Map<string, number>;
  cashOutflows?: Map<string, number>;
  monthIndex?: number;
}): PostMonthlyContext {
  const sourceBalances = createSourceBalances(
    overrides.assetBalances,
    overrides.liabilityBalances,
  );

  return {
    monthIndex: overrides.monthIndex ?? 0,
    sourceBalances,
    cashInflows: overrides.cashInflows ?? new Map<string, number>(),
    cashOutflows: overrides.cashOutflows ?? new Map<string, number>(),
    allSources: overrides.allSources,
  };
}

describe("AssetPlugin", () => {
  describe("applyMonthlyEffect", () => {
    it("積立（expense）がある場合、残高が増加する", () => {
      const assetBalances = new Map<string, number>();
      const cashOutflows = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);

      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 50000 }),
      };

      const context = createMonthlyContext({
        source,
        cashFlowChange: { income: 0, expense: 50000 },
        assetBalances,
        cashOutflows,
      });

      AssetPlugin.applyMonthlyEffect!(context);

      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(1050000);
      expect(cashOutflows.get("investment_asset-1")).toBe(50000);
    });

    it("引き出し（income）がある場合、残高が減少する", () => {
      const assetBalances = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);

      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 100000, expense: 0 }),
      };

      const context = createMonthlyContext({
        source,
        cashFlowChange: { income: 100000, expense: 0 },
        assetBalances,
      });

      AssetPlugin.applyMonthlyEffect!(context);

      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(900000);
    });

    it("積立と引き出しが両方ある場合、正味の変動が適用される", () => {
      const assetBalances = new Map<string, number>();
      const cashOutflows = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);

      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 20000, expense: 50000 }),
      };

      const context = createMonthlyContext({
        source,
        cashFlowChange: { income: 20000, expense: 50000 },
        assetBalances,
        cashOutflows,
      });

      AssetPlugin.applyMonthlyEffect!(context);

      // 1000000 + 50000(積立) - 20000(引出) = 1030000
      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(1030000);
      expect(cashOutflows.get("investment_asset-1")).toBe(50000);
    });

    it("残高が0から始まる場合でも正しく処理される", () => {
      const assetBalances = new Map<string, number>();

      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 30000 }),
      };

      const context = createMonthlyContext({
        source,
        cashFlowChange: { income: 0, expense: 30000 },
        assetBalances,
      });

      AssetPlugin.applyMonthlyEffect!(context);

      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(30000);
    });
  });

  describe("postMonthlyProcess - 利回り計算", () => {
    it("年利5%の資産に対して月次利息が計算される", () => {
      const assetBalances = new Map<string, number>();
      const cashInflows = new Map<string, number>();

      assetBalances.set("asset-1", 1200000);

      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          baseAmount: 1000000,
          returnRate: 0.05,
        }),
      };

      const context = createPostMonthlyContext({
        assetBalances,
        cashInflows,
        allSources: [source],
      });

      AssetPlugin.postMonthlyProcess?.(context);

      // 1200000 * (0.05 / 12) = 5000
      const expectedInterest = 1200000 * (0.05 / 12);
      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(
        1200000 + expectedInterest,
      );
      expect(cashInflows.get("return_asset-1")).toBe(expectedInterest);
    });

    it("利回りが0%の場合、利息は発生しない", () => {
      const assetBalances = new Map<string, number>();
      const cashInflows = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);

      const source: CalculatorSource = {
        id: "asset-1",
        name: "普通預金",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          baseAmount: 1000000,
          returnRate: 0,
        }),
      };

      const context = createPostMonthlyContext({
        assetBalances,
        cashInflows,
        allSources: [source],
      });

      AssetPlugin.postMonthlyProcess?.(context);

      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(1000000);
      expect(cashInflows.has("return_asset-1")).toBe(false);
    });

    it("メタデータがない場合、利息は発生しない", () => {
      const assetBalances = new Map<string, number>();
      const cashInflows = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);

      const source: CalculatorSource = {
        id: "asset-1",
        name: "普通預金",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
      };

      const context = createPostMonthlyContext({
        assetBalances,
        cashInflows,
        allSources: [source],
      });

      AssetPlugin.postMonthlyProcess?.(context);

      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(1000000);
      expect(cashInflows.has("return_asset-1")).toBe(false);
    });

    it("複数の資産に対して個別に利息が計算される", () => {
      const assetBalances = new Map<string, number>();
      const cashInflows = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);
      assetBalances.set("asset-2", 500000);

      const asset1: CalculatorSource = {
        id: "asset-1",
        name: "投資信託A",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          baseAmount: 1000000,
          returnRate: 0.05,
        }),
      };

      const asset2: CalculatorSource = {
        id: "asset-2",
        name: "投資信託B",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          baseAmount: 500000,
          returnRate: 0.03,
        }),
      };

      const context = createPostMonthlyContext({
        assetBalances,
        cashInflows,
        allSources: [asset1, asset2],
      });

      AssetPlugin.postMonthlyProcess?.(context);

      const expectedInterest1 = 1000000 * (0.05 / 12);
      const expectedInterest2 = 500000 * (0.03 / 12);

      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(
        1000000 + expectedInterest1,
      );
      expect(resultAssetBalances.get("asset-2")).toBe(
        500000 + expectedInterest2,
      );
      expect(cashInflows.get("return_asset-1")).toBe(expectedInterest1);
      expect(cashInflows.get("return_asset-2")).toBe(expectedInterest2);
    });

    it("利息が複利で積み上がることを確認", () => {
      const assetBalances = new Map<string, number>();
      const cashInflows = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);

      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          baseAmount: 1000000,
          returnRate: 0.12, // 年利12%（月利1%）で計算しやすくする
        }),
      };

      // 1ヶ月目
      const context1 = createPostMonthlyContext({
        assetBalances,
        cashInflows,
        allSources: [source],
      });

      AssetPlugin.postMonthlyProcess?.(context1);

      // 1000000 * 0.01 = 10000
      const resultAssetBalances1 = context1.sourceBalances.get("asset")!;
      expect(resultAssetBalances1.get("asset-1")).toBe(1010000);

      // 2ヶ月目（assetBalancesは更新されている）
      const context2 = createPostMonthlyContext({
        monthIndex: 1,
        assetBalances: resultAssetBalances1,
        cashInflows,
        allSources: [source],
      });

      AssetPlugin.postMonthlyProcess?.(context2);

      // 1010000 * 0.01 = 10100
      const resultAssetBalances2 = context2.sourceBalances.get("asset")!;
      expect(resultAssetBalances2.get("asset-1")).toBe(1020100);

      // 利息の合計: 10000 + 10100 = 20100
      expect(cashInflows.get("return_asset-1")).toBe(20100);
    });

    it("非資産タイプのソースは利息計算されない", () => {
      const assetBalances = new Map<string, number>();
      const cashInflows = new Map<string, number>();

      assetBalances.set("asset-1", 1000000);

      const assetSource: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          baseAmount: 1000000,
          returnRate: 0.05,
        }),
      };

      const incomeSource: CalculatorSource = {
        id: "income-1",
        name: "給与",
        type: "income",
        calculate: () => ({ income: 300000, expense: 0 }),
      };

      const context = createPostMonthlyContext({
        assetBalances,
        cashInflows,
        allSources: [assetSource, incomeSource],
      });

      AssetPlugin.postMonthlyProcess?.(context);

      // 資産の利息のみ計算される
      const expectedInterest = 1000000 * (0.05 / 12);
      const resultAssetBalances = context.sourceBalances.get("asset")!;
      expect(resultAssetBalances.get("asset-1")).toBe(
        1000000 + expectedInterest,
      );
      expect(cashInflows.get("return_asset-1")).toBe(expectedInterest);

      // 収入ソースには影響なし
      expect(cashInflows.has("return_income_income-1")).toBe(false);
    });
  });

  describe("getInitialBalance", () => {
    it("メタデータからbaseAmountを返す", () => {
      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          baseAmount: 1500000,
          returnRate: 0.05,
        }),
      };

      const result = AssetPlugin.getInitialBalance?.(source);

      expect(result).toBe(1500000);
    });

    it("メタデータがない場合は0を返す", () => {
      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
      };

      const result = AssetPlugin.getInitialBalance?.(source);

      expect(result).toBe(0);
    });

    it("baseAmountが未定義の場合は0を返す", () => {
      const source: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: () => ({ income: 0, expense: 0 }),
        getMetadata: () => ({
          returnRate: 0.05,
        }),
      };

      const result = AssetPlugin.getInitialBalance?.(source);

      expect(result).toBe(0);
    });
  });
});
