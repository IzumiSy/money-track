export type CycleType =
  | "monthly" // 毎月
  | "yearly" // 毎年（特定月）
  | "custom"; // Nヶ月/N年ごと

export interface Cycle {
  id: string;
  type: CycleType;
  interval?: number; // customの場合の間隔（必須）
  intervalUnit?: "month" | "year"; // customの場合の単位（必須）
  startDate: {
    year: number;
    month: number; // 1-12
  };
  endDate?: {
    // 終了日（オプション）
    year: number;
    month: number;
  };
  amount: number; // このサイクルでの金額
}
