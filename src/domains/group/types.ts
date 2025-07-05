/**
 * グループを表す型
 * 収入と支出をまとめる親概念
 */
export interface Group {
  id: string;
  name: string;
  color: string;
  isActive: boolean; // グラフ表示のON/OFF
}

/**
 * グループに所属する収入
 */
export interface GroupedIncome {
  id: string;
  groupId: string;
  name: string;
  cycles: Cycle[];
  color: string;
}

/**
 * グループに所属する支出
 */
export interface GroupedExpense {
  id: string;
  groupId: string;
  name: string;
  cycles: Cycle[];
  color: string;
}

import { Cycle } from "@/domains/shared/Cycle";
