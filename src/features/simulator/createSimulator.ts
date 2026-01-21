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

    // 残高マップ（プラグインタイプ -> ソースID -> 残高）
    const sourceBalances = new Map<string, Map<string, number>>();
    const sources = calculator.getSources();

    // 各ソースの初期残高を設定
    sources.forEach((source) => {
      const plugin = pluginRegistry.getPlugin(
        source.type as keyof PluginDataTypeMap,
      );

      if (plugin?.getInitialBalance) {
        const initialBalance = plugin.getInitialBalance(source);
        if (!sourceBalances.has(source.type)) {
          sourceBalances.set(source.type, new Map<string, number>());
        }
        sourceBalances.get(source.type)!.set(source.id, initialBalance);
      }
    });

    // 月ごとのシミュレーションデータを計算
    const monthlyData: MonthlySimulationData[] = [];

    for (let monthIndex = 0; monthIndex < simulationMonths; monthIndex++) {
      // 月のキャッシュフローを集計するためのマップ（IDをキーとする）
      const cashInflows = new Map<string, number>();
      const cashOutflows = new Map<string, number>();

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
          sourceBalances,
          cashInflows,
          cashOutflows,
          allSources: sources,
        };

        plugin?.applyMonthlyEffect?.(context);

        // キャッシュフローの基本集計
        if (cashFlowChange.income > 0) {
          cashInflows.set(sourceId, cashFlowChange.income);
        }
        if (cashFlowChange.expense > 0) {
          cashOutflows.set(sourceId, cashFlowChange.expense);
        }
      });

      // 月末処理（全ソース処理後）
      const postContext: PostMonthlyContext = {
        monthIndex,
        sourceBalances,
        cashInflows,
        cashOutflows,
        allSources: sources,
      };

      // 依存関係順に各プラグインの月末処理を実行
      pluginRegistry.getAllPluginsSorted().forEach((plugin) => {
        plugin.postMonthlyProcess?.(postContext);
      });

      // 現在の残高をコピー
      const monthlySourceBalances = new Map<string, Map<string, number>>();
      sourceBalances.forEach((balanceMap, pluginType) => {
        const copiedMap = new Map<string, number>();
        balanceMap.forEach((balance, sourceId) => {
          copiedMap.set(sourceId, balance);
        });
        monthlySourceBalances.set(pluginType, copiedMap);
      });

      // 月ごとのデータを作成
      monthlyData.push({
        monthIndex,
        cashInflows,
        cashOutflows,
        sourceBalances: monthlySourceBalances,
      });
    }

    // データが存在するかどうかの判定
    const totalMonthlyCashFlow = calculator.calculateTotal(0);
    const hasData = totalMonthlyCashFlow.income > 0 || sourceBalances.size > 0;

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
