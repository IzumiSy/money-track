import { describe, it, expect } from "vitest";
import { calculateFinancialSimulation } from "@/utils/financialSimulation";
import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Income } from "@/contexts/IncomeContext";

// テスト用のヘルパー関数：calculateFinancialSimulation関数を直接呼び出す
function runSimulation(
  assets: FinancialAsset,
  incomes: Income[] = [],
  simulationYears: number = 3
) {
  return calculateFinancialSimulation({
    assets,
    expenses: [],
    incomes,
    simulationYears,
  });
}

describe("useFinancialSimulation - 収入の期間設定テスト", () => {
  it("期間限定の収入が預金に正しく反映される", () => {
    const baseAssets: FinancialAsset = {
      deposits: 1000000, // 初期預金100万円
      investments: [],
    };

    const incomes: Income[] = [
      {
        id: "income1",
        name: "期間限定収入",
        monthlyAmount: 100000, // 月10万円
        color: "#10B981",
        startYear: 0, // 0年目から開始
        startMonth: 1, // 1月から開始
        endYear: 1, // 1年目で終了
        endMonth: 6, // 6月で終了
      },
    ];

    const result = runSimulation(baseAssets, incomes, 3);

    // 0年目: 初期預金のみ
    expect(result.simulationData[0].deposits).toBe(1000000);

    // 1年目: 初期預金 + 0年目の12ヶ月分の収入
    expect(result.simulationData[1].deposits).toBe(1000000 + 100000 * 12);

    // 2年目: 初期預金 + 0年目12ヶ月 + 1年目6ヶ月の収入
    expect(result.simulationData[2].deposits).toBe(1000000 + 100000 * 18);

    // 3年目: 収入終了後なので2年目と同じ
    expect(result.simulationData[3].deposits).toBe(1000000 + 100000 * 18);
  });

  it("startYear/startMonthがundefinedの場合、0年/1月からスタートする", () => {
    const baseAssets: FinancialAsset = {
      deposits: 500000, // 初期預金50万円
      investments: [],
    };

    const incomes: Income[] = [
      {
        id: "income1",
        name: "開始期間未設定収入",
        monthlyAmount: 50000, // 月5万円
        color: "#10B981",
        endYear: 1, // 1年目で終了
        endMonth: 12, // 12月で終了
      },
    ];

    const result = runSimulation(baseAssets, incomes, 3);

    // 0年目: 初期預金のみ
    expect(result.simulationData[0].deposits).toBe(500000);

    // 1年目: 初期預金 + 0年目の12ヶ月分の収入
    expect(result.simulationData[1].deposits).toBe(500000 + 50000 * 12);

    // 2年目: 初期預金 + 0年目12ヶ月 + 1年目12ヶ月の収入
    expect(result.simulationData[2].deposits).toBe(500000 + 50000 * 24);

    // 3年目: 収入終了後なので2年目と同じ
    expect(result.simulationData[3].deposits).toBe(500000 + 50000 * 24);
  });

  it("startYearのみundefinedの場合、0年からスタートする", () => {
    const baseAssets: FinancialAsset = {
      deposits: 300000, // 初期預金30万円
      investments: [],
    };

    const incomes: Income[] = [
      {
        id: "income1",
        name: "開始年未設定収入",
        monthlyAmount: 30000, // 月3万円
        color: "#10B981",
        startMonth: 6, // 6月から開始
        endYear: 0, // 0年目で終了
        endMonth: 12, // 12月で終了
      },
    ];

    const result = runSimulation(baseAssets, incomes, 2);

    // 0年目: 初期預金のみ
    expect(result.simulationData[0].deposits).toBe(300000);

    // 1年目: 初期預金 + 0年目の6月〜12月（7ヶ月分）の収入
    expect(result.simulationData[1].deposits).toBe(300000 + 30000 * 7);

    // 2年目: 収入終了後なので1年目と同じ
    expect(result.simulationData[2].deposits).toBe(300000 + 30000 * 7);
  });

  it("startMonthのみundefinedの場合、1月からスタートする", () => {
    const baseAssets: FinancialAsset = {
      deposits: 200000, // 初期預金20万円
      investments: [],
    };

    const incomes: Income[] = [
      {
        id: "income1",
        name: "開始月未設定収入",
        monthlyAmount: 20000, // 月2万円
        color: "#10B981",
        startYear: 1, // 1年目から開始
        endYear: 1, // 1年目で終了
        endMonth: 6, // 6月で終了
      },
    ];

    const result = runSimulation(baseAssets, incomes, 3);

    // 0年目: 初期預金のみ
    expect(result.simulationData[0].deposits).toBe(200000);

    // 1年目: 初期預金のみ（収入はまだ開始していない）
    expect(result.simulationData[1].deposits).toBe(200000);

    // 2年目: 初期預金 + 1年目の1月〜6月（6ヶ月分）の収入
    expect(result.simulationData[2].deposits).toBe(200000 + 20000 * 6);

    // 3年目: 収入終了後なので2年目と同じ
    expect(result.simulationData[3].deposits).toBe(200000 + 20000 * 6);
  });

  it("期間設定が全くない場合、常に有効な収入として扱われる", () => {
    const baseAssets: FinancialAsset = {
      deposits: 100000, // 初期預金10万円
      investments: [],
    };

    const incomes: Income[] = [
      {
        id: "income1",
        name: "期間設定なし収入",
        monthlyAmount: 40000, // 月4万円
        color: "#10B981",
      },
    ];

    const result = runSimulation(baseAssets, incomes, 3);

    // 0年目: 初期預金のみ
    expect(result.simulationData[0].deposits).toBe(100000);

    // 1年目: 初期預金 + 0年目の12ヶ月分の収入
    expect(result.simulationData[1].deposits).toBe(100000 + 40000 * 12);

    // 2年目: 初期預金 + 0年目12ヶ月 + 1年目12ヶ月の収入
    expect(result.simulationData[2].deposits).toBe(100000 + 40000 * 24);

    // 3年目: 初期預金 + 0年目12ヶ月 + 1年目12ヶ月 + 2年目12ヶ月の収入
    expect(result.simulationData[3].deposits).toBe(100000 + 40000 * 36);
  });
});
