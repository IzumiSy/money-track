"use client";

import { useState } from "react";
import { useIncome, Income } from "@/contexts/IncomeContext";
import { YearMonthDuration } from "@/types/YearMonth";

export default function IncomeForm() {
  const { incomes, addIncome, updateIncome, removeIncome } = useIncome();

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
    addIncome({
      name: "",
      monthlyAmount: 0,
      color: getDefaultColor(incomes.length),
    });
  };

  const handleUpdateIncome = (
    id: string,
    field: keyof Omit<Income, "id">,
    value: string | number | YearMonthDuration | undefined
  ) => {
    updateIncome(id, { [field]: value });
  };

  const handleUpdateYear = (
    id: string,
    field: "startYearMonth" | "endYearMonth",
    year: number | undefined
  ) => {
    const income = incomes.find((i) => i.id === id);
    if (!income) return;

    const currentYearMonth = income[field] || YearMonthDuration.from();
    const updatedYearMonth = currentYearMonth.withYear(year);
    updateIncome(id, { [field]: updatedYearMonth });
  };

  const handleUpdateMonth = (
    id: string,
    field: "startYearMonth" | "endYearMonth",
    month: number | undefined
  ) => {
    const income = incomes.find((i) => i.id === id);
    if (!income) return;

    const currentYearMonth = income[field] || YearMonthDuration.from();
    const updatedYearMonth = currentYearMonth.withMonth(month);
    updateIncome(id, { [field]: updatedYearMonth });
  };

  const handleRemoveIncome = (id: string) => {
    removeIncome(id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        収入の設定
      </h2>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            月間収入
          </label>
          <button
            type="button"
            onClick={handleAddIncome}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200"
          >
            + 収入を追加
          </button>
        </div>

        {incomes.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              収入を追加してください
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomes.map((income, index) => (
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                  {/* 月間収入額 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      月間収入額（円）
                    </label>
                    <input
                      type="number"
                      value={income.monthlyAmount || ""}
                      onChange={(e) =>
                        handleUpdateIncome(
                          income.id,
                          "monthlyAmount",
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                      placeholder="0"
                      min="0"
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
                          handleUpdateIncome(income.id, "color", e.target.value)
                        }
                        className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={income.color}
                        onChange={(e) =>
                          handleUpdateIncome(income.id, "color", e.target.value)
                        }
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-600 dark:text-white"
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 開始年月 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      開始年月
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={income.startYearMonth?.getYear() || ""}
                        onChange={(e) =>
                          handleUpdateYear(
                            income.id,
                            "startYearMonth",
                            Number(e.target.value) || undefined
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="年"
                        min="0"
                        max="2100"
                      />
                      <select
                        value={income.startYearMonth?.getMonth() || ""}
                        onChange={(e) =>
                          handleUpdateMonth(
                            income.id,
                            "startYearMonth",
                            Number(e.target.value) || undefined
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
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

                  {/* 終了年月 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      終了年月（任意）
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={income.endYearMonth?.getYear() || ""}
                        onChange={(e) =>
                          handleUpdateYear(
                            income.id,
                            "endYearMonth",
                            Number(e.target.value) || undefined
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="年"
                        min="0"
                        max="2100"
                      />
                      <select
                        value={income.endYearMonth?.getMonth() || ""}
                        onChange={(e) =>
                          handleUpdateMonth(
                            income.id,
                            "endYearMonth",
                            Number(e.target.value) || undefined
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
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
  );
}
