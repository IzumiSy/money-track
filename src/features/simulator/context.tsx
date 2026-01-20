import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import {
  SimulationState,
  SimulationAction,
  SimulationData,
  SimulationCurrentData,
  PluginDataStore,
  SIMULATION_ACTION_TYPES,
} from "./types";
import { PluginDataTypeMap } from "@/core/plugin/types";

interface SimulationContextType {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationAction>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(
  undefined,
);

// 空のプラグインデータストア
const emptyPluginDataStore: PluginDataStore = {
  income: [],
  expense: [],
  asset: [],
  liability: [],
};

// 初期状態
const initialState: SimulationState = {
  currentData: {
    groups: [],
    pluginData: { ...emptyPluginDataStore },
  },
  savedSimulations: [],
  activeSimulationId: null,
};

/**
 * プラグインデータのupsert処理
 * 型安全性を維持しつつ汎用的に処理
 */
function upsertPluginData<K extends keyof PluginDataTypeMap>(
  currentPluginData: PluginDataStore,
  pluginType: K,
  groupId: string,
  items: PluginDataTypeMap[K][],
): PluginDataStore {
  const existingData = currentPluginData[pluginType];

  // groupId以外のデータを保持
  const otherGroupData = existingData.filter(
    (item) => (item as { groupId: string }).groupId !== groupId,
  );

  // 新しいアイテムにID付与などの処理
  const processedItems = items.map((item) => {
    const typedItem = item as { id?: string; groupId?: string };
    if (!typedItem.id || typedItem.id.startsWith("temp-")) {
      return {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        groupId,
      } as PluginDataTypeMap[K];
    }
    return { ...item, groupId } as PluginDataTypeMap[K];
  });

  return {
    ...currentPluginData,
    [pluginType]: [...otherGroupData, ...processedItems],
  };
}

// Reducer関数
function simulationReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  switch (action.type) {
    // グループ関連
    case SIMULATION_ACTION_TYPES.ADD_GROUP:
      return {
        ...state,
        currentData: {
          ...state.currentData,
          groups: [...state.currentData.groups, action.payload],
        },
      };

    case SIMULATION_ACTION_TYPES.UPDATE_GROUP:
      return {
        ...state,
        currentData: {
          ...state.currentData,
          groups: state.currentData.groups.map((group) =>
            group.id === action.payload.id
              ? { ...group, ...action.payload.updates }
              : group,
          ),
        },
      };

    case SIMULATION_ACTION_TYPES.DELETE_GROUP: {
      const groupId = action.payload;
      // 全プラグインデータからgroupIdに紐づくデータを削除
      const currentPluginData = state.currentData.pluginData;
      const newPluginData: PluginDataStore = {
        income: currentPluginData.income.filter(
          (item) => item.groupId !== groupId,
        ),
        expense: currentPluginData.expense.filter(
          (item) => item.groupId !== groupId,
        ),
        asset: currentPluginData.asset.filter(
          (item) => item.groupId !== groupId,
        ),
        liability: currentPluginData.liability.filter(
          (item) => item.groupId !== groupId,
        ),
      };

      return {
        ...state,
        currentData: {
          ...state.currentData,
          groups: state.currentData.groups.filter(
            (group) => group.id !== groupId,
          ),
          pluginData: newPluginData,
        },
      };
    }

    // プラグインデータ（汎用）
    case SIMULATION_ACTION_TYPES.UPSERT_PLUGIN_DATA: {
      const { pluginType, groupId, items } = action.payload;
      return {
        ...state,
        currentData: {
          ...state.currentData,
          pluginData: upsertPluginData(
            state.currentData.pluginData,
            pluginType,
            groupId,
            items,
          ),
        },
      };
    }

    // シミュレーション管理
    case SIMULATION_ACTION_TYPES.SAVE_SIMULATION: {
      const newSimulation: SimulationData = {
        id: Date.now().toString(),
        name: action.payload.name,
        createdAt: new Date(),
        data: { ...state.currentData },
      };

      return {
        ...state,
        savedSimulations: [...state.savedSimulations, newSimulation],
        activeSimulationId: newSimulation.id,
      };
    }

    case SIMULATION_ACTION_TYPES.LOAD_SIMULATION: {
      const simulation = state.savedSimulations.find(
        (sim) => sim.id === action.payload,
      );
      if (!simulation) return state;

      return {
        ...state,
        currentData: { ...simulation.data },
        activeSimulationId: simulation.id,
      };
    }

    case SIMULATION_ACTION_TYPES.DELETE_SIMULATION: {
      const simulationId = action.payload;
      return {
        ...state,
        savedSimulations: state.savedSimulations.filter(
          (sim) => sim.id !== simulationId,
        ),
        activeSimulationId:
          state.activeSimulationId === simulationId
            ? null
            : state.activeSimulationId,
      };
    }

    case SIMULATION_ACTION_TYPES.UPDATE_SIMULATION_NAME: {
      const { id, name } = action.payload;
      return {
        ...state,
        savedSimulations: state.savedSimulations.map((sim) =>
          sim.id === id ? { ...sim, name } : sim,
        ),
      };
    }

    case SIMULATION_ACTION_TYPES.RESET_CURRENT_DATA:
      return {
        ...state,
        currentData: { ...initialState.currentData },
        activeSimulationId: null,
      };

    case SIMULATION_ACTION_TYPES.SET_ALL_DATA:
      return {
        ...state,
        currentData: action.payload,
      };

    case SIMULATION_ACTION_TYPES.INITIALIZE_SIMULATION:
      return {
        ...state,
        currentData: { ...initialState.currentData },
        activeSimulationId: null,
      };

    default:
      return state;
  }
}

/**
 * 旧形式のデータを新形式にマイグレーション
 */
function migrateFromLegacyFormat(legacyData: {
  groups?: unknown[];
  incomes?: unknown[];
  expenses?: unknown[];
  financialAssets?: unknown[];
  liabilities?: unknown[];
  pluginData?: PluginDataStore;
}): SimulationCurrentData {
  // 新形式の場合はそのまま返す
  if (legacyData.pluginData) {
    return {
      groups: (legacyData.groups ?? []) as SimulationCurrentData["groups"],
      pluginData: legacyData.pluginData,
    };
  }

  // 旧形式からマイグレーション
  return {
    groups: (legacyData.groups ?? []) as SimulationCurrentData["groups"],
    pluginData: {
      income: (legacyData.incomes ?? []) as PluginDataTypeMap["income"][],
      expense: (legacyData.expenses ?? []) as PluginDataTypeMap["expense"][],
      asset: (legacyData.financialAssets ?? []) as PluginDataTypeMap["asset"][],
      liability: (legacyData.liabilities ??
        []) as PluginDataTypeMap["liability"][],
    },
  };
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  // LocalStorageからデータを読み込む
  useEffect(() => {
    const savedState = localStorage.getItem("simulationState");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // 日付を復元
        if (parsedState.savedSimulations) {
          parsedState.savedSimulations = parsedState.savedSimulations.map(
            (sim: {
              createdAt: string;
              data: unknown;
              [key: string]: unknown;
            }) => ({
              ...sim,
              createdAt: new Date(sim.createdAt),
              data: migrateFromLegacyFormat(
                sim.data as Record<string, unknown[]>,
              ),
            }),
          );
        }
        // 完全な状態を復元（マイグレーション付き）
        const migratedCurrentData = migrateFromLegacyFormat(
          parsedState.currentData || {},
        );
        dispatch({
          type: SIMULATION_ACTION_TYPES.SET_ALL_DATA,
          payload: migratedCurrentData,
        });
      } catch (error) {
        console.error("Failed to load saved state:", error);
      }
    }
  }, []);

  // 状態が変更されたらLocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem("simulationState", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }, [state]);

  return (
    <SimulationContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
