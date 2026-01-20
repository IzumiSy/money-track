import { useState, useEffect } from "react";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { useLiabilityManagement } from "@/hooks/useLiabilityManagement";
import { useAssetManagement } from "@/hooks/useAssetManagement";
import { GroupedLiability, Cycle } from "@/domains/group/types";

interface LiabilitiesFormProps {
  onSubmit?: () => void;
}

export default function LiabilitiesForm({ onSubmit }: LiabilitiesFormProps) {
  const { groups } = useGroupManagement();
  const { upsertLiabilities, getLiabilitiesByGroup } = useLiabilityManagement();
  const { assets, getAssetsByGroupId } = useAssetManagement();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups.length > 0 ? groups[0].id : ""
  );
  const [draftLiabilities, setDraftLiabilities] = useState<GroupedLiability[]>(
    []
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // グループ変更時に負債データを同期
  useEffect(() => {
    const groupLiabilities = getLiabilitiesByGroup(selectedGroupId);
    setDraftLiabilities(groupLiabilities);
  }, [getLiabilitiesByGroup, selectedGroupId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // バリデーション: すべての負債にassetSourceIdが必要
    for (const liability of draftLiabilities) {
      if (!liability.assetSourceId) {
        setValidationError("すべての負債に返済元資産を選択してください。");
        return;
      }
    }
    setValidationError(null);
    upsertLiabilities(selectedGroupId, draftLiabilities);
    if (onSubmit) onSubmit();
  };

  const addLiability = () => {
    if (!selectedGroupId) {
      alert("グループを選択してください");
      return;
    }
    const newLiability: GroupedLiability = {
      id: Date.now().toString(),
      groupId: selectedGroupId,
      name: "",
      cycles: [],
      color: "#6366F1",
      assetSourceId: "",
      principal: 0,
      totalAmount: 0,
    };
    setDraftLiabilities([...draftLiabilities, newLiability]);
  };

  const updateLiability = (
    id: string,
    field: keyof GroupedLiability,
    value: string | number | Cycle[]
  ) => {
    setDraftLiabilities(
      draftLiabilities.map((liability) =>
        liability.id === id ? { ...liability, [field]: value } : liability
      )
    );
  };

  const removeLiability = (id: string) => {
    if (confirm("この負債を削除しますか？")) {
      setDraftLiabilities(
        draftLiabilities.filter((liability) => liability.id !== id)
      );
    }
  };

  // 返済サイクルの追加・編集・削除
  const addCycle = (liabilityId: string) => {
    const liability = draftLiabilities.find((l) => l.id === liabilityId);
    if (!liability) return;
    const newCycle: Cycle = {
      id: Date.now().toString(),
      type: "monthly",
      amount: 0,
      startMonthIndex: 0,
    };
    updateLiability(liabilityId, "cycles", [...liability.cycles, newCycle]);
  };

  const updateCycle = (
    liabilityId: string,
    cycleId: string,
    field: keyof Cycle,
    value: string | number
  ) => {
    const liability = draftLiabilities.find((l) => l.id === liabilityId);
    if (!liability) return;
    const updatedCycles = liability.cycles.map((cycle) =>
      cycle.id === cycleId ? { ...cycle, [field]: value } : cycle
    );
    updateLiability(liabilityId, "cycles", updatedCycles);
  };

  const removeCycle = (liabilityId: string, cycleId: string) => {
    const liability = draftLiabilities.find((l) => l.id === liabilityId);
    if (!liability) return;
    const updatedCycles = liability.cycles.filter(
      (cycle) => cycle.id !== cycleId
    );
    updateLiability(liabilityId, "cycles", updatedCycles);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        負債の入力
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* グループ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            グループ
          </label>
          {groups.length === 0 ? (
            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              グループを作成してください
            </div>
          ) : (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              負債一覧
            </label>
            <button
              type="button"
              onClick={addLiability}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              + 負債を追加
            </button>
          </div>
          {draftLiabilities.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                このグループに負債を追加してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftLiabilities.map((liability, index) => (
                <div
                  key={liability.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      負債 #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeLiability(liability.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      削除
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        返済元資産
                      </label>
                      {assets.length === 0 ? (
                        <div className="text-xs text-red-500">
                          資産がありません。先に資産を追加してください。
                        </div>
                      ) : (
                        <select
                          value={liability.assetSourceId}
                          onChange={(e) =>
                            updateLiability(
                              liability.id,
                              "assetSourceId",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-600 dark:text-white"
                        >
                          <option value="">選択してください</option>
                          {getAssetsByGroupId(selectedGroupId).map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              {asset.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        負債名
                      </label>
                      <input
                        type="text"
                        value={liability.name}
                        onChange={(e) =>
                          updateLiability(liability.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="例：住宅ローン"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        元本（円）
                      </label>
                      <input
                        type="number"
                        value={liability.principal || ""}
                        onChange={(e) =>
                          updateLiability(
                            liability.id,
                            "principal",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        返済総額（円）
                      </label>
                      <input
                        type="number"
                        value={liability.totalAmount || ""}
                        onChange={(e) =>
                          updateLiability(
                            liability.id,
                            "totalAmount",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        グラフの色
                      </label>
                      <input
                        type="color"
                        value={liability.color}
                        onChange={(e) =>
                          updateLiability(liability.id, "color", e.target.value)
                        }
                        className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        返済サイクル
                      </h5>
                      <button
                        type="button"
                        onClick={() => addCycle(liability.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors duration-200"
                      >
                        + サイクル追加
                      </button>
                    </div>
                    {liability.cycles.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          返済サイクルを追加してください
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {liability.cycles.map((cycle, cycleIndex) => (
                          <div
                            key={cycle.id}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                サイクル #{cycleIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeCycle(liability.id, cycle.id)
                                }
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                              >
                                削除
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  タイプ
                                </label>
                                <select
                                  value={cycle.type}
                                  onChange={(e) =>
                                    updateCycle(
                                      liability.id,
                                      cycle.id,
                                      "type",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="monthly">毎月</option>
                                  <option value="yearly">毎年</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  金額（円）
                                </label>
                                <input
                                  type="number"
                                  value={cycle.amount || ""}
                                  onChange={(e) =>
                                    updateCycle(
                                      liability.id,
                                      cycle.id,
                                      "amount",
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  開始月インデックス
                                </label>
                                <input
                                  type="number"
                                  value={cycle.startMonthIndex || ""}
                                  onChange={(e) =>
                                    updateCycle(
                                      liability.id,
                                      cycle.id,
                                      "startMonthIndex",
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {validationError && (
          <div className="text-red-600 text-sm mb-2">{validationError}</div>
        )}
        <button
          type="submit"
          disabled={groups.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          負債情報を保存
        </button>
      </form>
    </div>
  );
}
