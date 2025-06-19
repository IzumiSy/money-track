import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";
import { YearMonthDuration } from "@/types/YearMonth";
import {
  IncomeCalculator,
  createIncomeCalculator,
} from "@/domains/income/IncomeCalculator";
import { IncomeSource } from "@/domains/income/types";
import {
  ExpenseCalculator,
  createExpenseCalculator,
} from "@/domains/expense/ExpenseCalculator";
import { ExpenseSource } from "@/domains/expense/types";
import { TimeRange, createTimeRange } from "@/domains/shared/TimeRange";

interface SimulationDataPoint {
  year: string;
  deposits: number;
  total: number;
  [key: string]: string | number; // 動的なキー（investment_*, income_*, expense_*）
}

interface FinancialSimulationV2Params {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomeCalculator: IncomeCalculator;
  expenseCalculator: ExpenseCalculator;
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

/**
 * IncomeContextのIncome型をIncomeCalculatorのIncomeSource型に変換
 */
export function convertIncomeToIncomeSource(income: Income): IncomeSource {
  return {
    id: income.id,
    name: income.name,
    type: "salary", // デフォルトでsalaryタイプとする
    timeRange:
      income.startYearMonth && income.endYearMonth
        ? createTimeRange(income.startYearMonth, income.endYearMonth)
        : undefined,
    calculate: (year: number, month: number) => {
      // 期間チェック
      if (income.startYearMonth || income.endYearMonth) {
        const targetYearMonth = YearMonthDuration.from(year, month);

        // 開始年月のチェック
        if (
          income.startYearMonth &&
          !targetYearMonth.isAfterOrEqual(income.startYearMonth)
        ) {
          return 0;
        }

        // 終了年月のチェック
        if (
          income.endYearMonth &&
          !targetYearMonth.isBeforeOrEqual(income.endYearMonth)
        ) {
          return 0;
        }
      }

      return income.monthlyAmount;
    },
    getMetadata: () => ({
      color: income.color,
      originalIncome: income,
    }),
  };
}

/**
 * ExpenseContextのExpense型をExpenseCalculatorのExpenseSource型に変換
 */
export function convertExpenseToExpenseSource(expense: Expense): ExpenseSource {
  return {
    id: expense.id,
    name: expense.name,
    type: "living", // デフォルトでlivingタイプとする
    timeRange:
      expense.startYearMonth && expense.endYearMonth
        ? createTimeRange(expense.startYearMonth, expense.endYearMonth)
        : undefined,
    calculate: (year: number, month: number) => {
      // 期間チェック
      if (expense.startYearMonth || expense.endYearMonth) {
        const targetYearMonth = YearMonthDuration.from(year, month);

        // 開始年月のチェック
        if (
          expense.startYearMonth &&
          !targetYearMonth.isAfterOrEqual(expense.startYearMonth)
        ) {
          return 0;
        }

        // 終了年月のチェック
        if (
          expense.endYearMonth &&
          !targetYearMonth.isBeforeOrEqual(expense.endYearMonth)
        ) {
          return 0;
        }
      }

      return expense.monthlyAmount;
    },
    getMetadata: () => ({
      color: expense.color,
      originalExpense: expense,
    }),
  };
}

export function calculateFinancialSimulationV2({
  assets,
  expenses = [],
  incomeCalculator,
  expenseCalculator,
  incomes,
  simulationYears,
}: FinancialSimulationV2Params): FinancialSimulationResult {
  const { deposits } = assets;

  // 月額収入の合計額を計算（現在時点での有効な収入のみ）
  const currentDate = new Date();
  const totalMonthlyIncomes = incomeCalculator.calculateTotalIncome(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // 月額支出の合計額を計算（現在時点での有効な支出のみ）
  const totalMonthlyExpenses = expenseCalculator.calculateTotalExpense(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // 純キャッシュフロー（収入 - 支出）を計算
  const netMonthlyCashFlow = totalMonthlyIncomes - totalMonthlyExpenses;

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
        const monthlyIncome = incomeCalculator.calculateTotalIncome(
          year,
          month
        );
        const monthlyExpense = expenseCalculator.calculateTotalExpense(
          year,
          month
        );
        // 投資は無視するため、収入から支出を引くだけ
        totalCashFlow += monthlyIncome - monthlyExpense;
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
        const monthlyBreakdown = expenseCalculator.getExpenseBreakdown(
          year,
          month
        );
        // expense.nameで対応する支出を取得
        yearlyExpenseAmount += monthlyBreakdown[expense.name] || 0;
      }

      yearData[expenseKey] = -Math.round(yearlyExpenseAmount);
    });

    // 投資関連の処理は削除

    // 各収入項目を個別にPositiveバーとして追加（期間を考慮）
    // IncomeCalculatorを使用して個別の収入を取得
    const incomeBreakdown = incomeCalculator.getIncomeBreakdown(year, 1); // 年の最初の月で取得

    // 各収入源について年間の合計を計算
    incomes.forEach((income) => {
      const incomeKey = `income_${income.id}`;
      // その年の各月における有効な収入額を計算
      let yearlyIncomeAmount = 0;

      // 各月の収入を合計
      for (let month = 1; month <= 12; month++) {
        const monthlyBreakdown = incomeCalculator.getIncomeBreakdown(
          year,
          month
        );
        // income.nameで対応する収入を取得
        yearlyIncomeAmount += monthlyBreakdown[income.name] || 0;
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
  const hasData = initialTotal > 0 || totalMonthlyIncomes > 0;

  return {
    simulationData,
    finalYearData,
    hasData,
    netMonthlyCashFlow,
    totalBaseAmount,
    initialTotal,
  };
}
