import { FinancialAssets } from "@/components/FinancialAssetsForm";
import { GroupedIncome, GroupedExpense } from "@/domains/group/types";
import {
  createCalculator,
  CalculatorSource,
  CashFlowChange,
  calculateCyclesForMonth,
} from "@/domains/shared";
import { createSimulator } from "@/domains/simulation";

interface GroupedSimulationOptions {
  assets: FinancialAssets;
  incomes: GroupedIncome[];
  expenses: GroupedExpense[];
  simulationYears: number;
  activeGroupIds: string[];
}

/**
 * グループ対応の財務シミュレーションを実行
 * activeGroupIdsで指定されたグループのみを計算対象とする
 */
export function runGroupedFinancialSimulation({
  assets,
  incomes,
  expenses,
  simulationYears,
  activeGroupIds,
}: GroupedSimulationOptions) {
  // アクティブなグループの収入・支出のみをフィルタリング
  const activeIncomes = incomes.filter((income) =>
    activeGroupIds.includes(income.groupId)
  );
  const activeExpenses = expenses.filter((expense) =>
    activeGroupIds.includes(expense.groupId)
  );

  // 収入・支出のソースを作成
  const incomeSources: CalculatorSource[] = activeIncomes.map((income) => ({
    id: income.id,
    name: income.name,
    type: "income",
    calculate: (monthIndex: number): CashFlowChange => {
      const amount = calculateCyclesForMonth(income.cycles, monthIndex);
      return { income: amount, expense: 0 };
    },
    getMetadata: () => ({
      color: income.color,
      originalIncome: income,
    }),
  }));

  const expenseSources: CalculatorSource[] = activeExpenses.map((expense) => ({
    id: expense.id,
    name: expense.name,
    type: "expense",
    calculate: (monthIndex: number): CashFlowChange => {
      const amount = calculateCyclesForMonth(expense.cycles, monthIndex);
      return { income: 0, expense: amount };
    },
    getMetadata: () => ({
      color: expense.color,
      originalExpense: expense,
    }),
  }));

  // 全てのソースを結合
  const allSources = [...incomeSources, ...expenseSources];

  // Calculatorを作成
  const calculator = createCalculator<CalculatorSource>();

  // ソースを追加
  allSources.forEach((source) => calculator.addSource(source));

  // シミュレーターを作成
  const simulator = createSimulator(calculator, {
    initialDeposits: 0, // FinancialAssetsにはdepositsプロパティがないため0を使用
    simulationMonths: simulationYears * 12,
  });

  // シミュレーションを実行
  const result = simulator.simulate();

  // チャート用のデータに変換
  const simulationData = result.monthlyData
    .filter((_, index) => index % 12 === 0) // 年次データのみ
    .map((monthData, yearIndex) => {
      const dataPoint: Record<string, number | string> = {
        year: `${yearIndex + 1}年目`,
        deposits: monthData.deposits,
      };

      // 収入の内訳
      activeIncomes.forEach((income) => {
        const amount = monthData.incomeBreakdown.get(income.id) || 0;
        if (amount > 0) {
          dataPoint[`income_${income.id}`] = amount * 12; // 年額に変換
        }
      });

      // 支出の内訳
      activeExpenses.forEach((expense) => {
        const amount = monthData.expenseBreakdown.get(expense.id) || 0;
        if (amount > 0) {
          dataPoint[`expense_${expense.id}`] = amount * 12; // 年額に変換
        }
      });

      // 資産の投資リターンなど（既存のロジックを維持）
      assets.assets.forEach((asset) => {
        if (asset.returnRate > 0 && asset.baseAmount > 0) {
          // 投資リターンの計算ロジック（簡略化）
          const investmentValue =
            asset.baseAmount * Math.pow(1 + asset.returnRate, yearIndex);
          dataPoint[`investment_${asset.id}`] = investmentValue;
        }
      });

      return dataPoint;
    });

  return {
    simulationData,
    hasData: result.hasData,
    currentMonthlyCashFlow: result.currentMonthlyCashFlow,
  };
}

/**
 * 特定のグループのみのシミュレーションを実行
 */
export function runSingleGroupSimulation(
  assets: FinancialAssets,
  incomes: GroupedIncome[],
  expenses: GroupedExpense[],
  simulationYears: number,
  groupId: string
) {
  return runGroupedFinancialSimulation({
    assets,
    incomes,
    expenses,
    simulationYears,
    activeGroupIds: [groupId],
  });
}

/**
 * 全グループの統合シミュレーションを実行
 */
export function runAllGroupsSimulation(
  assets: FinancialAssets,
  incomes: GroupedIncome[],
  expenses: GroupedExpense[],
  simulationYears: number,
  groupIds: string[]
) {
  return runGroupedFinancialSimulation({
    assets,
    incomes,
    expenses,
    simulationYears,
    activeGroupIds: groupIds,
  });
}
