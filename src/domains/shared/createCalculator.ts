import {
  CalculatorSource,
  CalculatorBreakdown,
  CalculationResult,
} from "./CalculatorSource";
import {
  CashFlowChange,
  createEmptyCashFlowChange,
  sumCashFlowChanges,
} from "./CashFlowChange";

/**
 * 汎用Calculatorインターフェース
 */
export interface Calculator<T extends CalculatorSource> {
  addSource: (source: T) => void;
  removeSource: (id: string) => void;
  calculateTotal: (year: number, month: number) => CashFlowChange;
  getBreakdown: (year: number, month: number) => CalculatorBreakdown;
  calculateForPeriod: (year: number, month: number) => CalculationResult;
  getSources: () => readonly T[];
  getSourceById: (id: string) => T | undefined;
}

/**
 * 汎用Calculator作成ファクトリー関数
 * @returns Calculator<T>インスタンス
 */
export function createCalculator<T extends CalculatorSource>(): Calculator<T> {
  const sources: T[] = [];

  /**
   * ソースを追加または更新する
   * @param source - 追加または更新するソースオブジェクト
   * @description
   * - 同じIDのソースが既に存在する場合は更新
   * - 新規の場合は配列に追加
   * - ソースの重複を防ぐためIDベースで管理
   */
  const addSource = (source: T): void => {
    const existingIndex = sources.findIndex((s) => s.id === source.id);
    if (existingIndex >= 0) {
      sources[existingIndex] = source;
    } else {
      sources.push(source);
    }
  };

  /**
   * 指定されたIDのソースを削除する
   * @param id - 削除するソースのID
   * @description
   * - 指定されたIDに一致するソースを配列から削除
   * - 存在しないIDの場合は何もしない（エラーを投げない）
   */
  const removeSource = (id: string): void => {
    const index = sources.findIndex((s) => s.id === id);
    if (index >= 0) {
      sources.splice(index, 1);
    }
  };

  /**
   * 指定された年月の総計を計算する
   * @param year - 計算対象の年
   * @param month - 計算対象の月（1-12）
   * @returns 全てのアクティブなソースの合計キャッシュフロー
   * @description
   * - 各ソースのcalculateメソッドを呼び出して合計
   * - income/expenseそれぞれを集計
   */
  const calculateTotal = (year: number, month: number): CashFlowChange => {
    const changes = sources.map((source) => source.calculate(year, month));
    return sumCashFlowChanges(changes);
  };

  /**
   * 指定された年月の内訳を取得する
   * @param year - 計算対象の年
   * @param month - 計算対象の月（1-12）
   * @returns ソースIDをキー、CashFlowChangeを値とするオブジェクト
   * @description
   * - 各ソースのIDと計算されたキャッシュフロー変化のマッピングを返す
   * - income/expenseが両方0のソースは内訳に含まれない
   */
  const getBreakdown = (year: number, month: number): CalculatorBreakdown => {
    const breakdown: CalculatorBreakdown = {};
    sources.forEach((source) => {
      const change = source.calculate(year, month);
      if (change.income > 0 || change.expense > 0) {
        breakdown[source.id] = change;
      }
    });
    return breakdown;
  };

  /**
   * 指定された年月の計算結果を取得する
   * @param year - 計算対象の年
   * @param month - 計算対象の月（1-12）
   * @returns 総計、内訳、年月を含む計算結果オブジェクト
   * @description
   * - 内訳と総計を一度に取得できる便利メソッド
   * - 内訳から総計を再計算して整合性を保証
   * - 年月情報も含めて返すことで、結果の追跡が容易
   */
  const calculateForPeriod = (
    year: number,
    month: number
  ): CalculationResult => {
    const breakdown = getBreakdown(year, month);
    const totals = sumCashFlowChanges(Object.values(breakdown));

    return {
      totalIncome: totals.income,
      totalExpense: totals.expense,
      netCashFlow: totals.income - totals.expense,
      breakdown,
      year,
      month,
    };
  };

  /**
   * 全てのソースの読み取り専用コピーを取得する
   * @returns ソースの配列（読み取り専用）
   * @description
   * - 内部のソース配列の浅いコピーを返す
   * - 外部から直接配列を変更できないよう保護
   * - ソースの一覧表示や検証に使用
   */
  const getSources = (): readonly T[] => {
    return [...sources];
  };

  /**
   * 指定されたIDのソースを取得する
   * @param id - 取得するソースのID
   * @returns 見つかったソース、または存在しない場合はundefined
   * @description
   * - ID検索による個別のソースへのアクセス
   * - ソースの詳細確認や個別更新の前処理に使用
   * - 存在しないIDの場合はundefinedを返す（エラーを投げない）
   */
  const getSourceById = (id: string): T | undefined => {
    return sources.find((source) => source.id === id);
  };

  return {
    addSource,
    removeSource,
    calculateTotal,
    getBreakdown,
    calculateForPeriod,
    getSources,
    getSourceById,
  };
}
