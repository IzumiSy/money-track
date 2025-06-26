import { describe, it, expect } from "vitest";
import { createSimulator } from "./createSimulator";
import { createCalculator } from "@/domains/shared";
import { convertIncomeToIncomeSource } from "@/domains/income/source";
import { convertExpenseToExpenseSource } from "@/domains/expense/source";
import { Income } from "@/contexts/IncomeContext";
import { Expense } from "@/contexts/ExpensesContext";
import { YearMonthDuration } from "@/types/YearMonth";

describe("相対年数でのシミュレーション", () => {
  it("収入の期間設定が正しく反映される", () => {
    const calculator = createCalculator();

    // 1年目から2年目まで（相対年数）の収入
    const income: Income = {
      id: "1",
      name: "期間限定収入",
      monthlyAmount: 100000,
      color: "#10B981",
      startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
      endYearMonth: YearMonthDuration.from(2, 12), // 2年目12月まで
    };

    calculator.addSource(convertIncomeToIncomeSource(income));

    const simulator = createSimulator(calculator, {
      initialDeposits: 0,
      simulationYears: 5,
    });

    const result = simulator.simulate();

    // 1年目: 12ヶ月 × 100,000円 = 1,200,000円
    expect(result.yearlyData[0].incomeBreakdown.get("1")).toBe(1200000);
    expect(result.yearlyData[0].deposits).toBe(1200000);

    // 2年目: 累積24ヶ月 × 100,000円 = 2,400,000円
    expect(result.yearlyData[1].deposits).toBe(2400000);

    // 3年目: 期間外なので収入なし、預金は2,400,000円のまま
    expect(result.yearlyData[2].incomeBreakdown.get("1")).toBeUndefined();
    expect(result.yearlyData[2].deposits).toBe(2400000);

    // 4年目: 期間外なので収入なし
    expect(result.yearlyData[3].incomeBreakdown.get("1")).toBeUndefined();
    expect(result.yearlyData[3].deposits).toBe(2400000);

    // 5年目: 期間外なので収入なし
    expect(result.yearlyData[4].incomeBreakdown.get("1")).toBeUndefined();
    expect(result.yearlyData[4].deposits).toBe(2400000);
  });

  it("支出の期間設定が正しく反映される", () => {
    const calculator = createCalculator();

    // 2年目から3年目まで（相対年数）の支出
    const expense: Expense = {
      id: "1",
      name: "期間限定支出",
      monthlyAmount: 50000,
      color: "#EF4444",
      startYearMonth: YearMonthDuration.from(2, 1), // 2年目1月から
      endYearMonth: YearMonthDuration.from(3, 12), // 3年目12月まで
    };

    calculator.addSource(convertExpenseToExpenseSource(expense));

    const simulator = createSimulator(calculator, {
      initialDeposits: 1000000,
      simulationYears: 5,
    });

    const result = simulator.simulate();

    // 1年目: 支出なし
    expect(result.yearlyData[0].expenseBreakdown.get("1")).toBeUndefined();
    expect(result.yearlyData[0].deposits).toBe(1000000);

    // 2年目: 12ヶ月 × 50,000円 = 600,000円の支出
    // 累積支出: 600,000円
    expect(result.yearlyData[1].deposits).toBe(400000); // 1,000,000 - 600,000

    // 3年目: さらに12ヶ月 × 50,000円 = 600,000円の支出
    // 累積支出: 1,200,000円
    expect(result.yearlyData[2].deposits).toBe(0); // 1,000,000 - 1,200,000 = -200,000 → 0

    // 4年目: 期間外なので支出なし
    expect(result.yearlyData[3].expenseBreakdown.get("1")).toBeUndefined();
    expect(result.yearlyData[3].deposits).toBe(0);

    // 5年目: 期間外なので支出なし
    expect(result.yearlyData[4].expenseBreakdown.get("1")).toBeUndefined();
    expect(result.yearlyData[4].deposits).toBe(0);
  });

  it("収入と支出の期間設定が組み合わさって正しく動作する", () => {
    const calculator = createCalculator();

    // 1年目から3年目までの収入
    const income: Income = {
      id: "income-1",
      name: "給与",
      monthlyAmount: 200000,
      color: "#10B981",
      startYearMonth: YearMonthDuration.from(1, 1),
      endYearMonth: YearMonthDuration.from(3, 12),
    };

    // 2年目から4年目までの支出
    const expense: Expense = {
      id: "expense-1",
      name: "家賃",
      monthlyAmount: 100000,
      color: "#EF4444",
      startYearMonth: YearMonthDuration.from(2, 1),
      endYearMonth: YearMonthDuration.from(4, 12),
    };

    calculator.addSource(convertIncomeToIncomeSource(income));
    calculator.addSource(convertExpenseToExpenseSource(expense));

    const simulator = createSimulator(calculator, {
      initialDeposits: 500000,
      simulationYears: 5,
    });

    const result = simulator.simulate();

    // 1年目: 収入のみ（200,000 × 12 = 2,400,000）
    expect(result.yearlyData[0].deposits).toBe(2900000); // 500,000 + 2,400,000

    // 2年目: 収入と支出（収入: 2,400,000、支出: 1,200,000）
    // 累積: 500,000 + 4,800,000 - 1,200,000 = 4,100,000
    expect(result.yearlyData[1].deposits).toBe(4100000);

    // 3年目: 収入と支出（収入: 2,400,000、支出: 1,200,000）
    // 累積: 500,000 + 7,200,000 - 2,400,000 = 5,300,000
    expect(result.yearlyData[2].deposits).toBe(5300000);

    // 4年目: 支出のみ（支出: 1,200,000）
    // 累積: 500,000 + 7,200,000 - 3,600,000 = 4,100,000
    expect(result.yearlyData[3].deposits).toBe(4100000);

    // 5年目: 収入も支出もなし
    expect(result.yearlyData[4].deposits).toBe(4100000);
  });

  it("サイクル設定と期間設定が組み合わさって正しく動作する", () => {
    const calculator = createCalculator();

    // 1年目から3年目まで、3ヶ月ごとの収入
    const income: Income = {
      id: "1",
      name: "ボーナス",
      monthlyAmount: 300000,
      color: "#10B981",
      startYearMonth: YearMonthDuration.from(1, 1),
      endYearMonth: YearMonthDuration.from(3, 12),
      cycleSetting: {
        enabled: true,
        interval: 3,
        unit: "month",
      },
    };

    calculator.addSource(convertIncomeToIncomeSource(income));

    const simulator = createSimulator(calculator, {
      initialDeposits: 0,
      simulationYears: 5,
    });

    const result = simulator.simulate();

    // 1年目: 1,4,7,10月に収入（4回 × 300,000 = 1,200,000）
    expect(result.yearlyData[0].incomeBreakdown.get("1")).toBe(1200000);

    // 2年目: 1,4,7,10月に収入（累積8回 × 300,000 = 2,400,000）
    expect(result.yearlyData[1].deposits).toBe(2400000);

    // 3年目: 1,4,7,10月に収入（累積12回 × 300,000 = 3,600,000）
    expect(result.yearlyData[2].deposits).toBe(3600000);

    // 4年目: 期間外なので収入なし
    expect(result.yearlyData[3].incomeBreakdown.get("1")).toBeUndefined();
    expect(result.yearlyData[3].deposits).toBe(3600000);
  });
});
