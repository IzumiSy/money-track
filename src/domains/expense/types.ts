import { CalculatorSource } from "@/domains/shared";

export interface ExpenseSource extends CalculatorSource {
  type: "living" | "housing" | "transport" | "entertainment" | "other";
}

export interface ExpenseBreakdown {
  [sourceName: string]: number;
}

export interface ExpenseCalculationResult {
  totalExpense: number;
  breakdown: ExpenseBreakdown;
  year: number;
  month: number;
}
