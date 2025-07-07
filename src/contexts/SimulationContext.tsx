"use client";

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
  DEFAULT_INCOME_COLORS,
  DEFAULT_EXPENSE_COLORS,
  DEFAULT_ASSET_COLORS,
  SIMULATION_ACTION_TYPES,
} from "@/types/simulation";

interface SimulationContextType {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationAction>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(
  undefined
);

// 初期状態
const initialState: SimulationState = {
  currentData: {
    groups: [],
    expenses: [],
    incomes: [],
    financialAssets: [],
  },
  savedSimulations: [],
  activeSimulationId: null,
};

// Reducer関数
function simulationReducer(
  state: SimulationState,
  action: SimulationAction
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
              : group
          ),
        },
      };

    case SIMULATION_ACTION_TYPES.DELETE_GROUP: {
      const groupId = action.payload;
      return {
        ...state,
        currentData: {
          ...state.currentData,
          groups: state.currentData.groups.filter(
            (group) => group.id !== groupId
          ),
          incomes: state.currentData.incomes.filter(
            (income) => income.groupId !== groupId
          ),
          expenses: state.currentData.expenses.filter(
            (expense) => expense.groupId !== groupId
          ),
          financialAssets: state.currentData.financialAssets.filter(
            (asset) => asset.groupId !== groupId
          ),
        },
      };
    }

    // 収入関連
    case SIMULATION_ACTION_TYPES.UPSERT_INCOMES: {
      const { groupId, incomes } = action.payload;
      const otherGroupIncomes = state.currentData.incomes.filter(
        (income) => income.groupId !== groupId
      );

      const processedIncomes = incomes.map((income, index) => {
        if (!income.id || income.id.startsWith("temp-")) {
          return {
            ...income,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            groupId,
            color:
              income.color ||
              DEFAULT_INCOME_COLORS[index % DEFAULT_INCOME_COLORS.length],
          };
        }
        return {
          ...income,
          groupId,
        };
      });

      return {
        ...state,
        currentData: {
          ...state.currentData,
          incomes: [...otherGroupIncomes, ...processedIncomes],
        },
      };
    }

    // 支出関連
    case SIMULATION_ACTION_TYPES.UPSERT_EXPENSES: {
      const { groupId, expenses } = action.payload;
      const otherGroupExpenses = state.currentData.expenses.filter(
        (expense) => expense.groupId !== groupId
      );

      const processedExpenses = expenses.map((expense, index) => {
        if (!expense.id || expense.id.startsWith("temp-")) {
          return {
            ...expense,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            groupId,
            color:
              expense.color ||
              DEFAULT_EXPENSE_COLORS[index % DEFAULT_EXPENSE_COLORS.length],
          };
        }
        return {
          ...expense,
          groupId,
        };
      });

      return {
        ...state,
        currentData: {
          ...state.currentData,
          expenses: [...otherGroupExpenses, ...processedExpenses],
        },
      };
    }

    // 資産関連
    case SIMULATION_ACTION_TYPES.UPSERT_ASSETS: {
      const { groupId, assets } = action.payload;
      const otherGroupAssets = state.currentData.financialAssets.filter(
        (asset) => asset.groupId !== groupId
      );

      const processedAssets = assets.map((asset, index) => {
        if (!asset.id || asset.id.startsWith("temp-")) {
          return {
            ...asset,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            groupId,
            color:
              asset.color ||
              DEFAULT_ASSET_COLORS[index % DEFAULT_ASSET_COLORS.length],
            baseAmount: asset.baseAmount ?? 0,
            contributionOptions: asset.contributionOptions ?? [],
            withdrawalOptions: asset.withdrawalOptions ?? [],
          };
        }
        return {
          ...asset,
          groupId,
          baseAmount: asset.baseAmount ?? 0,
          contributionOptions: asset.contributionOptions ?? [],
          withdrawalOptions: asset.withdrawalOptions ?? [],
        };
      });

      return {
        ...state,
        currentData: {
          ...state.currentData,
          financialAssets: [...otherGroupAssets, ...processedAssets],
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
        (sim) => sim.id === action.payload
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
          (sim) => sim.id !== simulationId
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
          sim.id === id ? { ...sim, name } : sim
        ),
      };
    }

    case SIMULATION_ACTION_TYPES.RESET_CURRENT_DATA:
      return {
        ...state,
        currentData: initialState.currentData,
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
        currentData: initialState.currentData,
        activeSimulationId: null,
      };

    default:
      return state;
  }
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
            (sim: { createdAt: string; [key: string]: unknown }) => ({
              ...sim,
              createdAt: new Date(sim.createdAt),
            })
          );
        }
        // 完全な状態を復元
        dispatch({
          type: SIMULATION_ACTION_TYPES.SET_ALL_DATA,
          payload: parsedState.currentData || initialState.currentData,
        });
        // Note: savedSimulationsの復元は現在のreducerでは対応していないため、
        // 必要に応じて新しいアクションを追加する必要があります
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
