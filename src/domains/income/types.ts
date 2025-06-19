import { CalculatorSource } from "@/domains/shared";

export interface IncomeSource extends CalculatorSource {
  type: "salary" | "investment" | "business" | "rental";
}

export interface IncomeBreakdown {
  [sourceName: string]: number;
}

export interface IncomeCalculationResult {
  totalIncome: number;
  breakdown: IncomeBreakdown;
  year: number;
  month: number;
}
