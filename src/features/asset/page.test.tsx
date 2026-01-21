import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinancialAssetsPage } from "./page";
import { useGroupManagement } from "@/features/group/hooks";
import { useAssetManagement } from "./hooks";

vi.mock("@/features/group/hooks", () => ({
  useGroupManagement: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useAssetManagement: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseGroupManagement = useGroupManagement as Mock;
const mockUseAssetManagement = useAssetManagement as Mock;

describe("useFinancialAssetsPage", () => {
  const mockUpsertAssets = vi.fn();
  const mockGetAssetsByGroupId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseGroupManagement.mockReturnValue({
      groups: [{ id: "group1", name: "テストグループ", isActive: true }],
    });

    mockUseAssetManagement.mockReturnValue({
      upsertAssets: mockUpsertAssets,
      getAssetsByGroupId: mockGetAssetsByGroupId,
    });

    mockGetAssetsByGroupId.mockReturnValue([]);
  });

  describe("初期状態", () => {
    it("グループがある場合、最初のグループが選択される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      expect(result.current.selectedGroupId).toBe("group1");
      expect(result.current.groups).toHaveLength(1);
    });

    it("グループがない場合、selectedGroupIdは空文字", () => {
      mockUseGroupManagement.mockReturnValue({ groups: [] });

      const { result } = renderHook(() => useFinancialAssetsPage());

      expect(result.current.selectedGroupId).toBe("");
    });

    it("初期状態でdraftAssetsは空配列", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      expect(result.current.draftAssets).toEqual([]);
    });

    it("既存の資産データがある場合、draftAssetsに反映される", () => {
      mockGetAssetsByGroupId.mockReturnValue([
        {
          id: "asset1",
          name: "株式投資",
          groupId: "group1",
          returnRate: 0.05,
          baseAmount: 1000000,
          contributionOptions: [],
          withdrawalOptions: [],
        },
      ]);

      const { result } = renderHook(() => useFinancialAssetsPage());

      expect(result.current.draftAssets).toHaveLength(1);
      expect(result.current.draftAssets[0].name).toBe("株式投資");
    });
  });

  describe("資産の追加・更新・削除", () => {
    it("addAssetで新しい資産が追加される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      expect(result.current.draftAssets).toHaveLength(1);
      expect(result.current.draftAssets[0].groupId).toBe("group1");
      expect(result.current.draftAssets[0].name).toBe("");
      expect(result.current.draftAssets[0].returnRate).toBe(0.05);
      expect(result.current.draftAssets[0].contributionOptions).toEqual([]);
      expect(result.current.draftAssets[0].withdrawalOptions).toEqual([]);
    });

    it("グループが選択されていない場合、addAssetはalertを表示して追加しない", () => {
      mockUseGroupManagement.mockReturnValue({ groups: [] });

      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      expect(result.current.draftAssets).toHaveLength(0);
    });

    it("updateAssetで資産が更新される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.updateAsset(assetId, "name", "株式投資");
      });

      expect(result.current.draftAssets[0].name).toBe("株式投資");
    });

    it("updateAssetで数値フィールドが更新される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.updateAsset(assetId, "baseAmount", 1000000);
        result.current.updateAsset(assetId, "returnRate", 0.07);
      });

      expect(result.current.draftAssets[0].baseAmount).toBe(1000000);
      expect(result.current.draftAssets[0].returnRate).toBe(0.07);
    });

    it("removeAssetで資産が削除される（confirm=true）", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.removeAsset(assetId);
      });

      expect(result.current.draftAssets).toHaveLength(0);
    });
  });

  describe("積立オプションの管理", () => {
    it("addContributionOptionで積立オプションが追加される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.addContributionOption(assetId);
      });

      expect(result.current.draftAssets[0].contributionOptions).toHaveLength(1);
      expect(result.current.draftAssets[0].contributionOptions[0].startYear).toBe(0);
      expect(result.current.draftAssets[0].contributionOptions[0].monthlyAmount).toBe(0);
    });

    it("updateContributionOptionで積立オプションが更新される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.addContributionOption(assetId);
      });

      const optionId = result.current.draftAssets[0].contributionOptions[0].id;

      act(() => {
        result.current.updateContributionOption(assetId, optionId, "monthlyAmount", 50000);
      });

      expect(result.current.draftAssets[0].contributionOptions[0].monthlyAmount).toBe(50000);
    });

    it("removeContributionOptionで積立オプションが削除される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.addContributionOption(assetId);
      });

      const optionId = result.current.draftAssets[0].contributionOptions[0].id;

      act(() => {
        result.current.removeContributionOption(assetId, optionId);
      });

      expect(result.current.draftAssets[0].contributionOptions).toHaveLength(0);
    });

    it("存在しない資産IDでaddContributionOptionを呼んでも何も起きない", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const originalAssets = [...result.current.draftAssets];

      act(() => {
        result.current.addContributionOption("non-existent-id");
      });

      expect(result.current.draftAssets).toEqual(originalAssets);
    });
  });

  describe("取り崩しオプションの管理", () => {
    it("addWithdrawalOptionで取り崩しオプションが追加される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.addWithdrawalOption(assetId);
      });

      expect(result.current.draftAssets[0].withdrawalOptions).toHaveLength(1);
      expect(result.current.draftAssets[0].withdrawalOptions[0].startYear).toBe(0);
      expect(result.current.draftAssets[0].withdrawalOptions[0].monthlyAmount).toBe(0);
    });

    it("updateWithdrawalOptionで取り崩しオプションが更新される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.addWithdrawalOption(assetId);
      });

      const optionId = result.current.draftAssets[0].withdrawalOptions[0].id;

      act(() => {
        result.current.updateWithdrawalOption(assetId, optionId, "monthlyAmount", 30000);
      });

      expect(result.current.draftAssets[0].withdrawalOptions[0].monthlyAmount).toBe(30000);
    });

    it("removeWithdrawalOptionで取り崩しオプションが削除される", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const assetId = result.current.draftAssets[0].id;

      act(() => {
        result.current.addWithdrawalOption(assetId);
      });

      const optionId = result.current.draftAssets[0].withdrawalOptions[0].id;

      act(() => {
        result.current.removeWithdrawalOption(assetId, optionId);
      });

      expect(result.current.draftAssets[0].withdrawalOptions).toHaveLength(0);
    });

    it("存在しない資産IDでaddWithdrawalOptionを呼んでも何も起きない", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });

      const originalAssets = [...result.current.draftAssets];

      act(() => {
        result.current.addWithdrawalOption("non-existent-id");
      });

      expect(result.current.draftAssets).toEqual(originalAssets);
    });
  });

  describe("保存処理", () => {
    it("handleSubmitでupsertAssetsが呼ばれる", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());
      const mockOnSubmit = vi.fn();
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      act(() => {
        result.current.addAsset();
      });

      act(() => {
        result.current.handleSubmit(mockEvent, mockOnSubmit);
      });

      expect(mockUpsertAssets).toHaveBeenCalledWith(
        "group1",
        result.current.draftAssets,
      );
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it("handleSubmitでevent.preventDefaultが呼ばれる", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe("グループ選択", () => {
    it("setSelectedGroupIdでグループを変更できる", () => {
      mockUseGroupManagement.mockReturnValue({
        groups: [
          { id: "group1", name: "グループ1", isActive: true },
          { id: "group2", name: "グループ2", isActive: true },
        ],
      });

      const { result } = renderHook(() => useFinancialAssetsPage());

      expect(result.current.selectedGroupId).toBe("group1");

      act(() => {
        result.current.setSelectedGroupId("group2");
      });

      expect(result.current.selectedGroupId).toBe("group2");
    });
  });

  describe("デフォルトカラーの割り当て", () => {
    it("複数の資産を追加すると異なる色が割り当てられる", () => {
      const { result } = renderHook(() => useFinancialAssetsPage());

      act(() => {
        result.current.addAsset();
      });
      act(() => {
        result.current.addAsset();
      });
      act(() => {
        result.current.addAsset();
      });

      const colors = result.current.draftAssets.map((a) => a.color);
      const uniqueColors = new Set(colors);

      // 3つの資産には3つの異なる色が割り当てられる
      expect(uniqueColors.size).toBe(3);
    });
  });
});
