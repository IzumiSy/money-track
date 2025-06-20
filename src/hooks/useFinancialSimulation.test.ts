import { describe, it, expect } from "vitest";
import { createCalculator, CalculatorSource } from "@/domains/shared";
import { createSimulator } from "@/domains/simulation";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Income } from "@/contexts/IncomeContext";
import { Expense } from "@/contexts/ExpensesContext";
import { YearMonthDuration } from "@/types/YearMonth";
import { convertExpenseToExpenseSource } from "@/domains/expense/source";
import { convertIncomeToIncomeSource } from "@/domains/income/source";

// テスト用のヘルパー関数：calculateFinancialSimulation関数を直接呼び出す
function runSimulation(
  assets: FinancialAsset,
  incomes: Income[] = [],
  expenses: Expense[] = [],
  simulationYears: number = 3
) {
  // 統合されたCalculatorインスタンスを作成
  const unifiedCalculator = createCalculator<CalculatorSource>();

  // Income[]をIncomeSourceに変換してCalculatorに追加
  incomes.forEach((income) => {
    unifiedCalculator.addSource(convertIncomeToIncomeSource(income));
  });

  // Expense[]をExpenseSourceに変換してCalculatorに追加
  expenses.forEach((expense) => {
    unifiedCalculator.addSource(convertExpenseToExpenseSource(expense));
  });

  const simulator = createSimulator(unifiedCalculator, {
    initialDeposits: assets.deposits,
    simulationYears,
  });

  const result = simulator.simulate();
  const deposits = result.yearlyData.map((d) => d.deposits);

  return {
    deposits,
  };
}

describe("useFinancialSimulation - 収入の期間設定テスト", () => {
  it("期間限定の収入が預金に正しく反映される", () => {
    const result = runSimulation(
      {
        deposits: 1000000, // 初期預金100万円
        investments: [],
      },
      [
        {
          id: "income1",
          name: "期間限定収入",
          monthlyAmount: 100000, // 月10万円
          color: "#10B981",
          startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から開始
          endYearMonth: YearMonthDuration.from(2, 6), // 2年目6月で終了
        },
      ],
      [],
      3
    );

    expect(result.deposits).toEqual([
      1000000 + 100000 * 12, // 1年目: 初期預金 + 1年目の12ヶ月分の収入
      1000000 + 100000 * 18, // 2年目: 初期預金 + 1年目12ヶ月 + 2年目6ヶ月の収入
      1000000 + 100000 * 18, // 3年目: 収入終了後なので2年目と同じ
    ]);
  });

  it("1年目から開始して同年内で終了する収入", () => {
    const result = runSimulation(
      {
        deposits: 200000, // 初期預金20万円
        investments: [],
      },
      [
        {
          id: "income1",
          name: "1年目限定収入",
          monthlyAmount: 20000, // 月2万円
          color: "#10B981",
          startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から開始
          endYearMonth: YearMonthDuration.from(1, 6), // 1年目6月で終了
        },
      ],
      [],
      3
    );

    expect(result.deposits).toEqual([
      200000 + 20000 * 6, // 1年目: 初期預金 + 1年目の1月〜6月（6ヶ月分）の収入
      200000 + 20000 * 6, // 2年目: 収入終了後なので1年目と同じ
      200000 + 20000 * 6, // 3年目: 収入終了後なので2年目と同じ
    ]);
  });

  it("期間設定が全くない場合、常に有効な収入として扱われる", () => {
    const result = runSimulation(
      {
        deposits: 100000, // 初期預金10万円
        investments: [],
      },
      [
        {
          id: "income1",
          name: "期間設定なし収入",
          monthlyAmount: 40000, // 月4万円
          color: "#10B981",
        },
      ],
      [],
      3
    );

    expect(result.deposits).toEqual([
      100000 + 40000 * 12, // 1年目: 初期預金 + 1年目の12ヶ月分の収入
      100000 + 40000 * 24, // 2年目: 初期預金 + 1年目12ヶ月 + 2年目12ヶ月の収入
      100000 + 40000 * 36, // 3年目: 初期預金 + 1年目12ヶ月 + 2年目12ヶ月 + 3年目12ヶ月の収入
    ]);
  });

  it("支出がある場合の収入と支出の相殺", () => {
    const result = runSimulation(
      {
        deposits: 500000, // 初期預金50万円
        investments: [],
      },
      [
        {
          id: "income1",
          name: "給与収入",
          monthlyAmount: 50000, // 月5万円
          color: "#10B981",
        },
      ],
      [
        {
          id: "expense1",
          name: "生活費",
          monthlyAmount: 30000, // 月3万円
          color: "#EF4444",
        },
      ],
      3
    );

    const netMonthly = 50000 - 30000; // 月2万円の純収入
    expect(result.deposits).toEqual([
      500000 + netMonthly * 12, // 1年目: 初期預金 + 1年目の純収入
      500000 + netMonthly * 24, // 2年目: 初期預金 + 1年目と2年目の純収入
      500000 + netMonthly * 36, // 3年目: 初期預金 + 1年目〜3年目の純収入
    ]);
  });

  it("期間限定の収入と支出の組み合わせ", () => {
    const result = runSimulation(
      {
        deposits: 300000, // 初期預金30万円
        investments: [],
      },
      [
        {
          id: "income1",
          name: "期間限定収入",
          monthlyAmount: 80000, // 月8万円
          color: "#10B981",
          startYearMonth: YearMonthDuration.from(1, 1),
          endYearMonth: YearMonthDuration.from(2, 12), // 2年目末まで
        },
      ],
      [
        {
          id: "expense1",
          name: "期間限定支出",
          monthlyAmount: 20000, // 月2万円
          color: "#EF4444",
          startYearMonth: YearMonthDuration.from(1, 7), // 1年目7月から
          endYearMonth: YearMonthDuration.from(3, 6), // 3年目6月まで
        },
      ],
      3
    );

    expect(result.deposits).toEqual([
      300000 + 80000 * 6 + (80000 - 20000) * 6, // 1年目: 初期預金 + 1-6月収入のみ + 7-12月収入-支出
      300000 + 80000 * 6 + (80000 - 20000) * 6 + (80000 - 20000) * 12, // 2年目: 1年目まで + 2年目の収入-支出
      300000 +
        80000 * 6 +
        (80000 - 20000) * 6 +
        (80000 - 20000) * 12 +
        -20000 * 6, // 3年目: 2年目まで + 3年目1-6月の支出のみ
    ]);
  });
});
