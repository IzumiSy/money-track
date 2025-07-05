import { Group, GroupedExpense, GroupedIncome } from "@/domains/group/types";
import { FinancialAssets } from "@/components/FinancialAssetsForm";

/**
 * 現在編集中のデータ
 */
export interface SimulationCurrentData {
  groups: Group[];
  expenses: GroupedExpense[];
  incomes: GroupedIncome[];
  financialAssets: FinancialAssets;
}

/**
 * 保存されたシミュレーションデータ
 */
export interface SimulationData {
  id: string;
  name: string;
  createdAt: Date;
  data: SimulationCurrentData;
}

/**
 * シミュレーション全体の状態
 */
export interface SimulationState {
  currentData: SimulationCurrentData;
  savedSimulations: SimulationData[];
  activeSimulationId: string | null;
}

/**
 * シミュレーションのアクションタイプ
 */
export type SimulationAction =
  // グループ関連
  | { type: "SET_GROUPS"; payload: Group[] }
  | { type: "ADD_GROUP"; payload: Group }
  | { type: "UPDATE_GROUP"; payload: { id: string; updates: Partial<Group> } }
  | { type: "DELETE_GROUP"; payload: string }

  // 収入関連
  | { type: "SET_INCOMES"; payload: GroupedIncome[] }
  | {
      type: "UPSERT_INCOMES";
      payload: { groupId: string; incomes: GroupedIncome[] };
    }

  // 支出関連
  | { type: "SET_EXPENSES"; payload: GroupedExpense[] }
  | {
      type: "UPSERT_EXPENSES";
      payload: { groupId: string; expenses: GroupedExpense[] };
    }

  // 資産関連
  | { type: "SET_FINANCIAL_ASSETS"; payload: FinancialAssets }

  // シミュレーション管理
  | { type: "SAVE_SIMULATION"; payload: { name: string } }
  | { type: "LOAD_SIMULATION"; payload: string }
  | { type: "DELETE_SIMULATION"; payload: string }
  | { type: "UPDATE_SIMULATION_NAME"; payload: { id: string; name: string } }
  | { type: "RESET_CURRENT_DATA" }
  | { type: "SET_ALL_DATA"; payload: SimulationCurrentData }
  | { type: "INITIALIZE_SIMULATION" };

/**
 * デフォルトのグループ色
 */
export const DEFAULT_GROUP_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

/**
 * デフォルトの収入色（緑系）
 */
export const DEFAULT_INCOME_COLORS = [
  "#10B981", // Green
  "#059669", // Emerald
  "#16A34A", // Green-600
  "#22C55E", // Green-500
  "#84CC16", // Lime
  "#65A30D", // Lime-600
  "#15803D", // Green-700
  "#047857", // Emerald-700
];

/**
 * デフォルトの支出色（赤系）
 */
export const DEFAULT_EXPENSE_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#DC2626", // Red-600
  "#EA580C", // Orange-600
  "#D97706", // Amber-600
  "#DB2777", // Pink-600
];

/**
 * デフォルトの資産色
 */
export const DEFAULT_ASSET_COLORS = [
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#EC4899", // Pink
  "#84CC16", // Lime
];
