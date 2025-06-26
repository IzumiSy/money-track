export interface TimeRange {
  startMonthIndex?: number;
  endMonthIndex?: number;
}

/**
 * UIの年月形式から月インデックスへの変換
 * @param year 年（1から始まる）
 * @param month 月（1-12）
 * @returns 0ベースの月インデックス
 */
export const convertYearMonthToIndex = (
  year: number,
  month: number
): number => {
  return (year - 1) * 12 + (month - 1);
};

/**
 * 月インデックスから年月形式への逆変換（UI表示用）
 * @param monthIndex 0ベースの月インデックス
 * @returns 年と月のオブジェクト
 */
export const convertIndexToYearMonth = (
  monthIndex: number
): { year: number; month: number } => {
  return {
    year: Math.floor(monthIndex / 12) + 1,
    month: (monthIndex % 12) + 1,
  };
};

/**
 * 指定された月インデックスが期間内かチェック
 * @param timeRange 期間の定義
 * @param monthIndex チェック対象の月インデックス
 * @returns 期間内の場合true
 */
export const isWithinTimeRange = (
  timeRange: TimeRange | undefined,
  monthIndex: number
): boolean => {
  if (!timeRange) return true;

  const afterStart =
    timeRange.startMonthIndex === undefined ||
    monthIndex >= timeRange.startMonthIndex;
  const beforeEnd =
    timeRange.endMonthIndex === undefined ||
    monthIndex <= timeRange.endMonthIndex;

  return afterStart && beforeEnd;
};

/**
 * TimeRangeを作成するヘルパー関数
 * @param startMonthIndex 開始月インデックス
 * @param endMonthIndex 終了月インデックス
 * @returns TimeRangeオブジェクト
 */
export const createTimeRange = (
  startMonthIndex?: number,
  endMonthIndex?: number
): TimeRange => ({
  startMonthIndex,
  endMonthIndex,
});
