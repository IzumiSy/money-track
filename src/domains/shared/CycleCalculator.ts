import { Cycle } from "./Cycle";
import { convertYearMonthToIndex } from "./TimeRange";

/**
 * 指定されたサイクルが特定の月に該当するかチェック
 * @param cycle サイクル定義
 * @param monthIndex 0ベースの月インデックス
 * @returns サイクルが該当する場合true
 */
export function isCycleActiveInMonth(
  cycle: Cycle,
  monthIndex: number
): boolean {
  // 開始日チェック
  const startMonthIndex = convertYearMonthToIndex(
    cycle.startDate.year,
    cycle.startDate.month
  );

  if (monthIndex < startMonthIndex) return false;

  // 終了日チェック
  if (cycle.endDate) {
    const endMonthIndex = convertYearMonthToIndex(
      cycle.endDate.year,
      cycle.endDate.month
    );
    if (monthIndex > endMonthIndex) return false;
  }

  // サイクルタイプに応じた判定
  switch (cycle.type) {
    case "monthly":
      return true;

    case "yearly":
      // 開始月と同じ月の場合のみ（毎年同じ月）
      return (monthIndex - startMonthIndex) % 12 === 0;

    case "custom":
      if (!cycle.interval || !cycle.intervalUnit) {
        throw new Error("Custom cycle requires interval and intervalUnit");
      }

      if (cycle.intervalUnit === "month") {
        return (monthIndex - startMonthIndex) % cycle.interval === 0;
      } else {
        // year
        return (monthIndex - startMonthIndex) % (cycle.interval * 12) === 0;
      }

    default:
      throw new Error(`Unknown cycle type: ${cycle.type}`);
  }
}

/**
 * 複数のサイクルから特定の月の合計金額を計算
 * @param cycles サイクルの配列
 * @param monthIndex 0ベースの月インデックス
 * @returns 該当月の合計金額
 */
export function calculateCyclesForMonth(
  cycles: Cycle[],
  monthIndex: number
): number {
  return cycles
    .filter((cycle) => isCycleActiveInMonth(cycle, monthIndex))
    .reduce((sum, cycle) => sum + cycle.amount, 0);
}
