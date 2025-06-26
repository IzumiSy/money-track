import { Calculator, CalculatorSource } from "@/domains/shared";
import {
  SimulationParams,
  Simulator,
  SimulationResult,
  YearlySimulationData,
} from "./types";

/**
 * 財務シミュレーターを作成する
 * @param calculator - 収入・支出の計算を行うCalculatorインスタンス
 * @param params - シミュレーションパラメータ
 * @returns Simulatorインスタンス
 */
export function createSimulator(
  calculator: Calculator<CalculatorSource>,
  params: SimulationParams
): Simulator {
  const { initialDeposits, simulationYears } = params;

  // シミュレーション期間の検証（1年から100年まで）
  if (simulationYears < 1 || simulationYears > 100) {
    throw new Error("シミュレーション期間は1年から100年の間で指定してください");
  }

  /**
   * 現在の月次キャッシュフローを計算
   */
  const getCurrentMonthlyCashFlow = () => {
    const currentDate = new Date();
    const totalMonthlyCashFlow = calculator.calculateTotal(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );

    return {
      income: totalMonthlyCashFlow.income,
      expense: totalMonthlyCashFlow.expense,
      net: totalMonthlyCashFlow.income - totalMonthlyCashFlow.expense,
    };
  };

  /**
   * 完全なシミュレーションを実行
   */
  const simulate = (): SimulationResult => {
    // 月額のキャッシュフローを計算（現在時点での有効な収入・支出）
    const currentMonthlyCashFlow = getCurrentMonthlyCashFlow();

    // 現在の年を基準年として取得
    const currentYear = new Date().getFullYear();

    // 年ごとのシミュレーションデータを計算
    const yearlyData: YearlySimulationData[] = [];

    // 累積キャッシュフローを事前に計算
    const cumulativeCashFlows: number[] = [];

    for (let targetYear = 1; targetYear <= simulationYears; targetYear++) {
      let totalCashFlow = 0;

      // 1年目からtargetYear年目までの全ての月のキャッシュフローを累積
      for (let year = 1; year <= targetYear; year++) {
        for (let month = 1; month <= 12; month++) {
          // 相対年数を絶対年に変換（既存データとの互換性のため）
          const absoluteYear = currentYear + year - 1;
          const monthlyCashFlow = calculator.calculateTotal(
            absoluteYear,
            month
          );
          // 投資は無視するため、収入から支出を引くだけ
          totalCashFlow += monthlyCashFlow.income - monthlyCashFlow.expense;
        }
      }

      cumulativeCashFlows.push(totalCashFlow);
    }

    for (let year = 1; year <= simulationYears; year++) {
      const cumulativeCashFlow = cumulativeCashFlows[year - 1];

      // 調整済み預金額（基本預金 + 純キャッシュフロー）
      const adjustedDeposits = Math.max(
        0,
        initialDeposits + cumulativeCashFlow
      );

      // 年間の収入・支出を集計するためのマップ（IDをキーとする）
      const yearlyIncomeMap = new Map<string, number>();
      const yearlyExpenseMap = new Map<string, number>();

      // 各月のbreakdownを一度だけ取得して、収入・支出を集計
      for (let month = 1; month <= 12; month++) {
        // 相対年数を絶対年に変換
        const absoluteYear = currentYear + year - 1;
        const monthlyBreakdown = calculator.getBreakdown(absoluteYear, month);
        // breakdownから全ての収入・支出を集計（キーはsourceId）
        Object.entries(monthlyBreakdown).forEach(
          ([sourceId, cashFlowChange]) => {
            if (cashFlowChange.income > 0) {
              const currentIncome = yearlyIncomeMap.get(sourceId) || 0;
              yearlyIncomeMap.set(
                sourceId,
                currentIncome + cashFlowChange.income
              );
            }
            if (cashFlowChange.expense > 0) {
              const currentExpense = yearlyExpenseMap.get(sourceId) || 0;
              yearlyExpenseMap.set(
                sourceId,
                currentExpense + cashFlowChange.expense
              );
            }
          }
        );
      }

      // 年ごとのデータを作成
      yearlyData.push({
        year,
        deposits: Math.round(adjustedDeposits),
        incomeBreakdown: yearlyIncomeMap,
        expenseBreakdown: yearlyExpenseMap,
      });
    }

    // データが存在するかどうかの判定
    const currentDate = new Date();
    const totalMonthlyCashFlow = calculator.calculateTotal(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );
    const hasData = initialDeposits > 0 || totalMonthlyCashFlow.income > 0;

    return {
      yearlyData,
      currentMonthlyCashFlow,
      hasData,
    };
  };

  /**
   * 特定の年の予測データを取得
   */
  const getYearlyProjection = (
    year: number
  ): YearlySimulationData | undefined => {
    if (year < 1 || year > simulationYears) {
      return undefined;
    }

    // シミュレーションを実行して特定の年のデータを返す
    const result = simulate();
    return result.yearlyData[year - 1];
  };

  return {
    simulate,
    getYearlyProjection,
    getCurrentMonthlyCashFlow,
  };
}
