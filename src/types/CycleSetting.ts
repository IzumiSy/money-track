/**
 * サイクル設定の型定義
 * 収入・支出の発生周期を定義する
 */
export interface CycleSetting {
  /** サイクル設定が有効かどうか */
  enabled: boolean;
  /** 間隔（1以上の整数） */
  interval: number;
  /** 単位（月または年） */
  unit: "month" | "year";
}

/**
 * デフォルトのサイクル設定
 */
export const defaultCycleSetting: CycleSetting = {
  enabled: false,
  interval: 1,
  unit: "month",
};
