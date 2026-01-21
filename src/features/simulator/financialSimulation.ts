import { createCalculator } from "@/core/calculator/createCalculator";
import { CalculatorSource } from "@/core/calculator/CalculatorSource";
import { createSimulator } from "./createSimulator";
import { PluginRegistry } from "@/core/plugin/registry";
import { globalRegistry } from "@/core/plugin/defaultRegistry";
import { PluginDataStore } from "./types";

// チャート用のデータポイント型
interface SimulationDataPoint {
  year: string;
  [key: string]: string | number; // 動的なキー
}

// チャート用の結果型
interface ChartSimulationResult {
  simulationData: SimulationDataPoint[];
  finalYearData: SimulationDataPoint;
  hasData: boolean;
  netMonthlyCashFlow: number;
  totalBaseAmount: number;
  initialTotal: number;
}

/**
 * 計算結果をチャート用のデータ形式に変換する関数
 * プラグイン固有の知識を持たず、シミュレーション結果のMapをそのままチャートデータに変換
 */
function convertToChartData(
  simulationResult: ReturnType<ReturnType<typeof createSimulator>["simulate"]>,
): ChartSimulationResult {
  const { monthlyData, currentMonthlyCashFlow, hasData } = simulationResult;

  // 月次データを年次データに集約してチャート用のデータ形式に変換
  const yearlyAggregatedData: SimulationDataPoint[] = [];

  // 12ヶ月ごとに集約
  for (let year = 0; year < Math.ceil(monthlyData.length / 12); year++) {
    const yearMonths = monthlyData.slice(year * 12, (year + 1) * 12);
    const lastMonth = yearMonths[yearMonths.length - 1];

    if (!lastMonth) continue;

    const chartData: SimulationDataPoint = {
      year: `${year + 1}年目`,
    };

    // 各プラグインタイプの残高を追加
    // キー形式: balance_{pluginType}_{sourceId}
    // 負債は負の値として表示
    lastMonth.sourceBalances.forEach((balanceMap, pluginType) => {
      balanceMap.forEach((balance, sourceId) => {
        const isNegative = pluginType === "liability";
        chartData[`balance_${pluginType}_${sourceId}`] = isNegative
          ? -Math.round(balance)
          : Math.round(balance);
      });
    });

    // 年間のキャッシュフローを集計
    const yearlyCashInflows = new Map<string, number>();
    const yearlyCashOutflows = new Map<string, number>();

    yearMonths.forEach((monthData) => {
      // キャッシュインの集計
      monthData.cashInflows.forEach((amount, key) => {
        const current = yearlyCashInflows.get(key) || 0;
        yearlyCashInflows.set(key, current + amount);
      });

      // キャッシュアウトの集計
      monthData.cashOutflows.forEach((amount, key) => {
        const current = yearlyCashOutflows.get(key) || 0;
        yearlyCashOutflows.set(key, current + amount);
      });
    });

    // キャッシュインをチャートデータに追加（プレフィックス: income_）
    yearlyCashInflows.forEach((amount, key) => {
      if (amount > 0) {
        chartData[`income_${key}`] = Math.round(amount);
      }
    });

    // キャッシュアウトをチャートデータに追加（プレフィックス: expense_、マイナス値）
    yearlyCashOutflows.forEach((amount, key) => {
      if (amount > 0) {
        chartData[`expense_${key}`] = -Math.round(amount);
      }
    });

    yearlyAggregatedData.push(chartData);
  }

  // 最終年のデータ
  const finalYearData = yearlyAggregatedData[
    yearlyAggregatedData.length - 1
  ] || {
    year: "0年目",
  };

  return {
    simulationData: yearlyAggregatedData,
    finalYearData,
    hasData,
    netMonthlyCashFlow: currentMonthlyCashFlow.net,
    totalBaseAmount: 0, // 投資は無視するため0
    initialTotal: (() => {
      if (!monthlyData[0]) return 0;
      let total = 0;
      // asset タイプの残高のみを初期総額として集計
      const assetBalances = monthlyData[0].sourceBalances.get("asset");
      assetBalances?.forEach((balance) => {
        total += balance;
      });
      return total;
    })(),
  };
}

/**
 * 財務シミュレーションを実行する純粋関数
 * プラグインレジストリを使用してデータをソースに変換
 *
 * @param pluginData 全プラグインのデータを含むストア
 * @param simulationYears シミュレーション年数
 * @param activeGroupIds アクティブなグループIDのリスト（指定時はフィルタリング実行）
 * @param pluginRegistry プラグインレジストリ（省略時はグローバルレジストリを使用）
 */
export function runFinancialSimulation(
  pluginData: PluginDataStore,
  simulationYears: number,
  activeGroupIds?: string[],
  pluginRegistry: PluginRegistry = globalRegistry,
): ChartSimulationResult {
  // 統合されたCalculatorインスタンスを作成
  const unifiedCalculator = createCalculator<CalculatorSource>();

  // 各プラグインを使用してソースを作成・追加
  pluginRegistry.getAllPluginsSorted().forEach((plugin) => {
    const dataArray = pluginData[plugin.type];
    if (!dataArray) return;

    dataArray.forEach((data) => {
      // activeGroupIdsによるフィルタリング
      if (activeGroupIds && plugin.getGroupId) {
        const groupId = plugin.getGroupId(data);
        if (!activeGroupIds.includes(groupId)) return;
      }

      // プラグインのcreateSourcesを使用してソースを作成
      const sources = plugin.createSources(data);
      sources.forEach((source) => {
        unifiedCalculator.addSource(source);
      });
    });
  });

  // シミュレーターを作成（年数を月数に変換）
  const simulator = createSimulator(
    unifiedCalculator,
    { simulationMonths: simulationYears * 12 },
    pluginRegistry,
  );

  // シミュレーションを実行
  const simulationResult = simulator.simulate();

  // チャート用のデータ形式に変換
  return convertToChartData(simulationResult);
}
