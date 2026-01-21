import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExpensesPage } from "./page";
import { useGroupManagement } from "@/features/group/hooks";
import { useExpenseManagement } from "./hooks";
import { useAssetManagement } from "@/features/asset/hooks";

vi.mock("@/features/group/hooks", () => ({
  useGroupManagement: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useExpenseManagement: vi.fn(),
}));

vi.mock("@/features/asset/hooks", () => ({
  useAssetManagement: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseGroupManagement = useGroupManagement as Mock;
const mockUseExpenseManagement = useExpenseManagement as Mock;
const mockUseAssetManagement = useAssetManagement as Mock;

describe("useExpensesPage", () => {
  const mockUpsertExpenses = vi.fn();
  const mockGetExpensesByGroupId = vi.fn();
  const mockGetAssetsByGroupId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseGroupManagement.mockReturnValue({
      groups: [{ id: "group1", name: "テストグループ", isActive: true }],
    });

    mockUseExpenseManagement.mockReturnValue({
      upsertExpenses: mockUpsertExpenses,
      getExpensesByGroupId: mockGetExpensesByGroupId,
    });

    mockUseAssetManagement.mockReturnValue({
      getAssetsByGroupId: mockGetAssetsByGroupId,
    });

    mockGetExpensesByGroupId.mockReturnValue([]);
    mockGetAssetsByGroupId.mockReturnValue([
      { id: "asset1", name: "テスト資産", groupId: "group1" },
    ]);
  });

  describe("初期状態", () => {
    it("グループがある場合、最初のグループが選択される", () => {
      const { result } = renderHook(() => useExpensesPage());

      expect(result.current.selectedGroupId).toBe("group1");
      expect(result.current.groups).toHaveLength(1);
    });

    it("グループがない場合、selectedGroupIdは空文字", () => {
      mockUseGroupManagement.mockReturnValue({ groups: [] });

      const { result } = renderHook(() => useExpensesPage());

      expect(result.current.selectedGroupId).toBe("");
    });

    it("初期状態でdraftExpensesは空配列", () => {
      const { result } = renderHook(() => useExpensesPage());

      expect(result.current.draftExpenses).toEqual([]);
    });

    it("groupAssetsが正しく取得できる", () => {
      const { result } = renderHook(() => useExpensesPage());

      expect(result.current.groupAssets).toHaveLength(1);
      expect(result.current.groupAssets[0].name).toBe("テスト資産");
    });
  });

  describe("支出の追加・更新・削除", () => {
    it("handleAddExpenseで新しい支出が追加される", () => {
      const { result } = renderHook(() => useExpensesPage());

      act(() => {
        result.current.handleAddExpense();
      });

      expect(result.current.draftExpenses).toHaveLength(1);
      expect(result.current.draftExpenses[0].groupId).toBe("group1");
      expect(result.current.draftExpenses[0].assetSourceId).toBe("asset1");
    });

    it("資産がない場合、handleAddExpenseはalertを表示して追加しない", () => {
      mockGetAssetsByGroupId.mockReturnValue([]);

      const { result } = renderHook(() => useExpensesPage());

      act(() => {
        result.current.handleAddExpense();
      });

      expect(result.current.draftExpenses).toHaveLength(0);
    });

    it("handleUpdateExpenseで支出が更新される", () => {
      const { result } = renderHook(() => useExpensesPage());

      act(() => {
        result.current.handleAddExpense();
      });

      const expenseId = result.current.draftExpenses[0].id;

      act(() => {
        result.current.handleUpdateExpense(expenseId, "name", "食費");
      });

      expect(result.current.draftExpenses[0].name).toBe("食費");
    });

    it("handleRemoveExpenseで支出が削除される", () => {
      const { result } = renderHook(() => useExpensesPage());

      act(() => {
        result.current.handleAddExpense();
      });

      const expenseId = result.current.draftExpenses[0].id;

      act(() => {
        result.current.handleRemoveExpense(expenseId);
      });

      expect(result.current.draftExpenses).toHaveLength(0);
    });
  });

  describe("サイクルの追加・更新・削除", () => {
    it("handleAddCycleでサイクルが追加される", () => {
      const { result } = renderHook(() => useExpensesPage());

      act(() => {
        result.current.handleAddExpense();
      });

      const expenseId = result.current.draftExpenses[0].id;

      act(() => {
        result.current.handleAddCycle(expenseId);
      });

      expect(result.current.draftExpenses[0].cycles).toHaveLength(1);
      expect(result.current.draftExpenses[0].cycles[0].type).toBe("monthly");
    });

    it("handleUpdateCycleでサイクルが更新される", () => {
      const { result } = renderHook(() => useExpensesPage());

      act(() => {
        result.current.handleAddExpense();
      });

      const expenseId = result.current.draftExpenses[0].id;

      act(() => {
        result.current.handleAddCycle(expenseId);
      });

      const cycleId = result.current.draftExpenses[0].cycles[0].id;

      act(() => {
        result.current.handleUpdateCycle(expenseId, cycleId, { amount: 30000 });
      });

      expect(result.current.draftExpenses[0].cycles[0].amount).toBe(30000);
    });

    it("handleRemoveCycleでサイクルが削除される", () => {
      const { result } = renderHook(() => useExpensesPage());

      act(() => {
        result.current.handleAddExpense();
      });

      const expenseId = result.current.draftExpenses[0].id;

      act(() => {
        result.current.handleAddCycle(expenseId);
      });

      const cycleId = result.current.draftExpenses[0].cycles[0].id;

      act(() => {
        result.current.handleRemoveCycle(expenseId, cycleId);
      });

      expect(result.current.draftExpenses[0].cycles).toHaveLength(0);
    });
  });

  describe("保存処理", () => {
    it("handleSubmitでupsertExpensesが呼ばれる", () => {
      const { result } = renderHook(() => useExpensesPage());
      const mockOnSubmit = vi.fn();
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      act(() => {
        result.current.handleAddExpense();
      });

      act(() => {
        result.current.handleSubmit(mockEvent, mockOnSubmit);
      });

      expect(mockUpsertExpenses).toHaveBeenCalledWith(
        "group1",
        result.current.draftExpenses,
      );
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
