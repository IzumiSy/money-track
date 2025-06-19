import { CalculatorSource } from "@/domains/shared";

export interface IncomeSource extends CalculatorSource {
  type: "salary" | "investment" | "business" | "rental";
}
