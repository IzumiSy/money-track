export type CycleType =
  | "monthly" // 毎月
  | "yearly" // 毎年（特定月）
  | "custom"; // Nヶ月/N年ごと

export interface Cycle {
  id: string;
  type: CycleType;
  interval?: number; // customの場合の間隔（必須）
  intervalUnit?: "month" | "year"; // customの場合の単位（必須）
  startMonthIndex: number; // 0ベースの月インデックス（例：0 = 1年1ヶ月目）
  endMonthIndex?: number; // 0ベースの月インデックス（オプション）
  amount: number; // このサイクルでの金額
}
