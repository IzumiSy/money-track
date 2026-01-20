import { PluginRegistry } from "./registry";
import { ChartBarConfig } from "./types";

/**
 * チャートバー定義
 */
export interface ChartBarDefinition {
  key: string;
  dataKey: string;
  stackId: string;
  fill: string;
  name: string;
  opacity: number;
  category: "balance" | "income" | "expense";
  priority: number;
}

/**
 * ソースデータのマッピング情報
 */
export interface SourceDataInfo {
  id: string;
  name: string;
  color: string;
  groupId: string;
}

/** カテゴリの表示順序 */
const CATEGORY_ORDER: Record<ChartBarConfig["category"], number> = {
  balance: 0,
  income: 1,
  expense: 2,
};

/**
 * プラグインからチャートバー定義を生成
 *
 * @param registry - プラグインレジストリ
 * @param simulationData - シミュレーション結果データ
 * @param sourceDataMap - ソースID -> ソース情報のマップ
 * @param activeGroupIds - アクティブなグループIDのリスト
 * @returns チャートバー定義の配列
 */
export function generateChartBars(
  registry: PluginRegistry,
  simulationData: Record<string, unknown>[],
  sourceDataMap: Map<string, SourceDataInfo>,
  activeGroupIds: string[],
): ChartBarDefinition[] {
  const bars: ChartBarDefinition[] = [];

  if (simulationData.length === 0) return bars;

  const dataKeys = Object.keys(simulationData[0]);

  registry.getAllPlugins().forEach((plugin) => {
    const chartConfigs = plugin.getChartConfig?.() ?? [];

    chartConfigs.forEach((config) => {
      dataKeys
        .filter((key) => key.startsWith(config.dataKeyPrefix))
        .forEach((dataKey) => {
          const sourceId = dataKey.replace(config.dataKeyPrefix, "");
          const sourceData = sourceDataMap.get(sourceId);

          if (!sourceData || !activeGroupIds.includes(sourceData.groupId)) {
            return;
          }

          bars.push({
            key: dataKey,
            dataKey,
            stackId: config.stackId,
            fill: sourceData.color,
            name: sourceData.name + (config.nameSuffix ?? ""),
            opacity: config.opacity ?? 1,
            category: config.category,
            priority: config.priority ?? 99,
          });
        });
    });
  });

  // カテゴリ順、優先度順、名前順でソート
  return bars.sort((a, b) => {
    const categoryDiff =
      CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    if (categoryDiff !== 0) return categoryDiff;

    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;

    return a.name.localeCompare(b.name);
  });
}

/**
 * ソースからSourceDataInfoマップを構築
 */
export function buildSourceDataMap(
  sources: Array<{
    id: string;
    name: string;
    getMetadata?: () => Record<string, unknown>;
  }>,
  getGroupId: (source: {
    id: string;
    name: string;
    getMetadata?: () => Record<string, unknown>;
  }) => string | undefined,
): Map<string, SourceDataInfo> {
  const map = new Map<string, SourceDataInfo>();

  sources.forEach((source) => {
    const metadata = source.getMetadata?.();
    const color = (metadata?.color as string) ?? "#808080";
    const groupId = getGroupId(source);

    if (groupId) {
      map.set(source.id, {
        id: source.id,
        name: source.name,
        color,
        groupId,
      });
    }
  });

  return map;
}
