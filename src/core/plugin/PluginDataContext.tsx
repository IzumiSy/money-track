import { createContext, useContext, ReactNode, useCallback } from "react";
import { useSimulation } from "@/features/simulator/context";
import {
  SourcePlugin,
  PluginContextValue,
  PluginDataTypeMap,
} from "@/core/plugin/types";
import { SIMULATION_ACTION_TYPES } from "@/features/simulator/types";

const PluginDataContext = createContext<PluginContextValue | undefined>(
  undefined,
);

interface PluginProviderProps<K extends keyof PluginDataTypeMap> {
  plugin: SourcePlugin<PluginDataTypeMap[K]>;
  children: ReactNode;
}

/**
 * プラグインデータを提供するプロバイダー
 *
 * @template K - PluginDataTypeMapのキー
 */
export function PluginProvider<K extends keyof PluginDataTypeMap>({
  plugin,
  children,
}: PluginProviderProps<K>) {
  const { state, dispatch } = useSimulation();

  // プラグインタイプに応じたデータを取得（型安全）
  const getData = useCallback((): PluginDataTypeMap[K][] => {
    return state.currentData.pluginData[plugin.type] as PluginDataTypeMap[K][];
  }, [plugin.type, state.currentData.pluginData]);

  // データをupsert（汎用アクション）
  const upsert = useCallback(
    (groupId: string, items: PluginDataTypeMap[K][]) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPSERT_PLUGIN_DATA,
        payload: {
          pluginType: plugin.type,
          groupId,
          items,
        },
      });
    },
    [dispatch, plugin.type],
  );

  // グループIDでフィルタしたデータを取得
  const getByGroupId = useCallback(
    (groupId: string): PluginDataTypeMap[K][] => {
      const data = getData();
      if (!plugin.getGroupId) {
        return data;
      }
      return data.filter((item) => plugin.getGroupId!(item) === groupId);
    },
    [getData, plugin],
  );

  // 他のプラグインのデータにアクセス（型安全）
  const getOtherPluginData = useCallback(
    <T extends keyof PluginDataTypeMap>(
      pluginType: T,
      groupId?: string,
    ): PluginDataTypeMap[T][] => {
      const data = state.currentData.pluginData[pluginType];

      if (groupId) {
        return data.filter(
          (item) => (item as { groupId?: string }).groupId === groupId,
        );
      }
      return data;
    },
    [state.currentData.pluginData],
  );

  const value: PluginContextValue<PluginDataTypeMap[K]> = {
    plugin: plugin as SourcePlugin<PluginDataTypeMap[K]>,
    data: getData(),
    upsert,
    getByGroupId,
    getOtherPluginData,
  };

  return (
    <PluginDataContext.Provider value={value as PluginContextValue}>
      {children}
    </PluginDataContext.Provider>
  );
}

/**
 * プラグインのデータにアクセスする型安全なフック
 * PluginProvider内で使用する
 *
 * @template K - PluginDataTypeMapのキー（"income" | "expense" | "asset" | "liability"）
 */
export function usePluginData<
  K extends keyof PluginDataTypeMap,
>(): PluginContextValue<PluginDataTypeMap[K]> {
  const context = useContext(PluginDataContext);

  if (!context) {
    throw new Error(
      "usePluginData must be used within a PluginProvider. " +
        "Make sure your component is rendered inside a plugin page.",
    );
  }

  return context as PluginContextValue<PluginDataTypeMap[K]>;
}
