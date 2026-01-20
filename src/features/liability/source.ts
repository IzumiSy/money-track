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

/**
 * 負債返済に伴う資産減少用ExpenseSourceを作成
 * 返済元資産が指定されている場合のみ作成される
 */
export function createLiabilityRepaymentSource(
  liability: GroupedLiability,
): CalculatorSource | null {
  if (!liability.assetSourceId) {
    return null;
  }

  return {
    id: `liability-repayment-${liability.id}`,
    name: `負債返済: ${liability.name}`,
    type: "expense",
    calculate: (monthIndex: number): CashFlowChange => {
      // 返済サイクルに基づく返済額（支出）を計算
      // 元本を超えたら返済を止める
      let totalPaid = 0;
      let thisMonthAmount = 0;
      for (let i = 0; i <= monthIndex; i++) {
        const amt = calculateCyclesForMonth(liability.cycles, i);
        if (i === monthIndex) thisMonthAmount = amt;
        totalPaid += amt;
      }
      // 今月の支払いで元本を超える場合、残りだけ支払う
      if (totalPaid - thisMonthAmount >= liability.principal) {
        return { income: 0, expense: 0 };
      }
      if (totalPaid > liability.principal) {
        return {
          income: 0,
          expense: Math.max(
            0,
            liability.principal - (totalPaid - thisMonthAmount),
          ),
        };
      }
      return { income: 0, expense: thisMonthAmount };
    },
    getMetadata: () => ({
      color: liability.color,
      originalLiability: liability,
      assetSourceId: liability.assetSourceId,
    }),
  };
}
