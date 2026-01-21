import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIncomePage } from "./page";
import { useGroupManagement } from "@/features/group/hooks";
import { useIncomeManagement } from "./hooks";
import { useAssetManagement } from "@/features/asset/hooks";

vi.mock("@/features/group/hooks", () => ({
  useGroupManagement: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useIncomeManagement: vi.fn(),
}));

vi.mock("@/features/asset/hooks", () => ({
  useAssetManagement: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseGroupManagement = useGroupManagement as Mock;
const mockUseIncomeManagement = useIncomeManagement as Mock;
const mockUseAssetManagement = useAssetManagement as Mock;

describe("useIncomePage", () => {
  const mockUpsertIncomes = vi.fn();
  const mockGetIncomesByGroupId = vi.fn();
  const mockGetAssetsByGroupId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseGroupManagement.mockReturnValue({
      groups: [{ id: "group1", name: "テストグループ", isActive: true }],
    });

    mockUseIncomeManagement.mockReturnValue({
      upsertIncomes: mockUpsertIncomes,
      getIncomesByGroupId: mockGetIncomesByGroupId,
    });

    mockUseAssetManagement.mockReturnValue({
      getAssetsByGroupId: mockGetAssetsByGroupId,
    });

    mockGetIncomesByGroupId.mockReturnValue([]);
    mockGetAssetsByGroupId.mockReturnValue([
      { id: "asset1", name: "テスト資産", groupId: "group1" },
    ]);
  });

  describe("初期状態", () => {
    it("グループがある場合、最初のグループが選択される", () => {
      const { result } = renderHook(() => useIncomePage());

      expect(result.current.selectedGroupId).toBe("group1");
      expect(result.current.groups).toHaveLength(1);
    });

    it("グループがない場合、selectedGroupIdは空文字", () => {
      mockUseGroupManagement.mockReturnValue({ groups: [] });

      const { result } = renderHook(() => useIncomePage());

      expect(result.current.selectedGroupId).toBe("");
    });

    it("初期状態でdraftIncomesは空配列", () => {
      const { result } = renderHook(() => useIncomePage());

      expect(result.current.draftIncomes).toEqual([]);
    });

    it("groupAssetsが正しく取得できる", () => {
      const { result } = renderHook(() => useIncomePage());

      expect(result.current.groupAssets).toHaveLength(1);
      expect(result.current.groupAssets[0].name).toBe("テスト資産");
    });
  });

  describe("収入の追加・更新・削除", () => {
    it("handleAddIncomeで新しい収入が追加される", () => {
      const { result } = renderHook(() => useIncomePage());

      act(() => {
        result.current.handleAddIncome();
      });

      expect(result.current.draftIncomes).toHaveLength(1);
      expect(result.current.draftIncomes[0].groupId).toBe("group1");
      expect(result.current.draftIncomes[0].assetSourceId).toBe("asset1");
    });

    it("資産がない場合、handleAddIncomeはalertを表示して追加しない", () => {
      mockGetAssetsByGroupId.mockReturnValue([]);

      const { result } = renderHook(() => useIncomePage());

      act(() => {
        result.current.handleAddIncome();
      });

      expect(result.current.draftIncomes).toHaveLength(0);
    });

    it("handleUpdateIncomeで収入が更新される", () => {
      const { result } = renderHook(() => useIncomePage());

      act(() => {
        result.current.handleAddIncome();
      });

      const incomeId = result.current.draftIncomes[0].id;

      act(() => {
        result.current.handleUpdateIncome(incomeId, "name", "給与");
      });

      expect(result.current.draftIncomes[0].name).toBe("給与");
    });

    it("handleRemoveIncomeで収入が削除される", () => {
      const { result } = renderHook(() => useIncomePage());

      act(() => {
        result.current.handleAddIncome();
      });

      const incomeId = result.current.draftIncomes[0].id;

      act(() => {
        result.current.handleRemoveIncome(incomeId);
      });

      expect(result.current.draftIncomes).toHaveLength(0);
    });
  });

  describe("サイクルの追加・更新・削除", () => {
    it("handleAddCycleでサイクルが追加される", () => {
      const { result } = renderHook(() => useIncomePage());

      act(() => {
        result.current.handleAddIncome();
      });

      const incomeId = result.current.draftIncomes[0].id;

      act(() => {
        result.current.handleAddCycle(incomeId);
      });

      expect(result.current.draftIncomes[0].cycles).toHaveLength(1);
      expect(result.current.draftIncomes[0].cycles[0].type).toBe("monthly");
    });

    it("handleUpdateCycleでサイクルが更新される", () => {
      const { result } = renderHook(() => useIncomePage());

      act(() => {
        result.current.handleAddIncome();
      });

      const incomeId = result.current.draftIncomes[0].id;

      act(() => {
        result.current.handleAddCycle(incomeId);
      });

      const cycleId = result.current.draftIncomes[0].cycles[0].id;

      act(() => {
        result.current.handleUpdateCycle(incomeId, cycleId, { amount: 500000 });
      });

      expect(result.current.draftIncomes[0].cycles[0].amount).toBe(500000);
    });

    it("handleRemoveCycleでサイクルが削除される", () => {
      const { result } = renderHook(() => useIncomePage());

      act(() => {
        result.current.handleAddIncome();
      });

      const incomeId = result.current.draftIncomes[0].id;

      act(() => {
        result.current.handleAddCycle(incomeId);
      });

      const cycleId = result.current.draftIncomes[0].cycles[0].id;

      act(() => {
        result.current.handleRemoveCycle(incomeId, cycleId);
      });

      expect(result.current.draftIncomes[0].cycles).toHaveLength(0);
    });
  });

  describe("保存処理", () => {
    it("handleSubmitでupsertIncomesが呼ばれる", () => {
      const { result } = renderHook(() => useIncomePage());
      const mockOnSubmit = vi.fn();
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      act(() => {
        result.current.handleAddIncome();
      });

      act(() => {
        result.current.handleSubmit(mockEvent, mockOnSubmit);
      });

      expect(mockUpsertIncomes).toHaveBeenCalledWith(
        "group1",
        result.current.draftIncomes,
      );
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
