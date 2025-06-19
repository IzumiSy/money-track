import { CalculatorSource } from "@/domains/shared";

export interface ExpenseSource extends CalculatorSource {
  type: "living" | "housing" | "transport" | "entertainment" | "other";
}
