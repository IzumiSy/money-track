import { useCallback } from "react";
import { useSimulation } from "./context";
import { SIMULATION_ACTION_TYPES } from "./types";

export function useSimulationManagement() {
  const { state, dispatch } = useSimulation();

  const saveSimulation = useCallback(
    (name: string) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.SAVE_SIMULATION,
        payload: { name },
      });
    },
    [dispatch],
  );

  const loadSimulation = useCallback(
    (id: string) => {
      if (id === "") {
        dispatch({ type: SIMULATION_ACTION_TYPES.RESET_CURRENT_DATA });
      } else {
        dispatch({
          type: SIMULATION_ACTION_TYPES.LOAD_SIMULATION,
          payload: id,
        });
      }
    },
    [dispatch],
  );

  const deleteSimulation = useCallback(
    (id: string) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.DELETE_SIMULATION,
        payload: id,
      });
    },
    [dispatch],
  );

  const updateSimulationName = useCallback(
    (id: string, name: string) => {
      dispatch({
        type: SIMULATION_ACTION_TYPES.UPDATE_SIMULATION_NAME,
        payload: { id, name },
      });
    },
    [dispatch],
  );

  const initializeSimulation = useCallback(() => {
    dispatch({ type: SIMULATION_ACTION_TYPES.INITIALIZE_SIMULATION });
  }, [dispatch]);

  return {
    simulations: state.savedSimulations,
    currentSimulation:
      state.savedSimulations.find(
        (sim) => sim.id === state.activeSimulationId,
      ) || null,
    saveSimulation,
    loadSimulation,
    deleteSimulation,
    updateSimulationName,
    initializeSimulation,
  };
}
