import { YearMonthDuration } from "@/types/YearMonth";
import { CycleSetting } from "@/types/CycleSetting";

/**
 * 指定された月にサイクル設定に基づいて発生するかどうかを判定
 */
export function shouldOccurInMonth(
  startYearMonth: YearMonthDuration,
  targetYearMonth: YearMonthDuration,
  cycleSetting: CycleSetting
): boolean {
  if (!cycleSetting.enabled) {
    return true; // サイクル設定が無効の場合は毎月発生
  }

  // 開始年月から対象年月までの月数差を計算
  const startYear = startYearMonth.getYear();
  const startMonth = startYearMonth.getMonth();
  const targetYear = targetYearMonth.getYear();
  const targetMonth = targetYearMonth.getMonth();

  if (
    startYear === undefined ||
    startMonth === undefined ||
    targetYear === undefined ||
    targetMonth === undefined
  ) {
    return true; // 年月が不完全な場合は毎月発生
  }

  const startTotalMonths = startYear * 12 + startMonth - 1;
  const targetTotalMonths = targetYear * 12 + targetMonth - 1;
  const monthsDiff = targetTotalMonths - startTotalMonths;

  // 間隔を月単位に変換
  const intervalInMonths =
    cycleSetting.unit === "year"
      ? cycleSetting.interval * 12
      : cycleSetting.interval;

  // 月数差が間隔で割り切れる場合に発生
  return monthsDiff >= 0 && monthsDiff % intervalInMonths === 0;
}
