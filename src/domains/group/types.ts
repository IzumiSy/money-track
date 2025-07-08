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
  assetSourceId: string; // 収入が加算される資産のID
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
  assetSourceId: string; // 支出が減算される資産のID
}

/**
 * グループに所属する金融資産
 */
export interface GroupedAsset {
  id: string;
  groupId: string;
  name: string;
  returnRate: number;
  color: string;
  baseAmount: number;
  contributionOptions: ContributionOption[];
  withdrawalOptions: WithdrawalOption[];
}

/**
 * 積立オプション
 */
export interface ContributionOption {
  id: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  monthlyAmount: number;
}

/**
 * 引き出しオプション
 */
export interface WithdrawalOption {
  id: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  monthlyAmount: number;
}

import { Cycle } from "@/domains/shared/Cycle";
