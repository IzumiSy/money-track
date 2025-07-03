import { Cycle } from "./Cycle";

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
  // 開始月チェック
  if (monthIndex < cycle.startMonthIndex) return false;

  // 終了月チェック
  if (cycle.endMonthIndex !== undefined && monthIndex > cycle.endMonthIndex) {
    return false;
  }

  // サイクルタイプに応じた判定
  switch (cycle.type) {
    case "monthly":
      return true;

    case "yearly":
      // 開始月と同じ月の場合のみ（毎年同じ月）
      return (monthIndex - cycle.startMonthIndex) % 12 === 0;

    case "custom":
      if (!cycle.interval || !cycle.intervalUnit) {
        throw new Error("Custom cycle requires interval and intervalUnit");
      }

      if (cycle.intervalUnit === "month") {
        return (monthIndex - cycle.startMonthIndex) % cycle.interval === 0;
      } else {
        // year
        return (
          (monthIndex - cycle.startMonthIndex) % (cycle.interval * 12) === 0
        );
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
