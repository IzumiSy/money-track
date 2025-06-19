import { YearMonthDuration } from "@/types/YearMonth";

export interface TimeRange {
  startDate?: YearMonthDuration;
  endDate?: YearMonthDuration;
}

export const createTimeRange = (
  startDate?: YearMonthDuration,
  endDate?: YearMonthDuration
): TimeRange => ({
  startDate,
  endDate,
});

export const isWithinTimeRange = (
  timeRange: TimeRange | undefined,
  year: number,
  month: number
): boolean => {
  if (!timeRange) return true;

  const targetDate = YearMonthDuration.from(year, month);
  const afterStart =
    !timeRange.startDate || targetDate.isAfterOrEqual(timeRange.startDate);
  const beforeEnd =
    !timeRange.endDate || targetDate.isBeforeOrEqual(timeRange.endDate);

  return afterStart && beforeEnd;
};
