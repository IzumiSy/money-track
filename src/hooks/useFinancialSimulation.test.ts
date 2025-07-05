import { describe, it, expect } from "vitest";
import { runFinancialSimulation } from "@/domains/simulation/financialSimulation";
import { FinancialAssets } from "@/components/FinancialAssetsForm";
import { GroupedIncome, GroupedExpense } from "@/domains/group/types";
import { Cycle } from "@/domains/shared/Cycle";

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
  const defaultAssets: FinancialAssets = {
    assets: [
      {
        id: "1",
        name: "現金",
        baseAmount: 1000000,
        returnRate: 0,
        color: "#3B82F6",
        contributionOptions: [],
        withdrawalOptions: [],
      },
    ],
  };

  it("初期資産のみの場合、資産額が変わらないこと", () => {
    const result = runFinancialSimulation(defaultAssets, [], [], 5);

    expect(result.hasData).toBe(true);
    expect(result.simulationData).toHaveLength(5);

    // 各年の資産額が初期値と同じであること
    result.simulationData.forEach((data) => {
      expect(data.deposits).toBe(1000000);
      expect(data.total).toBe(1000000);
    });
  });

  it("収入がある場合、資産が増加すること", () => {
    const incomes: GroupedIncome[] = [
      {
        id: "income1",
        groupId: "group1",
        name: "給与",
        cycles: [createMonthlyCycle(100000, 0)], // 月10万円、1年1ヶ月目から
        color: "#10B981",
      },
    ];

    const result = runFinancialSimulation(defaultAssets, [], incomes, 2);

    expect(result.hasData).toBe(true);
    expect(result.simulationData).toHaveLength(2);

    // 1年目: 初期資産 + 12ヶ月分の収入
    expect(result.simulationData[0].deposits).toBe(1000000 + 100000 * 12);
    // 2年目: 1年目の資産 + 12ヶ月分の収入
    expect(result.simulationData[1].deposits).toBe(1000000 + 100000 * 24);
  });

  it("支出がある場合、資産が減少すること", () => {
    const expenses: GroupedExpense[] = [
      {
        id: "expense1",
        groupId: "group1",
        name: "家賃",
        cycles: [createMonthlyCycle(20000, 0)], // 月2万円、1年1ヶ月目から
        color: "#EF4444",
      },
    ];

    const result = runFinancialSimulation(defaultAssets, expenses, [], 2);

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 - 12ヶ月分の支出
    expect(result.simulationData[0].deposits).toBe(1000000 - 20000 * 12);
    // 2年目: 1年目の資産 - 12ヶ月分の支出
    expect(result.simulationData[1].deposits).toBe(1000000 - 20000 * 24);
  });

  it("収入と支出の両方がある場合、正しく計算されること", () => {
    const incomes: GroupedIncome[] = [
      {
        id: "income1",
        groupId: "group1",
        name: "給与",
        cycles: [createMonthlyCycle(40000, 0)], // 月4万円、1年1ヶ月目から
        color: "#10B981",
      },
    ];

    const expenses: GroupedExpense[] = [
      {
        id: "expense1",
        groupId: "group1",
        name: "生活費",
        cycles: [createMonthlyCycle(30000, 0)], // 月3万円、1年1ヶ月目から
        color: "#EF4444",
      },
    ];

    const result = runFinancialSimulation(defaultAssets, expenses, incomes, 2);

    expect(result.hasData).toBe(true);

    // 月間の純キャッシュフロー: 4万円 - 3万円 = 1万円
    const monthlyNetCashFlow = 10000;

    // 1年目: 初期資産 + 12ヶ月分の純キャッシュフロー
    expect(result.simulationData[0].deposits).toBe(
      1000000 + monthlyNetCashFlow * 12
    );
    // 2年目
    expect(result.simulationData[1].deposits).toBe(
      1000000 + monthlyNetCashFlow * 24
    );
  });

  it("年次サイクルの収入が正しく計算されること", () => {
    const incomes: GroupedIncome[] = [
      {
        id: "income1",
        groupId: "group1",
        name: "ボーナス",
        cycles: [
          {
            id: "cycle1",
            type: "yearly",
            amount: 600000, // 年60万円
            startMonthIndex: 5, // 1年6ヶ月目（6月）
          },
        ],
        color: "#10B981",
      },
    ];

    const result = runFinancialSimulation(defaultAssets, [], incomes, 2);

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 + 年1回のボーナス
    expect(result.simulationData[0].deposits).toBe(1000000 + 600000);
    // 2年目: 1年目の資産 + 年1回のボーナス
    expect(result.simulationData[1].deposits).toBe(1000000 + 600000 * 2);
  });

  it("複数のサイクルを持つ収入が正しく計算されること", () => {
    const incomes: GroupedIncome[] = [
      {
        id: "income1",
        groupId: "group1",
        name: "総収入",
        cycles: [
          createMonthlyCycle(50000, 0), // 月5万円の基本給、1年1ヶ月目から
          {
            id: "cycle2",
            type: "yearly",
            amount: 300000, // 年30万円のボーナス（6月）
            startMonthIndex: 5, // 1年6ヶ月目
          },
          {
            id: "cycle3",
            type: "yearly",
            amount: 300000, // 年30万円のボーナス（12月）
            startMonthIndex: 11, // 1年12ヶ月目
          },
        ],
        color: "#10B981",
      },
    ];

    const result = runFinancialSimulation(defaultAssets, [], incomes, 1);

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 + 月給12ヶ月分 + ボーナス2回
    expect(result.simulationData[0].deposits).toBe(
      1000000 + 50000 * 12 + 300000 * 2
    );
  });

  it("カスタムサイクル（3ヶ月ごと）が正しく計算されること", () => {
    const expenses: GroupedExpense[] = [
      {
        id: "expense1",
        groupId: "group1",
        name: "四半期支払い",
        cycles: [
          {
            id: "cycle1",
            type: "custom",
            interval: 3,
            intervalUnit: "month",
            amount: 80000, // 3ヶ月ごとに8万円
            startMonthIndex: 0, // 1年1ヶ月目から
          },
        ],
        color: "#EF4444",
      },
    ];

    const result = runFinancialSimulation(defaultAssets, expenses, [], 1);

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 - 四半期ごとの支払い4回
    expect(result.simulationData[0].deposits).toBe(1000000 - 80000 * 4);
  });
});
