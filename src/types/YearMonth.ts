/**
 * 年月の期間を表す値オブジェクトクラス
 * 年と月を常にセットで扱い、アトミックな操作を提供する
 */
export class YearMonthDuration {
  private readonly year?: number;
  private readonly month?: number; // 1-12

  constructor(year?: number, month?: number) {
    if (year !== undefined && (!Number.isInteger(year) || year < 0)) {
      throw new Error("Year must be a non-negative integer");
    }
    if (
      month !== undefined &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    ) {
      throw new Error("Month must be an integer between 1 and 12");
    }
    this.year = year;
    this.month = month;
  }

  // ファクトリーメソッド
  static from(year?: number, month?: number): YearMonthDuration {
    return new YearMonthDuration(year, month);
  }

  // ゲッター（undefinedの場合はundefinedを返す）
  getYear(): number | undefined {
    return this.year;
  }

  getMonth(): number | undefined {
    return this.month;
  }

  // 年と月の両方が設定されているかチェック
  private isComplete(): boolean {
    return this.year !== undefined && this.month !== undefined;
  }

  isBeforeOrEqual(other: YearMonthDuration): boolean {
    if (!this.isComplete() || !other.isComplete()) return false;
    return this.toMonthNumber() <= other.toMonthNumber();
  }

  isAfterOrEqual(other: YearMonthDuration): boolean {
    if (!this.isComplete() || !other.isComplete()) return false;
    return this.toMonthNumber() >= other.toMonthNumber();
  }

  // 年または月を更新
  withYear(year: number | undefined): YearMonthDuration {
    return new YearMonthDuration(year, this.month);
  }

  withMonth(month: number | undefined): YearMonthDuration {
    return new YearMonthDuration(this.year, month);
  }

  // ユーティリティメソッド
  private toMonthNumber(): number {
    if (!this.isComplete()) return 0;
    return this.year! * 12 + this.month! - 1;
  }
}
