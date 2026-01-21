/**
 * キャッシュフローの変化を表す型
 * Income（収入）とExpense（支出）の増減を同時に表現できる
 */
export interface CashFlowChange {
  /**
   * 収入の増加分（0以上の値）
   */
  income: number;

  /**
   * 支出の増加分（0以上の値）
   */
  expense: number;
}

/**
 * 空のキャッシュフロー変化を作成する
 */
export const createEmptyCashFlowChange = (): CashFlowChange => ({
  income: 0,
  expense: 0,
});

/**
 * 複数のキャッシュフロー変化を合計する
 */
export const sumCashFlowChanges = (
  changes: CashFlowChange[]
): CashFlowChange => {
  return changes.reduce(
    (acc, change) => ({
      income: acc.income + change.income,
      expense: acc.expense + change.expense,
    }),
    createEmptyCashFlowChange()
  );
};
