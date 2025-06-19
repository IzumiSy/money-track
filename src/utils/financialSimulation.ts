import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { Calculator, CalculatorSource } from "@/domains/shared";

interface SimulationDataPoint {
  year: string;
  deposits: number;
  total: number;
  [key: string]: string | number; // 動的なキー（investment_*, income_*, expense_*）
}

interface FinancialSimulationParams {
  assets: FinancialAsset;
  expenses?: Expense[];
  unifiedCalculator: Calculator<CalculatorSource>;
  incomes: Income[]; // チャート表示用に元のIncome配列も保持
  simulationYears: number;
}

interface FinancialSimulationResult {
  simulationData: SimulationDataPoint[];
  finalYearData: SimulationDataPoint;
  hasData: boolean;
  netMonthlyCashFlow: number;
  totalBaseAmount: number;
  initialTotal: number;
}

export function calculateFinancialSimulation({
  assets,
  expenses = [],
  unifiedCalculator,
  incomes,
  simulationYears,
}: FinancialSimulationParams): FinancialSimulationResult {
  const { deposits } = assets;

  // 月額のキャッシュフローを計算（現在時点での有効な収入・支出）
  const currentDate = new Date();
  const totalMonthlyCashFlow = unifiedCalculator.calculateTotal(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // 純キャッシュフロー（収入 - 支出）を計算
  const netMonthlyCashFlow =
    totalMonthlyCashFlow.income - totalMonthlyCashFlow.expense;

  // ベース評価額の合計を計算（investmentsは無視するため0）
  const totalBaseAmount = 0;

  // 初期総資産額
  const initialTotal = deposits;

  // 資産推移シミュレーション計算（収入・支出・投資を考慮）
  const simulationData: SimulationDataPoint[] = [];

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

    // yearDataを先に定義
    const yearData: SimulationDataPoint = {
      year: `${year}年目`,
      deposits: 0, // 後で更新
      total: 0, // 後で計算
    };

    // 調整済み預金額（基本預金 + 純キャッシュフロー）
    const adjustedDeposits = Math.max(0, deposits + cumulativeCashFlow);

    // 預金額を更新
    yearData.deposits = Math.round(adjustedDeposits);

    // 各支出項目を個別にマイナスのバーとして追加（期間を考慮）
    // ExpenseCalculatorを使用して個別の支出を取得
    expenses.forEach((expense) => {
      const expenseKey = `expense_${expense.id}`;
      // その年の各月における有効な支出額を計算
      let yearlyExpenseAmount = 0;

      // 各月の支出を合計
      for (let month = 1; month <= 12; month++) {
        const monthlyBreakdown = unifiedCalculator.getBreakdown(year, month);
        // expense.nameで対応する支出を取得
        const cashFlowChange = monthlyBreakdown[expense.name];
        yearlyExpenseAmount += cashFlowChange ? cashFlowChange.expense : 0;
      }

      yearData[expenseKey] = -Math.round(yearlyExpenseAmount);
    });

    // 投資関連の処理は削除

    // 各収入項目を個別にPositiveバーとして追加（期間を考慮）
    // 各収入源について年間の合計を計算
    incomes.forEach((income) => {
      const incomeKey = `income_${income.id}`;
      // その年の各月における有効な収入額を計算
      let yearlyIncomeAmount = 0;

      // 各月の収入を合計
      for (let month = 1; month <= 12; month++) {
        const monthlyBreakdown = unifiedCalculator.getBreakdown(year, month);
        // income.nameで対応する収入を取得
        const cashFlowChange = monthlyBreakdown[income.name];
        yearlyIncomeAmount += cashFlowChange ? cashFlowChange.income : 0;
      }

      yearData[incomeKey] = Math.round(yearlyIncomeAmount);
    });

    // 投資関連の処理は削除

    yearData.total = Math.round(adjustedDeposits);
    simulationData.push(yearData);
  }

  // 最終年のデータ
  const finalYearData = simulationData[simulationData.length - 1];

  // データが存在するかどうかの判定
  const hasData = initialTotal > 0 || totalMonthlyCashFlow.income > 0;

  return {
    simulationData,
    finalYearData,
    hasData,
    netMonthlyCashFlow,
    totalBaseAmount,
    initialTotal,
  };
}
