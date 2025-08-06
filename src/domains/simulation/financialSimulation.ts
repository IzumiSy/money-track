import {
  GroupedExpense,
  GroupedIncome,
  GroupedAsset,
  GroupedLiability,
} from "@/domains/group/types";
import { createCalculator } from "@/domains/shared/createCalculator";
import { CalculatorSource } from "@/domains/shared/CalculatorSource";
import { createSimulator } from "@/domains/simulation";
import { convertExpenseToExpenseSource } from "@/domains/expense/source";
import { convertIncomeToIncomeSource } from "@/domains/income/source";
import { convertAssetToAssetSource } from "@/domains/asset/source";
import { convertLiabilityToLiabilitySource } from "@/domains/liability/source";
import { calculateCyclesForMonth } from "@/domains/shared";

// チャート用のデータポイント型
interface SimulationDataPoint {
  year: string;
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
    };

    // 各資産の個別残高を追加
    lastMonth.assetBalances.forEach((balance, assetId) => {
      const investmentKey = `investment_${assetId}`;
      chartData[investmentKey] = Math.round(balance);
    });

    // 各負債の個別残高をマイナス値で追加
    if (lastMonth.liabilityBalances) {
      lastMonth.liabilityBalances.forEach((balance, liabilityId) => {
        const liabilityKey = `liability_${liabilityId}`;
        chartData[liabilityKey] = -Math.round(balance);
      });
    }

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
        if (yearlyExpenseAmount > 0) {
          chartData[expenseKey] = -Math.round(yearlyExpenseAmount);
        }
      });

    // 資産の積立（支出）を特別なキーで追加
    sources
      .filter((source) => source.type === "asset")
      .forEach((assetSource) => {
        const yearlyExpenseAmount = yearlyExpenseMap.get(assetSource.id) || 0;
        if (yearlyExpenseAmount > 0) {
          const expenseKey = `investment_expense_${assetSource.id}`;
          chartData[expenseKey] = -Math.round(yearlyExpenseAmount);
        }
      });

    // 各収入項目を個別にPositiveバーとして追加
    sources
      .filter((source) => source.type === "income")
      .forEach((incomeSource) => {
        const incomeKey = `income_${incomeSource.id}`;
        const yearlyIncomeAmount = yearlyIncomeMap.get(incomeSource.id) || 0;
        if (yearlyIncomeAmount > 0) {
          chartData[incomeKey] = Math.round(yearlyIncomeAmount);
        }
      });

    // 資産リターン（利息収入）を追加
    // yearlyIncomeMapのキーで"return_income_"から始まるものを抽出
    Array.from(yearlyIncomeMap.entries())
      .filter(([key]) => key.startsWith("return_income_"))
      .forEach(([key, amount]) => {
        if (amount > 0) {
          chartData[key] = Math.round(amount);
        }
      });

    // デバッグ: yearlyIncomeMapの全キーを出力
    Array.from(yearlyIncomeMap.entries()).forEach(([key, amount]) => {
      chartData[`debug_income_${key}`] = Math.round(amount);
    });

    // 資産の引き出し（収入）を特別なキーで追加
    sources
      .filter((source) => source.type === "asset")
      .forEach((assetSource) => {
        const yearlyIncomeAmount = yearlyIncomeMap.get(assetSource.id) || 0;
        if (yearlyIncomeAmount > 0) {
          const incomeKey = `sellback_income_${assetSource.id}`;
          chartData[incomeKey] = Math.round(yearlyIncomeAmount);
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
 * @param assets 資産情報
 * @param expenses 支出リスト
 * @param incomes 収入リスト
 * @param liabilities 負債リスト
 * @param simulationYears シミュレーション年数
 * @param activeGroupIds アクティブなグループIDのリスト（指定時はフィルタリング実行）
 */
export function runFinancialSimulation(
  assets: GroupedAsset[],
  expenses: GroupedExpense[],
  incomes: GroupedIncome[],
  liabilities: GroupedLiability[],
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

  // Asset[]をAssetSourceに変換してCalculatorに追加
  filteredAssets.forEach((asset) => {
    unifiedCalculator.addSource(convertAssetToAssetSource(asset));
  });

  // Liability[]をLiabilitySourceに変換してCalculatorに追加
  const filteredLiabilities = activeGroupIds
    ? liabilities.filter((liability) =>
        activeGroupIds.includes(liability.groupId)
      )
    : liabilities;
  filteredLiabilities.forEach((liability) => {
    unifiedCalculator.addSource(convertLiabilityToLiabilitySource(liability));
    // 負債返済に伴う資産減少用ExpenseSourceを追加
    if (liability.assetSourceId) {
      unifiedCalculator.addSource({
        id: `liability-repayment-${liability.id}`,
        name: `負債返済: ${liability.name}`,
        type: "expense",
        calculate: (monthIndex) => {
          // 返済サイクルに基づく返済額（支出）を計算
          // 元本を超えたら返済を止める
          let totalPaid = 0;
          let thisMonthAmount = 0;
          for (let i = 0; i <= monthIndex; i++) {
            const amt = calculateCyclesForMonth(liability.cycles, i);
            if (i === monthIndex) thisMonthAmount = amt;
            totalPaid += amt;
          }
          // 今月の支払いで元本を超える場合、残りだけ支払う
          if (totalPaid - thisMonthAmount >= liability.principal) {
            return { income: 0, expense: 0 };
          }
          if (totalPaid > liability.principal) {
            return {
              income: 0,
              expense: Math.max(
                0,
                liability.principal - (totalPaid - thisMonthAmount)
              ),
            };
          }
          return { income: 0, expense: thisMonthAmount };
        },
        getMetadata: () => ({
          color: liability.color,
          originalLiability: liability,
          assetSourceId: liability.assetSourceId,
        }),
      });
    }
  });

  // シミュレーターを作成（年数を月数に変換）
  const simulator = createSimulator(unifiedCalculator, {
    simulationMonths: simulationYears * 12,
  });

  // シミュレーションを実行
  const simulationResult = simulator.simulate();

  // チャート用のデータ形式に変換
  return convertToChartData(simulationResult, unifiedCalculator);
}
