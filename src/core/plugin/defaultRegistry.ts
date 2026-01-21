import { createPluginRegistry, PluginRegistry } from "./registry";

/**
 * グローバルプラグインレジストリ（シングルトン）
 *
 * プラグインの登録はApp.tsxで行う
 */
export const globalRegistry: PluginRegistry = createPluginRegistry();
