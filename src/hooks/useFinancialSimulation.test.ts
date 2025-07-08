import { describe, it, expect } from "vitest";
import { runFinancialSimulation } from "@/domains/simulation/financialSimulation";
import {
  GroupedIncome,
  GroupedExpense,
  GroupedAsset,
} from "@/domains/group/types";
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
    const result = runFinancialSimulation(defaultAssets, [], [], 5);

    expect(result.hasData).toBe(true);
    expect(result.simulationData).toHaveLength(5);

    // 各年の資産額が初期値と同じであること
    result.simulationData.forEach((data) => {
      expect(data.deposits).toBe(1000000);
      expect(data.total).toBe(1000000);
    });
  });

  it("収入がある場合でも、現金資産は変わらないこと", () => {
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

    // 収入は資産残高に影響しない（積立設定がないため）
    expect(result.simulationData[0].deposits).toBe(1000000);
    expect(result.simulationData[1].deposits).toBe(1000000);
  });

  it("支出がある場合でも、現金資産は変わらないこと", () => {
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

    // 支出は資産残高に影響しない（引き出し設定がないため）
    expect(result.simulationData[0].deposits).toBe(1000000);
    expect(result.simulationData[1].deposits).toBe(1000000);
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

    const result = runFinancialSimulation(assetsWithContribution, [], [], 2);

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 + 12ヶ月分の積立
    expect(result.simulationData[0].deposits).toBe(1000000 + 50000 * 12);
    // 2年目: 1年目の資産 + 12ヶ月分の積立
    expect(result.simulationData[1].deposits).toBe(1000000 + 50000 * 24);
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

    const result = runFinancialSimulation(assetsWithWithdrawal, [], [], 2);

    expect(result.hasData).toBe(true);

    // 1年目: 初期資産 - 12ヶ月分の引き出し
    expect(result.simulationData[0].deposits).toBe(5000000 - 100000 * 12);
    // 2年目: 1年目の資産 - 12ヶ月分の引き出し
    expect(result.simulationData[1].deposits).toBe(5000000 - 100000 * 24);
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

    const result = runFinancialSimulation(multipleAssets, [], [], 1);

    expect(result.hasData).toBe(true);

    // 1年目: (現金100万 + 投資信託50万) + 投資信託積立3万×12ヶ月
    expect(result.simulationData[0].deposits).toBe(1500000 + 30000 * 12);
  });
});
