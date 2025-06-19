import { Calculator, CalculatorSource } from "@/domains/shared";

interface YearlySimulationData {
  year: number;
  deposits: number;
  incomeBreakdown: Map<string, number>;
  expenseBreakdown: Map<string, number>;
}

interface FinancialSimulationParams {
  initialDeposits: number;
  unifiedCalculator: Calculator<CalculatorSource>;
  simulationYears: number;
}

interface FinancialSimulationResult {
  yearlyData: YearlySimulationData[];
  currentMonthlyCashFlow: {
    income: number;
    expense: number;
    net: number;
  };
  hasData: boolean;
}

export function calculateFinancialSimulation({
  initialDeposits,
  unifiedCalculator,
  simulationYears,
}: FinancialSimulationParams): FinancialSimulationResult {
  // 月額のキャッシュフローを計算（現在時点での有効な収入・支出）
  const currentDate = new Date();
  const totalMonthlyCashFlow = unifiedCalculator.calculateTotal(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // 純キャッシュフロー（収入 - 支出）を計算
  const netMonthlyCashFlow =
    totalMonthlyCashFlow.income - totalMonthlyCashFlow.expense;

  // 初期総資産額
  const initialTotal = initialDeposits;

  // 年ごとのシミュレーションデータを計算
  const yearlyData: YearlySimulationData[] = [];

  // 累積キャッシュフローを事前に計算
  const cumulativeCashFlows: number[] = [];

  for (let targetYear = 1; targetYear <= simulationYears; targetYear++) {
    let totalCashFlow = 0;

    // 1年目からtargetYear年目までの全ての月のキャッシュフローを累積
    for (let year = 1; year <= targetYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthlyCashFlow = unifiedCalculator.calculateTotal(year, month);
        // 投資は無視するため、収入から支出を引くだけ
        totalCashFlow += monthlyCashFlow.income - monthlyCashFlow.expense;
      }
    }

    cumulativeCashFlows.push(totalCashFlow);
  }

  for (let year = 1; year <= simulationYears; year++) {
    const cumulativeCashFlow = cumulativeCashFlows[year - 1];

    // 調整済み預金額（基本預金 + 純キャッシュフロー）
    const adjustedDeposits = Math.max(0, initialDeposits + cumulativeCashFlow);

    // 年間の収入・支出を集計するためのマップ（IDをキーとする）
    const yearlyIncomeMap = new Map<string, number>();
    const yearlyExpenseMap = new Map<string, number>();

    // 各月のbreakdownを一度だけ取得して、収入・支出を集計
    for (let month = 1; month <= 12; month++) {
      const monthlyBreakdown = unifiedCalculator.getBreakdown(year, month);
      // breakdownから全ての収入・支出を集計（キーはsourceId）
      Object.entries(monthlyBreakdown).forEach(([sourceId, cashFlowChange]) => {
        if (cashFlowChange.income > 0) {
          const currentIncome = yearlyIncomeMap.get(sourceId) || 0;
          yearlyIncomeMap.set(sourceId, currentIncome + cashFlowChange.income);
        }
        if (cashFlowChange.expense > 0) {
          const currentExpense = yearlyExpenseMap.get(sourceId) || 0;
          yearlyExpenseMap.set(
            sourceId,
            currentExpense + cashFlowChange.expense
          );
        }
      });
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
  const hasData = initialTotal > 0 || totalMonthlyCashFlow.income > 0;

  return {
    yearlyData,
    currentMonthlyCashFlow: {
      income: totalMonthlyCashFlow.income,
      expense: totalMonthlyCashFlow.expense,
      net: netMonthlyCashFlow,
    },
    hasData,
  };
}
