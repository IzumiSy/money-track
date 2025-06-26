// TimeRange is no longer used since we switched to relative months
// This file is kept for backward compatibility but should be removed in future refactoring

export interface TimeRange {
  startMonths?: number;
  endMonths?: number;
}

export const createTimeRange = (
  startMonths?: number,
  endMonths?: number
): TimeRange => ({
  startMonths,
  endMonths,
});

// This function is no longer used
export const isWithinTimeRange = (
  timeRange: TimeRange | undefined,
  monthsFromStart: number
): boolean => {
  if (!timeRange) return true;

  const afterStart =
    timeRange.startMonths === undefined ||
    monthsFromStart >= timeRange.startMonths;
  const beforeEnd =
    timeRange.endMonths === undefined || monthsFromStart <= timeRange.endMonths;

  return afterStart && beforeEnd;
};
