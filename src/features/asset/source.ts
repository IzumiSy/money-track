import { GroupedAsset } from "@/features/group/types";
import { CalculatorSource, CashFlowChange } from "@/core/calculator";

/**
 * 指定された月が期間内にあるかどうかを判定
 */
function isMonthInRange(
  monthIndex: number,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): boolean {
  const startMonthIndex = startYear * 12 + (startMonth - 1);
  const endMonthIndex = endYear * 12 + (endMonth - 1);
  return monthIndex >= startMonthIndex && monthIndex <= endMonthIndex;
}

/**
 * GroupedAsset型をAssetCalculatorのAssetSource型に変換
 */
export function convertAssetToAssetSource(
  asset: GroupedAsset,
): CalculatorSource {
  return {
    id: asset.id,
    name: asset.name,
    type: "asset",
    calculate: (monthIndex: number): CashFlowChange => {
      let income = 0;
      let expense = 0;

      // 積立オプションの処理（支出として計上）
      asset.contributionOptions.forEach((option) => {
        if (
          isMonthInRange(
            monthIndex,
            option.startYear,
            option.startMonth,
            option.endYear,
            option.endMonth,
          )
        ) {
          expense += option.monthlyAmount;
        }
      });

      // 引き出しオプションの処理（収入として計上）
      asset.withdrawalOptions.forEach((option) => {
        if (
          isMonthInRange(
            monthIndex,
            option.startYear,
            option.startMonth,
            option.endYear,
            option.endMonth,
          )
        ) {
          income += option.monthlyAmount;
        }
      });

      return { income, expense };
    },
    getMetadata: () => ({
      color: asset.color,
      returnRate: asset.returnRate,
      baseAmount: asset.baseAmount,
      originalAsset: asset,
    }),
  };
}
