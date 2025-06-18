"use client";

import { useState, useEffect } from "react";

export interface InvestmentOption {
  id: string;
  startYear: number; // 積立開始年
  startMonth: number; // 積立開始月（1-12）
  endYear: number; // 積立終了年
  endMonth: number; // 積立終了月（1-12）
  monthlyAmount: number; // 月額積立額
}

export interface SellbackOption {
  id: string;
  startYear: number; // 売却開始年
  startMonth: number; // 売却開始月（1-12）
  endYear: number; // 売却終了年
  endMonth: number; // 売却終了月（1-12）
  monthlyAmount: number; // 月額売却額
}

export interface Investment {
  id: string;
  name: string;
  returnRate: number; // 年間リターン率（例：0.05 = 5%）
  color: string; // グラフの色
  baseAmount: number; // ベースとなる評価額（初期投資額）
  investmentOptions: InvestmentOption[]; // 積立オプション
  sellbackOptions: SellbackOption[]; // 売却オプション
}

export interface FinancialAsset {
  deposits: number;
  investments: Investment[];
}

interface FinancialAssetsFormProps {
  onSubmit: (assets: FinancialAsset) => void;
  initialData?: FinancialAsset;
}

export default function FinancialAssetsForm({
  onSubmit,
  initialData,
}: FinancialAssetsFormProps) {
  const [deposits, setDeposits] = useState(initialData?.deposits || 0);
  const [investments, setInvestments] = useState<Investment[]>(
    initialData?.investments || []
  );

  // initialDataが変更されたときにフォームの状態を更新
  useEffect(() => {
    if (initialData) {
      setDeposits(initialData.deposits);
      setInvestments(initialData.investments);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ deposits, investments });
  };

  // 投資ごとに異なるデフォルト色を設定
  const getDefaultColor = (index: number) => {
    const colors = [
      "#10B981", // Green
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

  const addInvestment = () => {
    const newInvestment: Investment = {
      id: Date.now().toString(),
      name: "",
      returnRate: 0.05, // デフォルト5%
      color: getDefaultColor(investments.length),
      baseAmount: 0, // デフォルト0円（ベース評価額）
      investmentOptions: [], // 積立オプション
      sellbackOptions: [], // 売却オプション
    };
    setInvestments([...investments, newInvestment]);
  };

  const updateInvestment = (
    id: string,
    field: keyof Investment,
    value: string | number | boolean | InvestmentOption[] | SellbackOption[]
  ) => {
    setInvestments(
      investments.map((inv) =>
        inv.id === id ? { ...inv, [field]: value } : inv
      )
    );
  };

  const removeInvestment = (id: string) => {
    setInvestments(investments.filter((inv) => inv.id !== id));
  };

  const addInvestmentOption = (investmentId: string) => {
    const newOption: InvestmentOption = {
      id: Date.now().toString(),
      startYear: 0,
      startMonth: 1,
      endYear: 10,
      endMonth: 12,
      monthlyAmount: 0,
    };

    setInvestments(
      investments.map((inv) =>
        inv.id === investmentId
          ? { ...inv, investmentOptions: [...inv.investmentOptions, newOption] }
          : inv
      )
    );
  };

  const updateInvestmentOption = (
    investmentId: string,
    optionId: string,
    field: keyof InvestmentOption,
    value: string | number
  ) => {
    setInvestments(
      investments.map((inv) =>
        inv.id === investmentId
          ? {
              ...inv,
              investmentOptions: inv.investmentOptions.map((option) =>
                option.id === optionId ? { ...option, [field]: value } : option
              ),
            }
          : inv
      )
    );
  };

  const removeInvestmentOption = (investmentId: string, optionId: string) => {
    setInvestments(
      investments.map((inv) =>
        inv.id === investmentId
          ? {
              ...inv,
              investmentOptions: inv.investmentOptions.filter(
                (option) => option.id !== optionId
              ),
            }
          : inv
      )
    );
  };

  const addSellbackOption = (investmentId: string) => {
    const newOption: SellbackOption = {
      id: Date.now().toString(),
      startYear: 0,
      startMonth: 1,
      endYear: 10,
      endMonth: 12,
      monthlyAmount: 0,
    };

    setInvestments(
      investments.map((inv) =>
        inv.id === investmentId
          ? { ...inv, sellbackOptions: [...inv.sellbackOptions, newOption] }
          : inv
      )
    );
  };

  const updateSellbackOption = (
    investmentId: string,
    optionId: string,
    field: keyof SellbackOption,
    value: string | number
  ) => {
    setInvestments(
      investments.map((inv) =>
        inv.id === investmentId
          ? {
              ...inv,
              sellbackOptions: inv.sellbackOptions.map((option) =>
                option.id === optionId ? { ...option, [field]: value } : option
              ),
            }
          : inv
      )
    );
  };

  const removeSellbackOption = (investmentId: string, optionId: string) => {
    setInvestments(
      investments.map((inv) =>
        inv.id === investmentId
          ? {
              ...inv,
              sellbackOptions: inv.sellbackOptions.filter(
                (option) => option.id !== optionId
              ),
            }
          : inv
      )
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        金融資産の入力
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 預金額 */}
        <div>
          <label
            htmlFor="deposits"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            預金額
          </label>
          <div className="relative">
            <input
              type="number"
              id="deposits"
              value={deposits || ""}
              onChange={(e) => setDeposits(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="0"
              min="0"
            />
            <span className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
              円
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            普通預金、定期預金などの合計額
          </p>
        </div>

        {/* 積立投資セクション */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              積立投資
            </label>
            <button
              type="button"
              onClick={addInvestment}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              + 投資を追加
            </button>
          </div>

          {investments.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                積立投資を追加してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((investment, index) => (
                <div
                  key={investment.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      投資 #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeInvestment(investment.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      削除
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* 投資名 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        投資名
                      </label>
                      <input
                        type="text"
                        value={investment.name}
                        onChange={(e) =>
                          updateInvestment(
                            investment.id,
                            "name",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="例：S&P500インデックス"
                      />
                    </div>

                    {/* ベース評価額 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        ベース評価額（円）
                      </label>
                      <input
                        type="number"
                        value={investment.baseAmount || ""}
                        onChange={(e) =>
                          updateInvestment(
                            investment.id,
                            "baseAmount",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="0"
                        min="0"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        既存の投資評価額
                      </p>
                    </div>

                    {/* リターン率 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        年間リターン率（%）
                      </label>
                      <input
                        type="number"
                        value={investment.returnRate * 100 || ""}
                        onChange={(e) =>
                          updateInvestment(
                            investment.id,
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

                    {/* グラフの色 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        グラフの色
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={investment.color}
                          onChange={(e) =>
                            updateInvestment(
                              investment.id,
                              "color",
                              e.target.value
                            )
                          }
                          className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={investment.color}
                          onChange={(e) =>
                            updateInvestment(
                              investment.id,
                              "color",
                              e.target.value
                            )
                          }
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-600 dark:text-white"
                          placeholder="#10B981"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 積立オプション設定 */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        積立オプション
                      </h5>
                      <button
                        type="button"
                        onClick={() => addInvestmentOption(investment.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors duration-200"
                      >
                        + オプション追加
                      </button>
                    </div>

                    {investment.investmentOptions.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          積立オプションを追加してください
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {investment.investmentOptions.map(
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
                                    removeInvestmentOption(
                                      investment.id,
                                      option.id
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                                >
                                  削除
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                {/* 開始年 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    開始年
                                  </label>
                                  <input
                                    type="number"
                                    value={option.startYear || ""}
                                    onChange={(e) =>
                                      updateInvestmentOption(
                                        investment.id,
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
                                {/* 開始月 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    開始月
                                  </label>
                                  <select
                                    value={option.startMonth}
                                    onChange={(e) =>
                                      updateInvestmentOption(
                                        investment.id,
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
                                {/* 終了年 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    終了年
                                  </label>
                                  <input
                                    type="number"
                                    value={option.endYear || ""}
                                    onChange={(e) =>
                                      updateInvestmentOption(
                                        investment.id,
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
                                {/* 終了月 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    終了月
                                  </label>
                                  <select
                                    value={option.endMonth}
                                    onChange={(e) =>
                                      updateInvestmentOption(
                                        investment.id,
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
                                {/* 月額投資額 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    月額投資額（円）
                                  </label>
                                  <input
                                    type="number"
                                    value={option.monthlyAmount || ""}
                                    onChange={(e) =>
                                      updateInvestmentOption(
                                        investment.id,
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

                  {/* 売却オプション設定 */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        売却オプション
                      </h5>
                      <button
                        type="button"
                        onClick={() => addSellbackOption(investment.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors duration-200"
                      >
                        + オプション追加
                      </button>
                    </div>

                    {investment.sellbackOptions.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          売却オプションを追加してください
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {investment.sellbackOptions.map(
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
                                    removeSellbackOption(
                                      investment.id,
                                      option.id
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                                >
                                  削除
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                {/* 開始年 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    開始年
                                  </label>
                                  <input
                                    type="number"
                                    value={option.startYear || ""}
                                    onChange={(e) =>
                                      updateSellbackOption(
                                        investment.id,
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
                                {/* 開始月 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    開始月
                                  </label>
                                  <select
                                    value={option.startMonth}
                                    onChange={(e) =>
                                      updateSellbackOption(
                                        investment.id,
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
                                {/* 終了年 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    終了年
                                  </label>
                                  <input
                                    type="number"
                                    value={option.endYear || ""}
                                    onChange={(e) =>
                                      updateSellbackOption(
                                        investment.id,
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
                                {/* 終了月 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    終了月
                                  </label>
                                  <select
                                    value={option.endMonth}
                                    onChange={(e) =>
                                      updateSellbackOption(
                                        investment.id,
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
                                {/* 月額売却額 */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    月額売却額（円）
                                  </label>
                                  <input
                                    type="number"
                                    value={option.monthlyAmount || ""}
                                    onChange={(e) =>
                                      updateSellbackOption(
                                        investment.id,
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 送信ボタン */}
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
