import { useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { Group } from "@/domains/group/types";
import { DEFAULT_GROUP_COLORS } from "@/types/simulation";

export function useGroupManagement() {
  const { state, dispatch } = useSimulation();

  const addGroup = useCallback(
    (group: Omit<Group, "id">) => {
      const newGroup: Group = {
        ...group,
        id: Date.now().toString(),
        color:
          group.color ||
          DEFAULT_GROUP_COLORS[
            state.currentData.groups.length % DEFAULT_GROUP_COLORS.length
          ],
      };

      dispatch({
        type: "ADD_GROUP",
        payload: newGroup,
      });
    },
    [state.currentData.groups.length, dispatch]
  );

  const updateGroup = useCallback(
    (id: string, updates: Partial<Group>) => {
      dispatch({
        type: "UPDATE_GROUP",
        payload: { id, updates },
      });
    },
    [dispatch]
  );

  const deleteGroup = useCallback(
    (id: string) => {
      dispatch({
        type: "DELETE_GROUP",
        payload: id,
      });
    },
    [dispatch]
  );

  const toggleGroupActive = useCallback(
    (id: string) => {
      const group = state.currentData.groups.find((g) => g.id === id);
      if (group) {
        dispatch({
          type: "UPDATE_GROUP",
          payload: { id, updates: { isActive: !group.isActive } },
        });
      }
    },
    [state.currentData.groups, dispatch]
  );

  const getGroupById = useCallback(
    (id: string) => {
      return state.currentData.groups.find((group) => group.id === id);
    },
    [state.currentData.groups]
  );

  const getActiveGroups = useCallback(() => {
    return state.currentData.groups.filter((group) => group.isActive);
  }, [state.currentData.groups]);

  return {
    groups: state.currentData.groups,
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroupActive,
    getGroupById,
    getActiveGroups,
  };
}
