import { Expense } from "@/contexts/ExpensesContext";
import {
  CalculatorSource,
  CashFlowChange,
  calculateCyclesForMonth,
} from "../shared";

/**
 * ExpenseContextのExpense型をExpenseCalculatorのExpenseSource型に変換
 */
export function convertExpenseToExpenseSource(
  expense: Expense
): CalculatorSource {
  return {
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
  };
}
