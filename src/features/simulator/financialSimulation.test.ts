import { describe, it, expect, beforeAll } from "vitest";
import { runFinancialSimulation } from "./financialSimulation";
import {
  GroupedIncome,
  GroupedExpense,
  GroupedAsset,
} from "@/features/group/types";
import { Cycle } from "@/core/calculator/Cycle";
import { createPluginRegistry, PluginRegistry } from "@/core/plugin/registry";
import { AssetPlugin } from "@/features/asset/plugin";
import { IncomePlugin } from "@/features/income/plugin";
import { ExpensePlugin } from "@/features/expense/plugin";
import { LiabilityPlugin } from "@/features/liability/plugin";
import { PluginDataStore } from "./types";

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

/**
 * テスト用のPluginDataStoreを作成するヘルパー
 */
function createPluginDataStore(
  assets: GroupedAsset[] = [],
  incomes: GroupedIncome[] = [],
  expenses: GroupedExpense[] = [],
  liabilities: GroupedAsset[] = [],
): PluginDataStore {
  return {
    asset: assets,
    income: incomes,
    expense: expenses,
    liability: liabilities as unknown as PluginDataStore["liability"],
  };
}

// テスト用プラグインレジストリ
let pluginRegistry: PluginRegistry;

beforeAll(() => {
  pluginRegistry = createTestPluginRegistry();
});

// Helper function to create a monthly cycle
function createMonthlyCycle(amount: number, startMonthIndex: number): Cycle {
  return {
    id: Date.now().toString() + Math.random(),
    type: "monthly",
    amount,
    startMonthIndex,
  };
}

describe("runFinancialSimulation", () => {
  const defaultAssets: GroupedAsset[] = [
    {
      id: "1",
      groupId: "group1",
      name: "現金",
      baseAmount: 1000000,
      returnRate: 0,
      color: "#3B82F6",
      contributionOptions: [],
      withdrawalOptions: [],
    },
  ];

  it("初期資産のみの場合、資産額が変わらないこと", () => {
    const pluginData = createPluginDataStore(defaultAssets);
    const result = runFinancialSimulation(
      pluginData,
      5,
      undefined,
      pluginRegistry,
    );

    expect(result.hasData).toBe(true);
    expect(result.simulationData).toHaveLength(5);

    // 各年の資産額が初期値と同じであること
    result.simulationData.forEach((data) => {
      expect(data.balance_asset_1).toBe(1000000);
    });
  });

  it("収入がある場合、対象資産が増加すること", () => {
    const incomes: GroupedIncome[] = [
      {
        id: "income1",
        groupId: "group1",
        name: "給与",
        cycles: [createMonthlyCycle(100000, 0)], // 月10万円、1年1ヶ月目から
        color: "#10B981",
        assetSourceId: "1", // 現金資産に紐付け
      },
    ];

    const pluginData = createPluginDataStore(defaultAssets, incomes);
    const result = runFinancialSimulation(
      pluginData,
      2,
      undefined,
      pluginRegistry,
    );

    expect(result.hasData).toBe(true);
    expect(result.simulationData).toHaveLength(2);

    // 収入により資産残高が増加する
    expect(result.simulationData[0].balance_asset_1).toBe(
      1000000 + 100000 * 12,
    ); // 初期資産 + 月10万円×12ヶ月
    expect(result.simulationData[1].balance_asset_1).toBe(
      1000000 + 100000 * 24,
    ); // 初期資産 + 月10万円×24ヶ月
  });

  it("支出がある場合、対象資産が減少すること", () => {
    const expenses: GroupedExpense[] = [
      {
        id: "expense1",
        groupId: "group1",
        name: "家賃",
        cycles: [createMonthlyCycle(20000, 0)], // 月2万円、1年1ヶ月目から
        color: "#EF4444",
        assetSourceId: "1", // 現金資産に紐付け
      },
    ];

    const pluginData = createPluginDataStore(defaultAssets, [], expenses);
    const result = runFinancialSimulation(
      pluginData,
      2,
      undefined,
      pluginRegistry,
    );

    expect(result.hasData).toBe(true);

    // 支出により資産残高が減少する
    expect(result.simulationData[0].balance_asset_1).toBe(1000000 - 20000 * 12); // 初期資産 - 月2万円×12ヶ月
    expect(result.simulationData[1].balance_asset_1).toBe(1000000 - 20000 * 24); // 初期資産 - 月2万円×24ヶ月
  });

  it("資産の積立がある場合、資産が増加すること", () => {
    const assetsWithContribution: GroupedAsset[] = [
      {
        id: "1",
        groupId: "group1",
        name: "投資信託",
        baseAmount: 1000000,
        returnRate: 0,
        color: "#3B82F6",
        contributionOptions: [
          {
            id: "contrib1",
            startYear: 0,
            startMonth: 1,
            endYear: 2,
            endMonth: 12,
            monthlyAmount: 50000, // 月5万円積立
          },
        ],
        withdrawalOptions: [],
      },
    ];

    const pluginData = createPluginDataStore(assetsWithContribution);
    const result = runFinancialSimulation(
      pluginData,
      2,
      undefined,
      pluginRegistry,
    );

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 + 12ヶ月分の積立
    expect(result.simulationData[0].balance_asset_1).toBe(1000000 + 50000 * 12);
    // 2年目: 1年目の資産 + 12ヶ月分の積立
    expect(result.simulationData[1].balance_asset_1).toBe(1000000 + 50000 * 24);
  });

  it("資産の引き出しがある場合、資産が減少すること", () => {
    const assetsWithWithdrawal: GroupedAsset[] = [
      {
        id: "1",
        groupId: "group1",
        name: "退職金",
        baseAmount: 5000000,
        returnRate: 0,
        color: "#3B82F6",
        contributionOptions: [],
        withdrawalOptions: [
          {
            id: "withdraw1",
            startYear: 0,
            startMonth: 1,
            endYear: 2,
            endMonth: 12,
            monthlyAmount: 100000, // 月10万円引き出し
          },
        ],
      },
    ];

    const pluginData = createPluginDataStore(assetsWithWithdrawal);
    const result = runFinancialSimulation(
      pluginData,
      2,
      undefined,
      pluginRegistry,
    );

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 - 12ヶ月分の引き出し
    expect(result.simulationData[0].balance_asset_1).toBe(
      5000000 - 100000 * 12,
    );
    // 2年目: 1年目の資産 - 12ヶ月分の引き出し
    expect(result.simulationData[1].balance_asset_1).toBe(
      5000000 - 100000 * 24,
    );
  });

  it("複数の資産がある場合、合計が正しく計算されること", () => {
    const multipleAssets: GroupedAsset[] = [
      {
        id: "1",
        groupId: "group1",
        name: "現金",
        baseAmount: 1000000,
        returnRate: 0,
        color: "#3B82F6",
        contributionOptions: [],
        withdrawalOptions: [],
      },
      {
        id: "2",
        groupId: "group1",
        name: "投資信託",
        baseAmount: 500000,
        returnRate: 0,
        color: "#10B981",
        contributionOptions: [
          {
            id: "contrib1",
            startYear: 0,
            startMonth: 1,
            endYear: 1,
            endMonth: 12,
            monthlyAmount: 30000, // 月3万円積立
          },
        ],
        withdrawalOptions: [],
      },
    ];

    const pluginData = createPluginDataStore(multipleAssets);
    const result = runFinancialSimulation(
      pluginData,
      1,
      undefined,
      pluginRegistry,
    );

    expect(result.hasData).toBe(true);

    // 1年目: 現金100万はそのまま、投資信託は50万 + 積立3万×12ヶ月
    expect(result.simulationData[0].balance_asset_1).toBe(1000000);
    expect(result.simulationData[0].balance_asset_2).toBe(500000 + 30000 * 12);
  });
});
