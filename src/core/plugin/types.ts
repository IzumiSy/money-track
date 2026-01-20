import { ComponentType } from "react";
import { CalculatorSource } from "@/core/calculator/CalculatorSource";
import { CashFlowChange } from "@/core/calculator/CashFlowChange";
import {
  GroupedAsset,
  GroupedExpense,
  GroupedIncome,
  GroupedLiability,
} from "@/features/group/types";

/**
 * プラグインデータ型のマッピング
 * 新規プラグイン追加時はモジュール拡張で型を追加する
 *
 * @example
 * // domains/crypto/plugin.ts
 * declare module "@/domains/shared/plugin/types" {
 *   interface PluginDataTypeMap {
 *     crypto: GroupedCrypto;
 *   }
 * }
 */
export interface PluginDataTypeMap {
  income: GroupedIncome;
  expense: GroupedExpense;
  asset: GroupedAsset;
  liability: GroupedLiability;
}

/**
 * サイドバー/ルーティングに追加されるページ情報
 */
export interface PluginPageInfo {
  /** ルートパス（例: "/dashboard/income"） */
  path: string;
  /** サイドバーに表示するラベル */
  label: string;
  /** サイドバーの表示順序（小さいほど上） */
  order?: number;
  /** ページコンポーネント */
  component: ComponentType;
  /** アイコン（SVGコンポーネント） */
  icon?: ComponentType<{ className?: string }>;
}

/**
 * チャート表示設定
 */
export interface ChartBarConfig {
  /** データキーのプレフィックス（例: "investment_", "income_"） */
  dataKeyPrefix: string;
  /** スタックグループID（同じIDのバーは積み上げ表示） */
  stackId: string;
  /** バーのカテゴリ */
  category: "balance" | "income" | "expense";
  /** カテゴリ内での表示優先度（小さいほど先） */
  priority?: number;
  /** 表示名のサフィックス（オプション） */
  nameSuffix?: string;
  /** 透明度 */
  opacity?: number;
}

/**
 * シミュレーション中の月次処理コンテキスト
 */
export interface MonthlyProcessingContext {
  /** 現在の月インデックス */
  monthIndex: number;
  /** 処理中のソース */
  source: CalculatorSource;
  /** このソースのキャッシュフロー変化 */
  cashFlowChange: CashFlowChange;
  /** 資産残高マップ（資産ID -> 残高） */
  assetBalances: Map<string, number>;
  /** 負債残高マップ（負債ID -> 残高） */
  liabilityBalances: Map<string, number>;
  /** 収入内訳マップ（収入キー -> 金額） */
  incomeBreakdown: Map<string, number>;
  /** 支出内訳マップ（支出キー -> 金額） */
  expenseBreakdown: Map<string, number>;
  /** 全ソース（読み取り専用） */
  allSources: readonly CalculatorSource[];
}

/**
 * 月末処理用のコンテキスト（ソース単位ではない）
 */
export type PostMonthlyContext = Omit<
  MonthlyProcessingContext,
  "source" | "cashFlowChange"
>;

/**
 * ソースプラグインインターフェース
 */
export interface SourcePlugin<TData = unknown> {
  // ===== Identity =====
  /** プラグインが処理するソースタイプ */
  readonly type: keyof PluginDataTypeMap;
  /** プラグインの表示名 */
  readonly displayName: string;
  /** アイコン（Emoji） */
  readonly icon?: string;
  /** プラグインの説明 */
  readonly description?: string;
  /** このプラグインが依存する他プラグインのtype */
  readonly dependencies?: ReadonlyArray<keyof PluginDataTypeMap>;

  // ===== Simulation Logic (Pure) =====
  /** ドメインデータからCalculatorSourceを生成 */
  createSource(data: TData): CalculatorSource;
  /** 初期残高を取得（残高を持つソースタイプ用） */
  getInitialBalance?(source: CalculatorSource): number;
  /** 月次キャッシュフロー計算後の効果を適用 */
  applyMonthlyEffect?(context: MonthlyProcessingContext): void;
  /** 月末処理（全ソースの処理完了後に実行） */
  postMonthlyProcess?(context: PostMonthlyContext): void;

  // ===== Chart Display =====
  /** チャート表示用の設定を返す */
  getChartConfig?(): ChartBarConfig[];
  /** チャートの凡例に表示する名前を返す */
  getDisplayName?(source: CalculatorSource): string;

  // ===== UI Integration =====
  /** ページ情報（サイドバー・ルーティング用） */
  pageInfo: PluginPageInfo;

  // ===== Data Access =====
  /** データからgroupIdを取得（グループスコープのプラグイン用） */
  getGroupId?(data: TData): string;
  /** グループに属するデータかどうか（デフォルト: true） */
  readonly isGroupScoped?: boolean;
}

/**
 * プラグインコンテキストの値
 */
export interface PluginContextValue<TData = unknown> {
  /** 現在のプラグイン */
  plugin: SourcePlugin<TData>;

  /** このプラグインタイプのデータ（全データ） */
  data: TData[];

  /** データの更新（upsert） */
  upsert: (groupId: string, items: TData[]) => void;

  /** グループIDでフィルタしたデータを取得 */
  getByGroupId: (groupId: string) => TData[];

  /** 他のプラグインのデータにアクセス */
  getOtherPluginData: <K extends keyof PluginDataTypeMap>(
    pluginType: K,
    groupId?: string,
  ) => PluginDataTypeMap[K][];
}
