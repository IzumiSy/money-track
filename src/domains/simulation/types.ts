/**
 * 月次シミュレーションデータ
 * 特定の月における財務状態を表す
 */
export interface MonthlySimulationData {
  monthIndex: number;
  incomeBreakdown: Map<string, number>;
  expenseBreakdown: Map<string, number>;
  assetBalances: Map<string, number>;
}

/**
 * シミュレーションパラメータ
 * シミュレーターの初期化に必要な設定
 */
export interface SimulationParams {
  /**
   * シミュレーション期間（月数）
   * 現在時点からの相対的な月数を指定します
   * 例: 12 = 現在から12ヶ月後まで、360 = 現在から30年後まで
   * 最小値: 1ヶ月、最大値: 1200ヶ月（100年）
   */
  simulationMonths: number;
}

/**
 * シミュレーション結果
 * 完全なシミュレーション実行の出力
 */
export interface SimulationResult {
  monthlyData: MonthlySimulationData[];
  currentMonthlyCashFlow: {
    income: number;
    expense: number;
    net: number;
  };
  hasData: boolean;
}

/**
 * 財務シミュレーターインターフェース
 * 財務予測と分析のためのメソッドを提供
 */
export interface Simulator {
  /**
   * 完全なシミュレーションを実行
   */
  simulate(): SimulationResult;

  /**
   * 特定の月の予測データを取得
   * @param monthIndex - 取得したい月のインデックス（0から始まる）
   */
  getMonthlyProjection(monthIndex: number): MonthlySimulationData | undefined;

  /**
   * 現在の月次キャッシュフローを取得
   */
  getCurrentMonthlyCashFlow(): { income: number; expense: number; net: number };
}
