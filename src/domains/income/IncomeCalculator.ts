import { IncomeSource } from "./types";
import { Calculator, createCalculator } from "@/domains/shared";

export type IncomeCalculator = Calculator<IncomeSource>;

/**
 * IncomeCalculatorを作成する
 * 共通のcreateCalculatorを使用し、Income特有のインターフェースでラップ
 */
export const createIncomeCalculator = (): IncomeCalculator =>
  createCalculator<IncomeSource>();
