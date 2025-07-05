import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";

export function useSimulationManagement() {
  const { state, dispatch } = useSimulation();

  const saveSimulation = useCallback(
    (name: string) => {
      dispatch({
        type: "SAVE_SIMULATION",
        payload: { name },
      });
    },
    [dispatch]
  );

  const loadSimulation = useCallback(
    (id: string) => {
      if (id === "") {
        dispatch({ type: "RESET_CURRENT_DATA" });
      } else {
        dispatch({
          type: "LOAD_SIMULATION",
          payload: id,
        });
      }
    },
    [dispatch]
  );

  const deleteSimulation = useCallback(
    (id: string) => {
      dispatch({
        type: "DELETE_SIMULATION",
        payload: id,
      });
    },
    [dispatch]
  );

  const updateSimulationName = useCallback(
    (id: string, name: string) => {
      dispatch({
        type: "UPDATE_SIMULATION_NAME",
        payload: { id, name },
      });
    },
    [dispatch]
  );

  const clearAllData = useCallback(() => {
    dispatch({ type: "RESET_CURRENT_DATA" });
  }, [dispatch]);

  return {
    simulations: state.savedSimulations,
    currentSimulation:
      state.savedSimulations.find(
        (sim) => sim.id === state.activeSimulationId
      ) || null,
    saveSimulation,
    loadSimulation,
    deleteSimulation,
    updateSimulationName,
    clearAllData,
  };
}
