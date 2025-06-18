import { describe, it, expect } from "vitest";
import { calculateFinancialSimulation } from "@/utils/financialSimulation";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Income } from "@/contexts/IncomeContext";
import { YearMonthDuration } from "@/types/YearMonth";

// テスト用のヘルパー関数：calculateFinancialSimulation関数を直接呼び出す
function runSimulation(
  assets: FinancialAsset,
  incomes: Income[] = [],
  simulationYears: number = 3
) {
  const r = calculateFinancialSimulation({
    assets,
    expenses: [],
    incomes,
    simulationYears,
  });

  const deposits = r.simulationData.map((d) => d.deposits);

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
      3
    );

    expect(result.deposits).toEqual([
      1000000 + 100000 * 12, // 1年目: 初期預金 + 0年目の12ヶ月分の収入
      1000000 + 100000 * 18, // 2年目: 初期預金 + 0年目12ヶ月 + 1年目12ヶ月 + 2年目6ヶ月の収入
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
      3
    );

    expect(result.deposits).toEqual([
      200000 + 20000 * 6, // 1年目: 初期預金 + 0年目の1月〜6月（6ヶ月分）の収入
      200000 + 20000 * 6, // 2年目: 初期預金 + 1年目の1月〜6月（6ヶ月分）の収入
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
      3
    );

    expect(result.deposits).toEqual([
      100000 + 40000 * 12, // 1年目: 初期預金 + 0年目の12ヶ月分の収入
      100000 + 40000 * 24, // 2年目: 初期預金 + 0年目12ヶ月 + 1年目12ヶ月の収入
      100000 + 40000 * 36, // 3年目: 初期預金 + 0年目12ヶ月 + 1年目12ヶ月 + 2年目12ヶ月の収入
    ]);
  });
});
