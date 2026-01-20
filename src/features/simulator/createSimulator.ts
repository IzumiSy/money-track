import { Calculator, CalculatorSource } from "@/core/calculator";
import { PluginRegistry } from "@/core/plugin/registry";
import {
  MonthlyProcessingContext,
  PostMonthlyContext,
  PluginDataTypeMap,
} from "@/core/plugin/types";
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
 * @param pluginRegistry - プラグインレジストリ
 * @returns Simulatorインスタンス
 */
export function createSimulator(
  calculator: Calculator<CalculatorSource>,
  params: SimulationParams,
  pluginRegistry: PluginRegistry,
): Simulator {
  const { simulationMonths } = params;

  // シミュレーション期間の検証（1ヶ月から1200ヶ月まで）
  if (simulationMonths < 1 || simulationMonths > 1200) {
    throw new Error(
      "シミュレーション期間は1ヶ月から1200ヶ月の間で指定してください",
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

    // 資産・負債の初期残高を設定
    const assetBalances = new Map<string, number>();
    const liabilityBalances = new Map<string, number>();
    const sources = calculator.getSources();

    sources.forEach((source) => {
      const plugin = pluginRegistry.getPlugin(
        source.type as keyof PluginDataTypeMap,
      );

      if (plugin?.getInitialBalance) {
        const initialBalance = plugin.getInitialBalance(source);
        if (source.type === "asset") {
          assetBalances.set(source.id, initialBalance);
        } else if (source.type === "liability") {
          liabilityBalances.set(source.id, initialBalance);
        }
      }
    });

    // 月ごとのシミュレーションデータを計算
    const monthlyData: MonthlySimulationData[] = [];

    for (let monthIndex = 0; monthIndex < simulationMonths; monthIndex++) {
      // 月の収入・支出を集計するためのマップ（IDをキーとする）
      const incomeBreakdown = new Map<string, number>();
      const expenseBreakdown = new Map<string, number>();
      const monthlyAssetBalances = new Map<string, number>();

      // 月のbreakdownを取得して、収入・支出を集計
      const monthlyBreakdown = calculator.getBreakdown(monthIndex);

      // breakdownから全ての収入・支出を集計（キーはsourceId）
      Object.entries(monthlyBreakdown).forEach(([sourceId, cashFlowChange]) => {
        const source = sources.find((s) => s.id === sourceId);
        if (!source) return;

        // プラグインを取得して月次処理を実行
        const plugin = pluginRegistry.getPlugin(
          source.type as keyof PluginDataTypeMap,
        );

        const context: MonthlyProcessingContext = {
          monthIndex,
          source,
          cashFlowChange,
          assetBalances,
          liabilityBalances,
          incomeBreakdown,
          expenseBreakdown,
          allSources: sources,
        };

        plugin?.applyMonthlyEffect?.(context);

        // 収入・支出の基本集計
        if (cashFlowChange.income > 0) {
          incomeBreakdown.set(sourceId, cashFlowChange.income);
        }
        if (cashFlowChange.expense > 0) {
          expenseBreakdown.set(sourceId, cashFlowChange.expense);
        }
      });

      // 月末処理（全ソース処理後）
      const postContext: PostMonthlyContext = {
        monthIndex,
        assetBalances,
        liabilityBalances,
        incomeBreakdown,
        expenseBreakdown,
        allSources: sources,
      };

      // 依存関係順に各プラグインの月末処理を実行
      pluginRegistry.getAllPluginsSorted().forEach((plugin) => {
        plugin.postMonthlyProcess?.(postContext);
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
        incomeBreakdown,
        expenseBreakdown,
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
    monthIndex: number,
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
