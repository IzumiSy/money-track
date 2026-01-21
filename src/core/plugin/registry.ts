import { SourcePlugin, PluginDataTypeMap } from "./types";

/**
 * プラグインレジストリインターフェース
 */
export interface PluginRegistry {
  /** プラグインを登録 */
  register<K extends keyof PluginDataTypeMap>(
    plugin: SourcePlugin<PluginDataTypeMap[K]>,
  ): void;
  /** プラグインを登録解除 */
  unregister(type: keyof PluginDataTypeMap): void;
  /** タイプからプラグインを取得 */
  getPlugin<K extends keyof PluginDataTypeMap>(
    type: K,
  ): SourcePlugin<PluginDataTypeMap[K]> | undefined;
  /** 全プラグインを取得 */
  getAllPlugins(): SourcePlugin[];
  /** プラグインが登録されているか確認 */
  hasPlugin(type: keyof PluginDataTypeMap): boolean;
  /** 依存関係順にソートされた全プラグインを取得 */
  getAllPluginsSorted(): SourcePlugin[];
}

/**
 * トポロジカルソート（依存関係順）
 */
function topologicalSort(plugins: Map<string, SourcePlugin>): SourcePlugin[] {
  const result: SourcePlugin[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(type: string): void {
    if (visited.has(type)) return;
    if (visiting.has(type)) {
      throw new Error(`Circular dependency detected involving "${type}"`);
    }

    const plugin = plugins.get(type);
    if (!plugin) return;

    visiting.add(type);

    // 依存プラグインを先に処理
    plugin.dependencies?.forEach((dep) => {
      visit(dep as string);
    });

    visiting.delete(type);
    visited.add(type);
    result.push(plugin);
  }

  plugins.forEach((_, type) => visit(type));
  return result;
}

/**
 * プラグインレジストリを作成
 */
export function createPluginRegistry(): PluginRegistry {
  const plugins = new Map<string, SourcePlugin>();

  return {
    register<K extends keyof PluginDataTypeMap>(
      plugin: SourcePlugin<PluginDataTypeMap[K]>,
    ): void {
      // 依存プラグインが全て登録済みかチェック
      const missing = plugin.dependencies?.filter(
        (dep) => !plugins.has(dep as string),
      );
      if (missing && missing.length > 0) {
        throw new Error(
          `Plugin "${plugin.type}" requires: ${missing.join(", ")}`,
        );
      }

      if (plugins.has(plugin.type as string)) {
        console.warn(
          `Plugin for type "${plugin.type}" already registered. Overwriting.`,
        );
      }
      plugins.set(plugin.type as string, plugin as SourcePlugin);
    },

    unregister(type: keyof PluginDataTypeMap): void {
      plugins.delete(type as string);
    },

    getPlugin<K extends keyof PluginDataTypeMap>(
      type: K,
    ): SourcePlugin<PluginDataTypeMap[K]> | undefined {
      return plugins.get(type as string) as
        | SourcePlugin<PluginDataTypeMap[K]>
        | undefined;
    },

    getAllPlugins(): SourcePlugin[] {
      return Array.from(plugins.values());
    },

    hasPlugin(type: keyof PluginDataTypeMap): boolean {
      return plugins.has(type as string);
    },

    getAllPluginsSorted(): SourcePlugin[] {
      return topologicalSort(plugins);
    },
  };
}
