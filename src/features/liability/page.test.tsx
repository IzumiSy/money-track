import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLiabilitiesPage } from "./page";
import { useGroupManagement } from "@/features/group/hooks";
import { useLiabilityManagement } from "./hooks";
import { useAssetManagement } from "@/features/asset/hooks";

vi.mock("@/features/group/hooks", () => ({
  useGroupManagement: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useLiabilityManagement: vi.fn(),
}));

vi.mock("@/features/asset/hooks", () => ({
  useAssetManagement: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseGroupManagement = useGroupManagement as Mock;
const mockUseLiabilityManagement = useLiabilityManagement as Mock;
const mockUseAssetManagement = useAssetManagement as Mock;

describe("useLiabilitiesPage", () => {
  const mockUpsertLiabilities = vi.fn();
  const mockGetLiabilitiesByGroup = vi.fn();
  const mockGetAssetsByGroupId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseGroupManagement.mockReturnValue({
      groups: [{ id: "group1", name: "テストグループ", isActive: true }],
    });

    mockUseLiabilityManagement.mockReturnValue({
      upsertLiabilities: mockUpsertLiabilities,
      getLiabilitiesByGroup: mockGetLiabilitiesByGroup,
    });

    mockUseAssetManagement.mockReturnValue({
      getAssetsByGroupId: mockGetAssetsByGroupId,
    });

    mockGetLiabilitiesByGroup.mockReturnValue([]);
    mockGetAssetsByGroupId.mockReturnValue([
      { id: "asset1", name: "テスト資産", groupId: "group1" },
    ]);
  });

  describe("初期状態", () => {
    it("グループがある場合、最初のグループが選択される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      expect(result.current.selectedGroupId).toBe("group1");
      expect(result.current.groups).toHaveLength(1);
    });

    it("グループがない場合、selectedGroupIdは空文字", () => {
      mockUseGroupManagement.mockReturnValue({ groups: [] });

      const { result } = renderHook(() => useLiabilitiesPage());

      expect(result.current.selectedGroupId).toBe("");
    });

    it("初期状態でdraftLiabilitiesは空配列", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      expect(result.current.draftLiabilities).toEqual([]);
    });
  });

  describe("負債の追加・更新・削除", () => {
    it("addLiabilityで新しい負債が追加される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      act(() => {
        result.current.addLiability();
      });

      expect(result.current.draftLiabilities).toHaveLength(1);
      expect(result.current.draftLiabilities[0].groupId).toBe("group1");
      expect(result.current.draftLiabilities[0].name).toBe("");
    });

    it("updateLiabilityで負債が更新される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      act(() => {
        result.current.addLiability();
      });

      const liabilityId = result.current.draftLiabilities[0].id;

      act(() => {
        result.current.updateLiability(liabilityId, "name", "住宅ローン");
      });

      expect(result.current.draftLiabilities[0].name).toBe("住宅ローン");
    });

    it("removeLiabilityで負債が削除される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      act(() => {
        result.current.addLiability();
      });

      const liabilityId = result.current.draftLiabilities[0].id;

      act(() => {
        result.current.removeLiability(liabilityId);
      });

      expect(result.current.draftLiabilities).toHaveLength(0);
    });
  });

  describe("サイクルの追加・更新・削除", () => {
    it("addCycleで返済サイクルが追加される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      act(() => {
        result.current.addLiability();
      });

      const liabilityId = result.current.draftLiabilities[0].id;

      act(() => {
        result.current.addCycle(liabilityId);
      });

      expect(result.current.draftLiabilities[0].cycles).toHaveLength(1);
      expect(result.current.draftLiabilities[0].cycles[0].type).toBe("monthly");
    });

    it("updateCycleでサイクルが更新される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      act(() => {
        result.current.addLiability();
      });

      const liabilityId = result.current.draftLiabilities[0].id;

      act(() => {
        result.current.addCycle(liabilityId);
      });

      const cycleId = result.current.draftLiabilities[0].cycles[0].id;

      act(() => {
        result.current.updateCycle(liabilityId, cycleId, "amount", 50000);
      });

      expect(result.current.draftLiabilities[0].cycles[0].amount).toBe(50000);
    });

    it("removeCycleでサイクルが削除される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());

      act(() => {
        result.current.addLiability();
      });

      const liabilityId = result.current.draftLiabilities[0].id;

      act(() => {
        result.current.addCycle(liabilityId);
      });

      const cycleId = result.current.draftLiabilities[0].cycles[0].id;

      act(() => {
        result.current.removeCycle(liabilityId, cycleId);
      });

      expect(result.current.draftLiabilities[0].cycles).toHaveLength(0);
    });
  });

  describe("バリデーション", () => {
    it("assetSourceIdが未設定の負債がある場合、handleSubmitでvalidationErrorが設定される", () => {
      const { result } = renderHook(() => useLiabilitiesPage());
      const mockOnSubmit = vi.fn();
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      act(() => {
        result.current.addLiability();
      });

      act(() => {
        result.current.handleSubmit(mockEvent, mockOnSubmit);
      });

      expect(result.current.validationError).toBe(
        "すべての負債に返済元資産を選択してください。",
      );
      expect(mockUpsertLiabilities).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("全ての負債にassetSourceIdが設定されている場合、保存が成功する", () => {
      const { result } = renderHook(() => useLiabilitiesPage());
      const mockOnSubmit = vi.fn();
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      act(() => {
        result.current.addLiability();
      });

      const liabilityId = result.current.draftLiabilities[0].id;

      act(() => {
        result.current.updateLiability(liabilityId, "assetSourceId", "asset1");
      });

      act(() => {
        result.current.handleSubmit(mockEvent, mockOnSubmit);
      });

      expect(result.current.validationError).toBeNull();
      expect(mockUpsertLiabilities).toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
