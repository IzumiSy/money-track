import { describe, it, expect, beforeEach } from "vitest";
import { createSimulator } from "./createSimulator";
import {
  createCalculator,
  Calculator,
  CalculatorSource,
} from "@/core/calculator";
import { createPluginRegistry, PluginRegistry } from "@/core/plugin/registry";
import { AssetPlugin } from "@/features/asset/plugin";
import { IncomePlugin } from "@/features/income/plugin";
import { ExpensePlugin } from "@/features/expense/plugin";
import { LiabilityPlugin } from "@/features/liability/plugin";

/**
 * テスト用のプラグインレジストリを作成
 */
function createTestPluginRegistry(): PluginRegistry {
  const registry = createPluginRegistry();
  registry.register(AssetPlugin);
  registry.register(IncomePlugin);
  registry.register(ExpensePlugin);
  registry.register(LiabilityPlugin);
  return registry;
}

describe("createSimulator", () => {
  let calculator: Calculator<CalculatorSource>;
  let pluginRegistry: PluginRegistry;

  beforeEach(() => {
    calculator = createCalculator<CalculatorSource>();
    pluginRegistry = createTestPluginRegistry();
  });

  describe("シミュレーション期間の検証", () => {
    it("シミュレーション期間が0ヶ月の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, { simulationMonths: 0 }, pluginRegistry),
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください",
      );
    });

    it("シミュレーション期間が1201ヶ月の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, { simulationMonths: 1201 }, pluginRegistry),
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください",
      );
    });

    it("シミュレーション期間が1ヶ月の場合は正常に動作する", () => {
      expect(() =>
        createSimulator(calculator, { simulationMonths: 1 }, pluginRegistry),
      ).not.toThrow();
    });

    it("シミュレーション期間が1200ヶ月の場合は正常に動作する", () => {
      expect(() =>
        createSimulator(calculator, { simulationMonths: 1200 }, pluginRegistry),
      ).not.toThrow();
    });

    it("シミュレーション期間が負の値の場合はエラーになる", () => {
      expect(() =>
        createSimulator(calculator, { simulationMonths: -5 }, pluginRegistry),
      ).toThrow(
        "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください",
      );
    });
  });

  describe("資産の残高追跡", () => {
    it("資産の積立による残高増加が正しく追跡される", () => {
      const asset: CalculatorSource = {
        id: "asset-1",
        name: "投資信託",
        type: "asset",
        calculate: (monthIndex: number) => {
          if (monthIndex < 12) {
            return { income: 0, expense: 50000 };
          }
          return { income: 0, expense: 0 };
        },
        getMetadata: () => ({
          baseAmount: 1000000,
        }),
      };

      calculator.addSource(asset);

      const simulator = createSimulator(
        calculator,
        { simulationMonths: 24 },
        pluginRegistry,
      );

      const result = simulator.simulate();

      expect(
        result.monthlyData[0].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(1050000);
      expect(
        result.monthlyData[5].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(1300000);
      expect(
        result.monthlyData[11].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(1600000);
      expect(
        result.monthlyData[12].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(1600000);
      expect(
        result.monthlyData[23].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(1600000);
    });

    it("資産の引き出しによる残高減少が正しく追跡される", () => {
      const asset: CalculatorSource = {
        id: "asset-1",
        name: "退職金",
        type: "asset",
        calculate: (monthIndex: number) => {
          if (monthIndex >= 12 && monthIndex < 24) {
            return { income: 100000, expense: 0 };
          }
          return { income: 0, expense: 0 };
        },
        getMetadata: () => ({
          baseAmount: 5000000,
        }),
      };

      calculator.addSource(asset);

      const simulator = createSimulator(
        calculator,
        { simulationMonths: 36 },
        pluginRegistry,
      );

      const result = simulator.simulate();

      expect(
        result.monthlyData[0].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(5000000);
      expect(
        result.monthlyData[11].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(5000000);
      expect(
        result.monthlyData[12].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(4900000);
      expect(
        result.monthlyData[23].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(3800000);
      expect(
        result.monthlyData[24].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(3800000);
      expect(
        result.monthlyData[35].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(3800000);
    });

    it("複数の資産が独立して管理される", () => {
      const asset1: CalculatorSource = {
        id: "asset-1",
        name: "つみたてNISA",
        type: "asset",
        calculate: () => ({ income: 0, expense: 30000 }),
        getMetadata: () => ({ baseAmount: 0 }),
      };

      const asset2: CalculatorSource = {
        id: "asset-2",
        name: "定期預金",
        type: "asset",
        calculate: () => ({ income: 20000, expense: 0 }),
        getMetadata: () => ({ baseAmount: 1000000 }),
      };

      const income: CalculatorSource = {
        id: "income-1",
        name: "給与",
        type: "income",
        calculate: () => ({ income: 250000, expense: 0 }),
      };

      calculator.addSource(asset1);
      calculator.addSource(asset2);
      calculator.addSource(income);

      const simulator = createSimulator(
        calculator,
        { simulationMonths: 12 },
        pluginRegistry,
      );

      const result = simulator.simulate();

      expect(
        result.monthlyData[0].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(30000);
      expect(
        result.monthlyData[0].sourceBalances.get("asset")?.get("asset-2"),
      ).toBe(980000);
      expect(
        result.monthlyData[5].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(180000);
      expect(
        result.monthlyData[5].sourceBalances.get("asset")?.get("asset-2"),
      ).toBe(880000);
      expect(
        result.monthlyData[11].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(360000);
      expect(
        result.monthlyData[11].sourceBalances.get("asset")?.get("asset-2"),
      ).toBe(760000);
      expect(
        result.monthlyData[0].sourceBalances.get("asset")?.has("income-1"),
      ).toBe(false);
    });

    it("積立と引き出しが同時に発生する資産の残高が正しく計算される", () => {
      const asset: CalculatorSource = {
        id: "asset-1",
        name: "フレキシブル資産",
        type: "asset",
        calculate: (monthIndex: number) => {
          if (monthIndex < 6) {
            return { income: 0, expense: 50000 };
          } else if (monthIndex >= 6 && monthIndex < 12) {
            return { income: 30000, expense: 50000 };
          } else {
            return { income: 30000, expense: 0 };
          }
        },
        getMetadata: () => ({
          baseAmount: 2000000,
        }),
      };

      calculator.addSource(asset);

      const simulator = createSimulator(
        calculator,
        { simulationMonths: 18 },
        pluginRegistry,
      );

      const result = simulator.simulate();

      expect(
        result.monthlyData[0].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(2050000);
      expect(
        result.monthlyData[5].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(2300000);
      expect(
        result.monthlyData[6].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(2320000);
      expect(
        result.monthlyData[11].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(2420000);
      expect(
        result.monthlyData[12].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(2390000);
      expect(
        result.monthlyData[17].sourceBalances.get("asset")?.get("asset-1"),
      ).toBe(2240000);
    });
  });
});
