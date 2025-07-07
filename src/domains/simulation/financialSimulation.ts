import {
  GroupedExpense,
  GroupedIncome,
  GroupedAsset,
} from "@/domains/group/types";
import { createCalculator } from "@/domains/shared/createCalculator";
import { CalculatorSource } from "@/domains/shared/CalculatorSource";
import { createSimulator } from "@/domains/simulation";
import { convertExpenseToExpenseSource } from "@/domains/expense/source";
import { convertIncomeToIncomeSource } from "@/domains/income/source";

// チャート用のデータポイント型
interface SimulationDataPoint {
  year: string;
  deposits: number;
  total: number;
  [key: string]: string | number; // 動的なキー（investment_*, income_*, expense_*）
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
 */
function convertToChartData(
  simulationResult: ReturnType<ReturnType<typeof createSimulator>["simulate"]>,
  unifiedCalculator: ReturnType<typeof createCalculator<CalculatorSource>>
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
      deposits: lastMonth.deposits,
      total: lastMonth.deposits,
    };

    // unifiedCalculatorから全てのソースを取得
    const sources = unifiedCalculator.getSources();

    // 年間の収入・支出を集計
    const yearlyIncomeMap = new Map<string, number>();
    const yearlyExpenseMap = new Map<string, number>();

    yearMonths.forEach((monthData) => {
      // 収入の集計
      monthData.incomeBreakdown.forEach((amount, sourceId) => {
        const current = yearlyIncomeMap.get(sourceId) || 0;
        yearlyIncomeMap.set(sourceId, current + amount);
      });

      // 支出の集計
      monthData.expenseBreakdown.forEach((amount, sourceId) => {
        const current = yearlyExpenseMap.get(sourceId) || 0;
        yearlyExpenseMap.set(sourceId, current + amount);
      });
    });

    // 各支出項目を個別にマイナスのバーとして追加
    sources
      .filter((source) => source.type === "expense")
      .forEach((expenseSource) => {
        const expenseKey = `expense_${expenseSource.id}`;
        const yearlyExpenseAmount = yearlyExpenseMap.get(expenseSource.id) || 0;
        chartData[expenseKey] = -Math.round(yearlyExpenseAmount);
      });

    // 各収入項目を個別にPositiveバーとして追加
    sources
      .filter((source) => source.type === "income")
      .forEach((incomeSource) => {
        const incomeKey = `income_${incomeSource.id}`;
        const yearlyIncomeAmount = yearlyIncomeMap.get(incomeSource.id) || 0;
        chartData[incomeKey] = Math.round(yearlyIncomeAmount);
      });

    yearlyAggregatedData.push(chartData);
  }

  // 最終年のデータ
  const finalYearData = yearlyAggregatedData[
    yearlyAggregatedData.length - 1
  ] || {
    year: "0年目",
    deposits: 0,
    total: 0,
  };

  return {
    simulationData: yearlyAggregatedData,
    finalYearData,
    hasData,
    netMonthlyCashFlow: currentMonthlyCashFlow.net,
    totalBaseAmount: 0, // 投資は無視するため0
    initialTotal: monthlyData[0]?.deposits || 0,
  };
}

/**
 * 財務シミュレーションを実行する純粋関数
 * @param assets 資産情報
 * @param expenses 支出リスト
 * @param incomes 収入リスト
 * @param simulationYears シミュレーション年数
 * @param activeGroupIds アクティブなグループIDのリスト（指定時はフィルタリング実行）
 */
export function runFinancialSimulation(
  assets: GroupedAsset[],
  expenses: GroupedExpense[],
  incomes: GroupedIncome[],
  simulationYears: number,
  activeGroupIds?: string[]
): ChartSimulationResult {
  // activeGroupIdsが指定されている場合はフィルタリング
  const filteredIncomes = activeGroupIds
    ? incomes.filter((income) => activeGroupIds.includes(income.groupId))
    : incomes;

  const filteredExpenses = activeGroupIds
    ? expenses.filter((expense) => activeGroupIds.includes(expense.groupId))
    : expenses;

  const filteredAssets = activeGroupIds
    ? assets.filter((asset) => activeGroupIds.includes(asset.groupId))
    : assets;

  // 統合されたCalculatorインスタンスを作成
  const unifiedCalculator = createCalculator<CalculatorSource>();

  // Income[]をIncomeSourceに変換してCalculatorに追加
  filteredIncomes.forEach((income) => {
    unifiedCalculator.addSource(convertIncomeToIncomeSource(income));
  });

  // Expense[]をExpenseSourceに変換してCalculatorに追加
  filteredExpenses.forEach((expense) => {
    unifiedCalculator.addSource(convertExpenseToExpenseSource(expense));
  });

  // すべての資産の初期額を合計（現金を含む）
  const totalInitialAmount = filteredAssets.reduce(
    (sum, asset) => sum + asset.baseAmount,
    0
  );

  // シミュレーターを作成（年数を月数に変換）
  const simulator = createSimulator(unifiedCalculator, {
    initialDeposits: totalInitialAmount,
    simulationMonths: simulationYears * 12,
  });

  // シミュレーションを実行
  const simulationResult = simulator.simulate();

  // チャート用のデータ形式に変換
  return convertToChartData(simulationResult, unifiedCalculator);
}
