/**
 * 年次シミュレーションデータ
 * 特定の年における財務状態を表す
 */
export interface YearlySimulationData {
  year: number;
  deposits: number;
  incomeBreakdown: Map<string, number>;
  expenseBreakdown: Map<string, number>;
}

/**
 * シミュレーションパラメータ
 * シミュレーターの初期化に必要な設定
 */
export interface SimulationParams {
  initialDeposits: number;
  simulationYears: number;
}

/**
 * シミュレーション結果
 * 完全なシミュレーション実行の出力
 */
export interface SimulationResult {
  yearlyData: YearlySimulationData[];
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
   * 特定の年の予測データを取得
   * @param year - 取得したい年（1から始まる）
   */
  getYearlyProjection(year: number): YearlySimulationData | undefined;

  /**
   * 現在の月次キャッシュフローを取得
   */
  getCurrentMonthlyCashFlow(): { income: number; expense: number; net: number };
}
