import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSimulatorPage } from "./page";
import { useGroupManagement } from "@/features/group/hooks";
import { useSimulation } from "@/features/simulator/context";
import { usePluginRegistry } from "@/core/plugin/usePluginRegistry";
import * as financialSimulation from "./financialSimulation";

// モック
vi.mock("@/features/group/hooks", () => ({
  useGroupManagement: vi.fn(),
}));

vi.mock("@/features/simulator/context", () => ({
  useSimulation: vi.fn(),
}));

vi.mock("@/core/plugin/usePluginRegistry", () => ({
  usePluginRegistry: vi.fn(),
}));

// financialSimulation のモック
vi.spyOn(financialSimulation, "runFinancialSimulation");

const mockUseGroupManagement = useGroupManagement as Mock;
const mockUseSimulation = useSimulation as Mock;
const mockUsePluginRegistry = usePluginRegistry as Mock;
const mockRunFinancialSimulation =
  financialSimulation.runFinancialSimulation as Mock;

describe("useSimulatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック設定
    mockUsePluginRegistry.mockReturnValue({
      getAllPlugins: () => [],
    });

    // デフォルトでhasData: falseを返す
    mockRunFinancialSimulation.mockReturnValue({
      simulationData: [],
      hasData: false,
    });
  });

  describe("データがない場合", () => {
    beforeEach(() => {
      mockUseGroupManagement.mockReturnValue({
        getActiveGroups: () => [],
      });
      mockUseSimulation.mockReturnValue({
        state: {
          currentData: {
            pluginData: {},
          },
        },
      });
    });

    it("hasDataがfalseを返す", () => {
      const { result } = renderHook(() => useSimulatorPage());

      expect(result.current.hasData).toBe(false);
      expect(result.current.activeGroups).toEqual([]);
      expect(result.current.simulationData).toEqual([]);
    });

    it("デフォルトのsimulationYearsは30", () => {
      const { result } = renderHook(() => useSimulatorPage());

      expect(result.current.simulationYears).toBe(30);
    });
  });

  describe("データがある場合", () => {
    const mockAsset = {
      id: "asset1",
      groupId: "group1",
      name: "テスト資産",
      color: "#10B981",
      baseAmount: 1000000,
      returnRate: 0.05,
      contributionOptions: [],
      withdrawalOptions: [],
    };

    const mockGroup = { id: "group1", name: "テストグループ", isActive: true };

    beforeEach(() => {
      mockUseGroupManagement.mockReturnValue({
        getActiveGroups: () => [mockGroup],
      });
      mockUseSimulation.mockReturnValue({
        state: {
          currentData: {
            pluginData: {
              asset: [mockAsset],
            },
          },
        },
      });
      mockUsePluginRegistry.mockReturnValue({
        getAllPlugins: () => [
          {
            type: "asset",
            displayName: "資産",
            chartConfig: { stackId: "a", opacity: 1 },
          },
        ],
      });

      mockRunFinancialSimulation.mockReturnValue({
        simulationData: [
          { year: "1年目", balance_asset_asset1: 1050000 },
          { year: "2年目", balance_asset_asset1: 1102500 },
        ],
        hasData: true,
      });
    });

    it("hasDataがtrueを返す", () => {
      const { result } = renderHook(() => useSimulatorPage());

      expect(result.current.hasData).toBe(true);
    });

    it("activeGroupsが正しく取得できる", () => {
      const { result } = renderHook(() => useSimulatorPage());

      expect(result.current.activeGroups).toEqual([mockGroup]);
    });

    it("simulationDataが正しく取得できる", () => {
      const { result } = renderHook(() => useSimulatorPage());

      expect(result.current.simulationData).toHaveLength(2);
      expect(result.current.simulationData[0].year).toBe("1年目");
    });

    it("setSimulationYearsで期間を変更できる", () => {
      const { result } = renderHook(() => useSimulatorPage());

      expect(result.current.simulationYears).toBe(30);

      act(() => {
        result.current.setSimulationYears(50);
      });

      expect(result.current.simulationYears).toBe(50);
    });

    it("simulationYearsが変更されるとrunFinancialSimulationが再実行される", () => {
      const { result, rerender } = renderHook(() => useSimulatorPage());

      // 初回呼び出し
      expect(mockRunFinancialSimulation).toHaveBeenCalledWith(
        expect.anything(),
        30,
        ["group1"],
      );

      act(() => {
        result.current.setSimulationYears(50);
      });

      rerender();

      // 変更後の呼び出し
      expect(mockRunFinancialSimulation).toHaveBeenCalledWith(
        expect.anything(),
        50,
        ["group1"],
      );
    });
  });
});
