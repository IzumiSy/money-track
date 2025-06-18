import { FinancialAsset } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";

interface SimulationDataPoint {
  year: string;
  deposits: number;
  total: number;
  [key: string]: string | number; // 動的なキー（investment_*, income_*, expense_*）
}

interface FinancialSimulationParams {
  assets: FinancialAsset;
  expenses?: Expense[];
  incomes?: Income[];
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

// 指定された年月における有効な収入の合計額を計算
function getActiveIncomeForMonth(
  incomes: Income[],
  year: number,
  month: number
): number {
  return incomes.reduce((sum, income) => {
    // startYear/startMonthがundefinedの場合はデフォルト値を使用
    const startYear = income.startYear ?? 0;
    const startMonth = income.startMonth ?? 1;

    // 開始年月をチェック
    const startYearMonth = startYear * 12 + startMonth - 1;
    const targetYearMonth = year * 12 + month - 1;

    if (targetYearMonth >= startYearMonth) {
      // 終了年月が設定されていない、または終了年月以前の場合は有効
      if (income.endYear === undefined || !income.endMonth) {
        return sum + income.monthlyAmount;
      }

      const endYearMonth = income.endYear * 12 + income.endMonth - 1;
      if (targetYearMonth <= endYearMonth) {
        return sum + income.monthlyAmount;
      }
    }

    return sum;
  }, 0);
}

// 指定された年月における有効な支出の合計額を計算
function getActiveExpenseForMonth(
  expenses: Expense[],
  year: number,
  month: number
): number {
  return expenses.reduce((sum, expense) => {
    // 開始年月が設定されていない場合は常に有効
    if (!expense.startYear || !expense.startMonth) {
      return sum + expense.monthlyAmount;
    }

    // 開始年月をチェック
    const startYearMonth = expense.startYear * 12 + expense.startMonth - 1;
    const targetYearMonth = year * 12 + month - 1;

    if (targetYearMonth >= startYearMonth) {
      // 終了年月が設定されていない、または終了年月以前の場合は有効
      if (!expense.endYear || !expense.endMonth) {
        return sum + expense.monthlyAmount;
      }

      const endYearMonth = expense.endYear * 12 + expense.endMonth - 1;
      if (targetYearMonth <= endYearMonth) {
        return sum + expense.monthlyAmount;
      }
    }

    return sum;
  }, 0);
}

export function calculateFinancialSimulation({
  assets,
  expenses = [],
  incomes = [],
  simulationYears,
}: FinancialSimulationParams): FinancialSimulationResult {
  const { deposits, investments } = assets;

  // 月額積立の合計額を計算（積立オプションから）
  const totalMonthlyInvestments = investments.reduce((sum, inv) => {
    return (
      sum +
      inv.investmentOptions.reduce((optionSum, option) => {
        return optionSum + option.monthlyAmount;
      }, 0)
    );
  }, 0);

  // 月額売却の合計額を計算（売却オプションから）
  const totalMonthlySellbacks = investments.reduce((sum, inv) => {
    return (
      sum +
      inv.sellbackOptions.reduce((optionSum, option) => {
        return optionSum + option.monthlyAmount;
      }, 0)
    );
  }, 0);

  // 月額収入の合計額を計算（現在時点での有効な収入のみ）
  const currentDate = new Date();
  const totalMonthlyIncomes = getActiveIncomeForMonth(
    incomes,
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // 月額支出の合計額を計算（現在時点での有効な支出のみ）
  const totalMonthlyExpenses = getActiveExpenseForMonth(
    expenses,
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // 純キャッシュフロー（収入 - 支出）を計算
  const netMonthlyCashFlow = totalMonthlyIncomes - totalMonthlyExpenses;

  // ベース評価額の合計を計算
  const totalBaseAmount = investments.reduce(
    (sum, inv) => sum + inv.baseAmount,
    0
  );

  // 初期総資産額
  const initialTotal = deposits + totalBaseAmount;

  // 資産推移シミュレーション計算（収入・支出・投資を考慮）
  const simulationData: SimulationDataPoint[] = [];
  const currentYear = currentDate.getFullYear();

  // 累積キャッシュフローを事前に計算
  const cumulativeCashFlows: number[] = [0]; // 0年目は0

  for (let targetYear = 1; targetYear <= simulationYears; targetYear++) {
    let totalCashFlow = 0;

    // 0年目からtargetYear-1年目までの全ての月のキャッシュフローを累積
    for (let year = 0; year < targetYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthlyIncome = getActiveIncomeForMonth(incomes, year, month);
        const monthlyExpense = getActiveExpenseForMonth(expenses, year, month);
        totalCashFlow += monthlyIncome - monthlyExpense;
      }
    }

    cumulativeCashFlows.push(totalCashFlow);
  }

  for (let year = 0; year <= simulationYears; year++) {
    const cumulativeCashFlow = cumulativeCashFlows[year];

    // 売却による預金の増加を計算（売却オプションから）
    let yearlySellbacks = 0;
    investments.forEach((inv) => {
      inv.sellbackOptions.forEach((option) => {
        const startTotalMonths =
          option.startYear * 12 + (option.startMonth - 1);
        const endTotalMonths = option.endYear * 12 + (option.endMonth - 1);
        const currentTotalMonths = year * 12;

        // 現在の年月が売却期間内かチェック
        if (
          currentTotalMonths >= startTotalMonths &&
          option.monthlyAmount > 0
        ) {
          // 実際の売却期間を計算
          const actualEndMonths = Math.min(endTotalMonths, currentTotalMonths);
          const sellbackMonths = actualEndMonths - startTotalMonths + 1;

          if (sellbackMonths > 0) {
            yearlySellbacks += option.monthlyAmount * sellbackMonths;
          }
        }
      });
    });

    // 調整済み預金額（基本預金 + 純キャッシュフロー + 売却収入）
    const adjustedDeposits = Math.max(
      0,
      deposits + cumulativeCashFlow + yearlySellbacks
    );

    const yearData: SimulationDataPoint = {
      year: `${year}年目`,
      deposits: Math.round(adjustedDeposits),
      total: 0, // 後で計算
    };

    let totalInvestmentValue = 0;

    // 各投資の将来価値を個別に計算
    investments.forEach((inv) => {
      // ベース評価額の成長を計算
      let baseValue = 0;
      if (inv.baseAmount > 0) {
        const annualRate = inv.returnRate;
        baseValue = inv.baseAmount * Math.pow(1 + annualRate, year);
      }

      // 積立オプションの将来価値を計算
      let monthlyInvestmentValue = 0;
      inv.investmentOptions.forEach((option) => {
        // 各オプションの開始・終了時期を計算
        const startTotalMonths =
          option.startYear * 12 + (option.startMonth - 1);
        const endTotalMonths = option.endYear * 12 + (option.endMonth - 1);
        const currentTotalMonths = year * 12;

        // 現在の年月が積立期間内かチェック
        if (
          currentTotalMonths >= startTotalMonths &&
          option.monthlyAmount > 0
        ) {
          // 実際の積立期間を計算
          const actualEndMonths = Math.min(endTotalMonths, currentTotalMonths);
          const investmentMonths = actualEndMonths - startTotalMonths + 1;

          if (investmentMonths > 0) {
            const monthlyRate = inv.returnRate / 12;
            let optionValue = 0;

            if (monthlyRate > 0) {
              // 複利計算式: PMT * (((1 + r)^n - 1) / r)
              optionValue =
                (option.monthlyAmount *
                  (Math.pow(1 + monthlyRate, investmentMonths) - 1)) /
                monthlyRate;

              // 積立終了後の成長を計算
              if (currentTotalMonths > endTotalMonths) {
                const growthMonths = currentTotalMonths - endTotalMonths;
                optionValue =
                  optionValue * Math.pow(1 + monthlyRate, growthMonths);
              }
            } else {
              // リターン率が0の場合は単純な積立額の合計
              optionValue = option.monthlyAmount * investmentMonths;
            }

            monthlyInvestmentValue += optionValue;
          }
        }
      });

      // 総投資価値（ベース評価額 + 積立投資価値）
      let futureValue = baseValue + monthlyInvestmentValue;

      // 売却オプションによる投資価値の減少を計算
      inv.sellbackOptions.forEach((option) => {
        const startTotalMonths =
          option.startYear * 12 + (option.startMonth - 1);
        const endTotalMonths = option.endYear * 12 + (option.endMonth - 1);
        const currentTotalMonths = year * 12;

        // 現在の年月が売却期間内かチェック
        if (
          currentTotalMonths >= startTotalMonths &&
          option.monthlyAmount > 0
        ) {
          // 実際の売却期間を計算
          const actualEndMonths = Math.min(endTotalMonths, currentTotalMonths);
          const sellbackMonths = actualEndMonths - startTotalMonths + 1;

          if (sellbackMonths > 0) {
            const totalSellbackAmount = option.monthlyAmount * sellbackMonths;
            futureValue = Math.max(0, futureValue - totalSellbackAmount);
          }
        }
      });

      const investmentKey = `investment_${inv.id}`;
      yearData[investmentKey] = Math.round(futureValue);
      totalInvestmentValue += futureValue;
    });

    // 各支出項目を個別にマイナスのバーとして追加（期間を考慮）
    expenses.forEach((expense) => {
      const expenseKey = `expense_${expense.id}`;
      // その年の各月における有効な支出額を計算
      let yearlyExpenseAmount = 0;
      for (let month = 1; month <= 12; month++) {
        // シミュレーション開始年を基準とした年数で計算
        const simulationYear = year;
        const simulationMonth = month;

        // この支出項目が有効な月のみ加算
        if (expense.startYear && expense.startMonth) {
          // 開始年月をシミュレーション開始からの月数で計算
          const startMonthFromStart =
            (expense.startYear - 1) * 12 + expense.startMonth - 1;
          const currentMonthFromStart =
            simulationYear * 12 + simulationMonth - 1;

          if (currentMonthFromStart >= startMonthFromStart) {
            if (!expense.endYear || !expense.endMonth) {
              yearlyExpenseAmount += expense.monthlyAmount;
            } else {
              // 終了年月をシミュレーション開始からの月数で計算
              const endMonthFromStart =
                (expense.endYear - 1) * 12 + expense.endMonth - 1;
              if (currentMonthFromStart <= endMonthFromStart) {
                yearlyExpenseAmount += expense.monthlyAmount;
              }
            }
          }
        } else {
          // 期間設定がない場合は常に有効
          yearlyExpenseAmount += expense.monthlyAmount;
        }
      }
      yearData[expenseKey] = -Math.round(yearlyExpenseAmount);
    });

    // 各収入項目を個別にPositiveバーとして追加（期間を考慮）
    incomes.forEach((income) => {
      const incomeKey = `income_${income.id}`;
      // その年の各月における有効な収入額を計算
      let yearlyIncomeAmount = 0;
      for (let month = 1; month <= 12; month++) {
        // シミュレーション開始年を基準とした年数で計算
        const simulationYear = year;
        const simulationMonth = month;

        // この収入項目が有効な月のみ加算
        // startYear/startMonthがundefinedの場合はデフォルト値を使用
        const startYear = income.startYear ?? 0;
        const startMonth = income.startMonth ?? 1;

        // 開始年月をシミュレーション開始からの月数で計算
        const startMonthFromStart = startYear * 12 + startMonth - 1;
        const currentMonthFromStart = simulationYear * 12 + simulationMonth - 1;

        if (currentMonthFromStart >= startMonthFromStart) {
          if (!income.endYear || !income.endMonth) {
            yearlyIncomeAmount += income.monthlyAmount;
          } else {
            // 終了年月をシミュレーション開始からの月数で計算
            const endMonthFromStart = income.endYear * 12 + income.endMonth - 1;
            if (currentMonthFromStart <= endMonthFromStart) {
              yearlyIncomeAmount += income.monthlyAmount;
            }
          }
        }
      }
      yearData[incomeKey] = Math.round(yearlyIncomeAmount);
    });

    yearData.total = Math.round(adjustedDeposits + totalInvestmentValue);
    simulationData.push(yearData);
  }

  // 最終年のデータ
  const finalYearData = simulationData[simulationData.length - 1];

  // データが存在するかどうかの判定
  const hasData = initialTotal > 0 || totalMonthlyInvestments > 0;

  return {
    simulationData,
    finalYearData,
    hasData,
    netMonthlyCashFlow,
    totalBaseAmount,
    initialTotal,
  };
}
