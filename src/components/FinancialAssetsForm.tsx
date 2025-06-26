"use client";

import { useState, useEffect } from "react";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";

export interface ContributionOption {
  id: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  monthlyAmount: number;
}

export interface WithdrawalOption {
  id: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  monthlyAmount: number;
}

export interface Asset {
  id: string;
  name: string;
  returnRate: number;
  color: string;
  baseAmount: number;
  contributionOptions: ContributionOption[];
  withdrawalOptions: WithdrawalOption[];
}

export interface FinancialAssets {
  assets: Asset[];
}

interface FinancialAssetsFormProps {
  onSubmit?: () => void;
}

export default function FinancialAssetsForm({
  onSubmit,
}: FinancialAssetsFormProps) {
  const { financialAssets: contextAssets, setFinancialAssets } =
    useFinancialAssets();
  const [draftAssets, setDraftAssets] = useState<Asset[]>([]);

  // コンテキストの金融資産データをドラフトステートに同期
  useEffect(() => {
    if (contextAssets && contextAssets.assets) {
      setDraftAssets(contextAssets.assets);
    } else {
      // 初期状態は空の配列
      setDraftAssets([]);
    }
  }, [contextAssets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFinancialAssets({
      assets: draftAssets,
    });
    if (onSubmit) {
      onSubmit();
    }
  };

  // 資産ごとに異なるデフォルト色を設定
  const getDefaultColor = (index: number) => {
    const colors = [
      "#F59E0B", // Amber
      "#EF4444", // Red
      "#8B5CF6", // Violet
      "#06B6D4", // Cyan
      "#F97316", // Orange
      "#EC4899", // Pink
      "#84CC16", // Lime
    ];
    return colors[index % colors.length];
  };

  const addAsset = () => {
    const newAsset: Asset = {
      id: Date.now().toString(),
      name: "",
      returnRate: 0.05,
      color: getDefaultColor(draftAssets.length - 1),
      baseAmount: 0,
      contributionOptions: [],
      withdrawalOptions: [],
    };
    setDraftAssets([...draftAssets, newAsset]);
  };

  const updateAsset = (
    id: string,
    field: keyof Asset,
    value: string | number | boolean | ContributionOption[] | WithdrawalOption[]
  ) => {
    setDraftAssets(
      draftAssets.map((asset) =>
        asset.id === id ? { ...asset, [field]: value } : asset
      )
    );
  };

  const removeAsset = (id: string) => {
    setDraftAssets(draftAssets.filter((asset) => asset.id !== id));
  };

  const addContributionOption = (assetId: string) => {
    const newOption: ContributionOption = {
      id: Date.now().toString(),
      startYear: 0,
      startMonth: 1,
      endYear: 10,
      endMonth: 12,
      monthlyAmount: 0,
    };

    setDraftAssets(
      draftAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              contributionOptions: [...asset.contributionOptions, newOption],
            }
          : asset
      )
    );
  };

  const updateContributionOption = (
    assetId: string,
    optionId: string,
    field: keyof ContributionOption,
    value: string | number
  ) => {
    setDraftAssets(
      draftAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              contributionOptions: asset.contributionOptions.map((option) =>
                option.id === optionId ? { ...option, [field]: value } : option
              ),
            }
          : asset
      )
    );
  };

  const removeContributionOption = (assetId: string, optionId: string) => {
    setDraftAssets(
      draftAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              contributionOptions: asset.contributionOptions.filter(
                (option) => option.id !== optionId
              ),
            }
          : asset
      )
    );
  };

  const addWithdrawalOption = (assetId: string) => {
    const newOption: WithdrawalOption = {
      id: Date.now().toString(),
      startYear: 0,
      startMonth: 1,
      endYear: 10,
      endMonth: 12,
      monthlyAmount: 0,
    };

    setDraftAssets(
      draftAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              withdrawalOptions: [...asset.withdrawalOptions, newOption],
            }
          : asset
      )
    );
  };

  const updateWithdrawalOption = (
    assetId: string,
    optionId: string,
    field: keyof WithdrawalOption,
    value: string | number
  ) => {
    setDraftAssets(
      draftAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              withdrawalOptions: asset.withdrawalOptions.map((option) =>
                option.id === optionId ? { ...option, [field]: value } : option
              ),
            }
          : asset
      )
    );
  };

  const removeWithdrawalOption = (assetId: string, optionId: string) => {
    setDraftAssets(
      draftAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              withdrawalOptions: asset.withdrawalOptions.filter(
                (option) => option.id !== optionId
              ),
            }
          : asset
      )
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        金融資産の入力
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              資産一覧
            </label>
            <button
              type="button"
              onClick={addAsset}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              + 資産を追加
            </button>
          </div>

          {draftAssets.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                資産を追加してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftAssets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      資産 #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      削除
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        資産名
                      </label>
                      <input
                        type="text"
                        value={asset.name}
                        onChange={(e) =>
                          updateAsset(asset.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="例：S&P500インデックス"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        現在の評価額（円）
                      </label>
                      <input
                        type="number"
                        value={asset.baseAmount || ""}
                        onChange={(e) =>
                          updateAsset(
                            asset.id,
                            "baseAmount",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="0"
                        min="0"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        現在の評価額
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        年間リターン率（%）
                      </label>
                      <input
                        type="number"
                        value={asset.returnRate * 100 || ""}
                        onChange={(e) =>
                          updateAsset(
                            asset.id,
                            "returnRate",
                            (Number(e.target.value) || 0) / 100
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="5.0"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        グラフの色
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={asset.color}
                          onChange={(e) =>
                            updateAsset(asset.id, "color", e.target.value)
                          }
                          className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={asset.color}
                          onChange={(e) =>
                            updateAsset(asset.id, "color", e.target.value)
                          }
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-600 dark:text-white"
                          placeholder="#10B981"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        積立オプション
                      </h5>
                      <button
                        type="button"
                        onClick={() => addContributionOption(asset.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors duration-200"
                      >
                        + オプション追加
                      </button>
                    </div>

                    {asset.contributionOptions.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          積立オプションを追加してください
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {asset.contributionOptions.map(
                          (option, optionIndex) => (
                            <div
                              key={option.id}
                              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-600"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  オプション #{optionIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeContributionOption(
                                      asset.id,
                                      option.id
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                                >
                                  削除
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    開始年
                                  </label>
                                  <input
                                    type="number"
                                    value={option.startYear || ""}
                                    onChange={(e) =>
                                      updateContributionOption(
                                        asset.id,
                                        option.id,
                                        "startYear",
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
                                    開始月
                                  </label>
                                  <select
                                    value={option.startMonth}
                                    onChange={(e) =>
                                      updateContributionOption(
                                        asset.id,
                                        option.id,
                                        "startMonth",
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}月
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    終了年
                                  </label>
                                  <input
                                    type="number"
                                    value={option.endYear || ""}
                                    onChange={(e) =>
                                      updateContributionOption(
                                        asset.id,
                                        option.id,
                                        "endYear",
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                    placeholder="10"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    終了月
                                  </label>
                                  <select
                                    value={option.endMonth}
                                    onChange={(e) =>
                                      updateContributionOption(
                                        asset.id,
                                        option.id,
                                        "endMonth",
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}月
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    月額積立額（円）
                                  </label>
                                  <input
                                    type="number"
                                    value={option.monthlyAmount || ""}
                                    onChange={(e) =>
                                      updateContributionOption(
                                        asset.id,
                                        option.id,
                                        "monthlyAmount",
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
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        引き出しオプション
                      </h5>
                      <button
                        type="button"
                        onClick={() => addWithdrawalOption(asset.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors duration-200"
                      >
                        + オプション追加
                      </button>
                    </div>

                    {asset.withdrawalOptions.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          引き出しオプションを追加してください
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {asset.withdrawalOptions.map((option, optionIndex) => (
                          <div
                            key={option.id}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                オプション #{optionIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeWithdrawalOption(asset.id, option.id)
                                }
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                              >
                                削除
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  開始年
                                </label>
                                <input
                                  type="number"
                                  value={option.startYear || ""}
                                  onChange={(e) =>
                                    updateWithdrawalOption(
                                      asset.id,
                                      option.id,
                                      "startYear",
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
                                  開始月
                                </label>
                                <select
                                  value={option.startMonth}
                                  onChange={(e) =>
                                    updateWithdrawalOption(
                                      asset.id,
                                      option.id,
                                      "startMonth",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                >
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      {i + 1}月
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  終了年
                                </label>
                                <input
                                  type="number"
                                  value={option.endYear || ""}
                                  onChange={(e) =>
                                    updateWithdrawalOption(
                                      asset.id,
                                      option.id,
                                      "endYear",
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                  placeholder="10"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  終了月
                                </label>
                                <select
                                  value={option.endMonth}
                                  onChange={(e) =>
                                    updateWithdrawalOption(
                                      asset.id,
                                      option.id,
                                      "endMonth",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                >
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      {i + 1}月
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  月額引き出し額（円）
                                </label>
                                <input
                                  type="number"
                                  value={option.monthlyAmount || ""}
                                  onChange={(e) =>
                                    updateWithdrawalOption(
                                      asset.id,
                                      option.id,
                                      "monthlyAmount",
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

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          資産情報を保存
        </button>
      </form>
    </div>
  );
}
