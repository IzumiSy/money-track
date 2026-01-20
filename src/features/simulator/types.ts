import { Group } from "@/features/group/types";
import { PluginDataTypeMap } from "@/core/plugin/types";

// ============================================
// シミュレーター関連の型
// ============================================

/**
 * 月次シミュレーションデータ
 * 特定の月における財務状態を表す
 */
export interface MonthlySimulationData {
  monthIndex: number;
  incomeBreakdown: Map<string, number>;
  expenseBreakdown: Map<string, number>;
  assetBalances: Map<string, number>;
  liabilityBalances: Map<string, number>;
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

// ============================================
// 状態管理関連の型（SimulationContext用）
// ============================================

/**
 * プラグインデータの型安全なストア
 * PluginDataTypeMapの各キーに対して配列を持つ
 */
export type PluginDataStore = {
  [K in keyof PluginDataTypeMap]: PluginDataTypeMap[K][];
};

/**
 * シミュレーションのアクションタイプ定数
 */
export const SIMULATION_ACTION_TYPES = {
  // グループ関連
  ADD_GROUP: "ADD_GROUP",
  UPDATE_GROUP: "UPDATE_GROUP",
  DELETE_GROUP: "DELETE_GROUP",

  // プラグインデータ用の汎用アクション
  UPSERT_PLUGIN_DATA: "UPSERT_PLUGIN_DATA",

  // シミュレーション管理
  SAVE_SIMULATION: "SAVE_SIMULATION",
  LOAD_SIMULATION: "LOAD_SIMULATION",
  DELETE_SIMULATION: "DELETE_SIMULATION",
  UPDATE_SIMULATION_NAME: "UPDATE_SIMULATION_NAME",
  RESET_CURRENT_DATA: "RESET_CURRENT_DATA",
  SET_ALL_DATA: "SET_ALL_DATA",
  INITIALIZE_SIMULATION: "INITIALIZE_SIMULATION",
} as const;

/**
 * 現在編集中のデータ
 */
export interface SimulationCurrentData {
  groups: Group[];
  pluginData: PluginDataStore;
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
 * プラグインデータupsert用のペイロード型
 */
export type UpsertPluginDataPayload<K extends keyof PluginDataTypeMap> = {
  pluginType: K;
  groupId: string;
  items: PluginDataTypeMap[K][];
};

/**
 * シミュレーションのアクションタイプ
 */
export type SimulationAction =
  // グループ関連
  | { type: typeof SIMULATION_ACTION_TYPES.ADD_GROUP; payload: Group }
  | {
      type: typeof SIMULATION_ACTION_TYPES.UPDATE_GROUP;
      payload: { id: string; updates: Partial<Group> };
    }
  | { type: typeof SIMULATION_ACTION_TYPES.DELETE_GROUP; payload: string }

  // プラグインデータ（汎用）
  | {
      type: typeof SIMULATION_ACTION_TYPES.UPSERT_PLUGIN_DATA;
      payload: UpsertPluginDataPayload<keyof PluginDataTypeMap>;
    }

  // シミュレーション管理
  | {
      type: typeof SIMULATION_ACTION_TYPES.SAVE_SIMULATION;
      payload: { name: string };
    }
  | { type: typeof SIMULATION_ACTION_TYPES.LOAD_SIMULATION; payload: string }
  | { type: typeof SIMULATION_ACTION_TYPES.DELETE_SIMULATION; payload: string }
  | {
      type: typeof SIMULATION_ACTION_TYPES.UPDATE_SIMULATION_NAME;
      payload: { id: string; name: string };
    }
  | { type: typeof SIMULATION_ACTION_TYPES.RESET_CURRENT_DATA }
  | {
      type: typeof SIMULATION_ACTION_TYPES.SET_ALL_DATA;
      payload: SimulationCurrentData;
    }
  | { type: typeof SIMULATION_ACTION_TYPES.INITIALIZE_SIMULATION };

// ============================================
// デフォルトカラー定数
// ============================================

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
