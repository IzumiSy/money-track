import {
  GroupedExpense,
  GroupedIncome,
  GroupedAsset,
  GroupedLiability,
} from "@/features/group/types";
import { createCalculator } from "@/core/calculator/createCalculator";
import { CalculatorSource } from "@/core/calculator/CalculatorSource";
import { createSimulator } from "./createSimulator";
import { PluginRegistry } from "@/core/plugin/registry";
import { globalRegistry } from "@/core/plugin/defaultRegistry";
import { PluginDataTypeMap } from "@/core/plugin/types";

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

    // 資産残高を追加（プレフィックス: balance_asset_）
    lastMonth.assetBalances.forEach((balance, assetId) => {
      chartData[`balance_asset_${assetId}`] = Math.round(balance);
    });

    // 負債残高を追加（プレフィックス: balance_liability_、マイナス値）
    lastMonth.liabilityBalances.forEach((balance, liabilityId) => {
      chartData[`balance_liability_${liabilityId}`] = -Math.round(balance);
    });

    // 年間の収入・支出を集計
    const yearlyIncomeMap = new Map<string, number>();
    const yearlyExpenseMap = new Map<string, number>();

    yearMonths.forEach((monthData) => {
      // 収入の集計
      monthData.incomeBreakdown.forEach((amount, key) => {
        const current = yearlyIncomeMap.get(key) || 0;
        yearlyIncomeMap.set(key, current + amount);
      });

      // 支出の集計
      monthData.expenseBreakdown.forEach((amount, key) => {
        const current = yearlyExpenseMap.get(key) || 0;
        yearlyExpenseMap.set(key, current + amount);
      });
    });

    // 収入をチャートデータに追加（プレフィックス: income_）
    yearlyIncomeMap.forEach((amount, key) => {
      if (amount > 0) {
        chartData[`income_${key}`] = Math.round(amount);
      }
    });

    // 支出をチャートデータに追加（プレフィックス: expense_、マイナス値）
    yearlyExpenseMap.forEach((amount, key) => {
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
      monthlyData[0].assetBalances.forEach((balance) => {
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
 * @param assets 資産情報
 * @param expenses 支出リスト
 * @param incomes 収入リスト
 * @param liabilities 負債リスト
 * @param simulationYears シミュレーション年数
 * @param activeGroupIds アクティブなグループIDのリスト（指定時はフィルタリング実行）
 * @param pluginRegistry プラグインレジストリ（省略時はグローバルレジストリを使用）
 */
export function runFinancialSimulation(
  assets: GroupedAsset[],
  expenses: GroupedExpense[],
  incomes: GroupedIncome[],
  liabilities: GroupedLiability[],
  simulationYears: number,
  activeGroupIds?: string[],
  pluginRegistry: PluginRegistry = globalRegistry,
): ChartSimulationResult {
  // プラグインデータをマッピング
  const pluginDataMap: {
    [K in keyof PluginDataTypeMap]?: PluginDataTypeMap[K][];
  } = {
    asset: assets,
    expense: expenses,
    income: incomes,
    liability: liabilities,
  };

  // 統合されたCalculatorインスタンスを作成
  const unifiedCalculator = createCalculator<CalculatorSource>();

  // 各プラグインを使用してソースを作成・追加
  pluginRegistry.getAllPluginsSorted().forEach((plugin) => {
    const dataArray = pluginDataMap[plugin.type];
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
