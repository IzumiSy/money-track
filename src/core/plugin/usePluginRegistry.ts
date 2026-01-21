import { globalRegistry } from "./defaultRegistry";
import type { PluginRegistry } from "./registry";

/**
 * プラグインレジストリにアクセスするフック
 *
 * グローバルレジストリ（シングルトン）を返す
 */
export function usePluginRegistry(): PluginRegistry {
  return globalRegistry;
}
