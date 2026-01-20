import { GroupedLiability } from "@/features/group/types";
import {
  CalculatorSource,
  CashFlowChange,
  calculateCyclesForMonth,
} from "@/core/calculator";

/**
 * GroupedLiability型をLiabilityCalculatorのLiabilitySource型に変換
 * 固定額返済のみ対応（利息なし）
 */
export function convertLiabilityToLiabilitySource(
  liability: GroupedLiability,
): CalculatorSource {
  return {
    id: liability.id,
    name: liability.name,
    type: "liability",
    calculate: (monthIndex: number): CashFlowChange => {
      // 返済サイクルに基づく返済額（支出）を計算
      const amount = calculateCyclesForMonth(liability.cycles, monthIndex);
      return { income: 0, expense: amount };
    },
    getMetadata: () => ({
      color: liability.color,
      originalLiability: liability,
      assetSourceId: liability.assetSourceId,
      principal: liability.principal,
      totalAmount: liability.totalAmount,
    }),
  };
}
