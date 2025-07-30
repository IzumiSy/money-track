import { Calculator, CalculatorSource } from "@/domains/shared";
import {
  SimulationParams,
  Simulator,
  SimulationResult,
  MonthlySimulationData,
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
  const { simulationMonths } = params;

  // シミュレーション期間の検証（1ヶ月から1200ヶ月まで）
  if (simulationMonths < 1 || simulationMonths > 1200) {
    throw new Error(
      "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください"
    );
  }

  /**
   * 現在の月次キャッシュフローを計算
   * 月インデックス0（現在月）のキャッシュフローを返す
   */
  const getCurrentMonthlyCashFlow = () => {
    const totalMonthlyCashFlow = calculator.calculateTotal(0);

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

    // 資産の初期残高を設定
    const assetBalances = new Map<string, number>();
    const liabilityBalances = new Map<string, number>();
    const sources = calculator.getSources();

    sources.forEach((source) => {
      if (source.type === "asset") {
        const metadata = source.getMetadata?.();
        const baseAmount = (metadata?.baseAmount as number) || 0;
        assetBalances.set(source.id, baseAmount);
      }
      if (source.type === "liability") {
        const metadata = source.getMetadata?.();
        const principal = (metadata?.principal as number) || 0;
        liabilityBalances.set(source.id, principal);
      }
    });

    // 月ごとのシミュレーションデータを計算
    const monthlyData: MonthlySimulationData[] = [];

    for (let monthIndex = 0; monthIndex < simulationMonths; monthIndex++) {
      // 月の収入・支出を集計するためのマップ（IDをキーとする）
      const monthlyIncomeMap = new Map<string, number>();
      const monthlyExpenseMap = new Map<string, number>();
      const monthlyAssetBalances = new Map<string, number>();

      // 月のbreakdownを取得して、収入・支出を集計
      const monthlyBreakdown = calculator.getBreakdown(monthIndex);

      // breakdownから全ての収入・支出を集計（キーはsourceId）
      Object.entries(monthlyBreakdown).forEach(([sourceId, cashFlowChange]) => {
        const source = sources.find((s) => s.id === sourceId);

        if (cashFlowChange.income > 0) {
          monthlyIncomeMap.set(sourceId, cashFlowChange.income);
        }
        if (cashFlowChange.expense > 0) {
          monthlyExpenseMap.set(sourceId, cashFlowChange.expense);
        }

        // 資産タイプの場合、残高を更新
        if (source?.type === "asset") {
          const currentBalance = assetBalances.get(sourceId) || 0;
          // 積立（expense）で残高増加、引き出し（income）で残高減少
          const newBalance =
            currentBalance + cashFlowChange.expense - cashFlowChange.income;
          assetBalances.set(sourceId, newBalance);
        }

        // 収入タイプの場合、対象資産の残高を増加
        if (source?.type === "income") {
          const metadata = source.getMetadata?.();
          const assetSourceId = metadata?.assetSourceId as string | undefined;
          if (assetSourceId) {
            const currentBalance = assetBalances.get(assetSourceId) || 0;
            const newBalance = currentBalance + cashFlowChange.income;
            assetBalances.set(assetSourceId, newBalance);
          }
        }

        // 支出タイプの場合、対象資産の残高を減少
        if (source?.type === "expense") {
          const metadata = source.getMetadata?.();
          const assetSourceId = metadata?.assetSourceId as string | undefined;
          if (assetSourceId) {
            const currentBalance = assetBalances.get(assetSourceId) || 0;
            const newBalance = currentBalance - cashFlowChange.expense;
            assetBalances.set(assetSourceId, newBalance);
          }
        }
        // 負債タイプの場合、残高を更新（返済額分だけ減少）
        if (source?.type === "liability") {
          const currentBalance = liabilityBalances.get(sourceId) ?? 0;
          // expense: 返済額
          const newBalance = Math.max(
            0,
            currentBalance - cashFlowChange.expense
          );
          liabilityBalances.set(sourceId, newBalance);
        }
      });

      // 資産リターン（利息）を計算し、残高とincomeBreakdownに反映
      sources.forEach((source) => {
        if (source.type === "asset") {
          const currentBalanceNum: number = Number(
            assetBalances.get(source.id) ?? 0
          );
          const metadata = source.getMetadata?.();
          const returnRate: number = Number(metadata?.returnRate ?? 0);
          if (returnRate !== 0) {
            const interest = currentBalanceNum * (returnRate / 12);
            // 残高に加算
            assetBalances.set(source.id, currentBalanceNum + interest);
            // incomeBreakdownに「return_income_{assetId}」として加算
            const returnIncomeKey = `return_income_${source.id}`;
            const prev = monthlyIncomeMap.get(returnIncomeKey) || 0;
            monthlyIncomeMap.set(returnIncomeKey, prev + interest);
          }
        }
      });

      // 現在の資産残高をコピー
      assetBalances.forEach((balance, assetId) => {
        monthlyAssetBalances.set(assetId, balance);
      });

      // 現在の負債残高をコピー
      const monthlyLiabilityBalances = new Map<string, number>();
      liabilityBalances.forEach((balance, liabilityId) => {
        monthlyLiabilityBalances.set(liabilityId, balance);
      });

      // 月ごとのデータを作成
      monthlyData.push({
        monthIndex,
        incomeBreakdown: monthlyIncomeMap,
        expenseBreakdown: monthlyExpenseMap,
        assetBalances: monthlyAssetBalances,
        liabilityBalances: monthlyLiabilityBalances,
      });
    }

    // データが存在するかどうかの判定
    const totalMonthlyCashFlow = calculator.calculateTotal(0);
    const hasData = totalMonthlyCashFlow.income > 0 || assetBalances.size > 0;

    return {
      monthlyData,
      currentMonthlyCashFlow,
      hasData,
    };
  };

  /**
   * 特定の月の予測データを取得
   */
  const getMonthlyProjection = (
    monthIndex: number
  ): MonthlySimulationData | undefined => {
    if (monthIndex < 0 || monthIndex >= simulationMonths) {
      return undefined;
    }

    // シミュレーションを実行して特定の月のデータを返す
    const result = simulate();
    return result.monthlyData[monthIndex];
  };

  return {
    simulate,
    getMonthlyProjection,
    getCurrentMonthlyCashFlow,
  };
}
