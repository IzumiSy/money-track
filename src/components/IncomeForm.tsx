"use client";

import { useState, useEffect } from "react";
import { useIncome, Income } from "@/contexts/IncomeContext";
import { Cycle, CycleType } from "@/domains/shared/Cycle";

interface IncomeFormProps {
  onSubmit?: () => void;
}

export default function IncomeForm({ onSubmit }: IncomeFormProps) {
  const { incomes: contextIncomes, setIncomes } = useIncome();
  const [draftIncomes, setDraftIncomes] = useState<Income[]>([]);

  // コンテキストの収入データをドラフトステートに同期
  useEffect(() => {
    setDraftIncomes(contextIncomes);
  }, [contextIncomes]);

  // 収入ごとに異なるデフォルト色を設定
  const getDefaultColor = (index: number) => {
    const colors = [
      "#10B981", // Green
      "#059669", // Emerald
      "#16A34A", // Green-600
      "#22C55E", // Green-500
      "#84CC16", // Lime
      "#65A30D", // Lime-600
      "#15803D", // Green-700
      "#047857", // Emerald-700
    ];
    return colors[index % colors.length];
  };

  const handleAddIncome = () => {
    const newIncome: Income = {
      id: Date.now().toString(),
      name: "",
      cycles: [],
      color: getDefaultColor(draftIncomes.length),
    };
    setDraftIncomes([...draftIncomes, newIncome]);
  };

  const handleUpdateIncome = (
    id: string,
    field: keyof Income,
    value: string | Cycle[]
  ) => {
    setDraftIncomes(
      draftIncomes.map((income) =>
        income.id === id ? { ...income, [field]: value } : income
      )
    );
  };

  const handleRemoveIncome = (id: string) => {
    setDraftIncomes(draftIncomes.filter((income) => income.id !== id));
  };

  const handleAddCycle = (incomeId: string) => {
    const income = draftIncomes.find((i) => i.id === incomeId);
    if (!income) return;

    const newCycle: Cycle = {
      id: Date.now().toString(),
      type: "monthly",
      startDate: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      },
      amount: 0,
    };

    handleUpdateIncome(incomeId, "cycles", [...income.cycles, newCycle]);
  };

  const handleUpdateCycle = (
    incomeId: string,
    cycleId: string,
    updates: Partial<Cycle>
  ) => {
    const income = draftIncomes.find((i) => i.id === incomeId);
    if (!income) return;

    const updatedCycles = income.cycles.map((cycle) =>
      cycle.id === cycleId ? { ...cycle, ...updates } : cycle
    );

    handleUpdateIncome(incomeId, "cycles", updatedCycles);
  };

  const handleRemoveCycle = (incomeId: string, cycleId: string) => {
    const income = draftIncomes.find((i) => i.id === incomeId);
    if (!income) return;

    const updatedCycles = income.cycles.filter((cycle) => cycle.id !== cycleId);
    handleUpdateIncome(incomeId, "cycles", updatedCycles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIncomes(draftIncomes);
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        収入の設定
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              収入項目
            </label>
            <button
              type="button"
              onClick={handleAddIncome}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              + 収入を追加
            </button>
          </div>

          {draftIncomes.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                収入を追加してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftIncomes.map((income, index) => (
                <div
                  key={income.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      収入 #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveIncome(income.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      削除
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* 収入名 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        収入名
                      </label>
                      <input
                        type="text"
                        value={income.name}
                        onChange={(e) =>
                          handleUpdateIncome(income.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="例：給与、副業、投資収益"
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
                          value={income.color}
                          onChange={(e) =>
                            handleUpdateIncome(
                              income.id,
                              "color",
                              e.target.value
                            )
                          }
                          className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={income.color}
                          onChange={(e) =>
                            handleUpdateIncome(
                              income.id,
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

                  {/* サイクル設定 */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        サイクル設定
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddCycle(income.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors duration-200"
                      >
                        + サイクルを追加
                      </button>
                    </div>

                    {income.cycles.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          サイクルを追加してください
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {income.cycles.map((cycle) => (
                          <div
                            key={cycle.id}
                            className="border border-gray-200 dark:border-gray-600 rounded p-3 bg-white dark:bg-gray-800"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                              {/* サイクルタイプ */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  タイプ
                                </label>
                                <select
                                  value={cycle.type}
                                  onChange={(e) =>
                                    handleUpdateCycle(income.id, cycle.id, {
                                      type: e.target.value as CycleType,
                                    })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="monthly">毎月</option>
                                  <option value="yearly">毎年</option>
                                  <option value="custom">カスタム</option>
                                </select>
                              </div>

                              {/* カスタム設定 */}
                              {cycle.type === "custom" && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      間隔
                                    </label>
                                    <input
                                      type="number"
                                      value={cycle.interval || 1}
                                      onChange={(e) =>
                                        handleUpdateCycle(income.id, cycle.id, {
                                          interval: Number(e.target.value),
                                        })
                                      }
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      単位
                                    </label>
                                    <select
                                      value={cycle.intervalUnit || "month"}
                                      onChange={(e) =>
                                        handleUpdateCycle(income.id, cycle.id, {
                                          intervalUnit: e.target.value as
                                            | "month"
                                            | "year",
                                        })
                                      }
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="month">ヶ月</option>
                                      <option value="year">年</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              {/* 金額 */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  金額（円）
                                </label>
                                <input
                                  type="number"
                                  value={cycle.amount || ""}
                                  onChange={(e) =>
                                    handleUpdateCycle(income.id, cycle.id, {
                                      amount: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>

                              {/* 削除ボタン */}
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveCycle(income.id, cycle.id)
                                  }
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors duration-200"
                                >
                                  削除
                                </button>
                              </div>
                            </div>

                            {/* 開始・終了日 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  開始年月
                                </label>
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="number"
                                    value={cycle.startDate.year}
                                    onChange={(e) =>
                                      handleUpdateCycle(income.id, cycle.id, {
                                        startDate: {
                                          ...cycle.startDate,
                                          year: Number(e.target.value),
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="年"
                                    min="2000"
                                    max="2100"
                                  />
                                  <select
                                    value={cycle.startDate.month}
                                    onChange={(e) =>
                                      handleUpdateCycle(income.id, cycle.id, {
                                        startDate: {
                                          ...cycle.startDate,
                                          month: Number(e.target.value),
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}月
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  終了年月（任意）
                                </label>
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="number"
                                    value={cycle.endDate?.year || ""}
                                    onChange={(e) => {
                                      const year = e.target.value
                                        ? Number(e.target.value)
                                        : undefined;
                                      handleUpdateCycle(income.id, cycle.id, {
                                        endDate: year
                                          ? {
                                              year,
                                              month: cycle.endDate?.month || 1,
                                            }
                                          : undefined,
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="年"
                                    min="2000"
                                    max="2100"
                                  />
                                  <select
                                    value={cycle.endDate?.month || ""}
                                    onChange={(e) => {
                                      const month = e.target.value
                                        ? Number(e.target.value)
                                        : undefined;
                                      handleUpdateCycle(income.id, cycle.id, {
                                        endDate:
                                          month && cycle.endDate?.year
                                            ? {
                                                year: cycle.endDate.year,
                                                month,
                                              }
                                            : undefined,
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                  >
                                    <option value="">月</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}月
                                      </option>
                                    ))}
                                  </select>
                                </div>
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

        {/* 送信ボタン */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          収入情報を保存
        </button>
      </form>
    </div>
  );
}
