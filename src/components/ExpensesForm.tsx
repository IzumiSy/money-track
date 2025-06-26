"use client";

import { useState, useEffect } from "react";
import { useExpenses, Expense } from "@/contexts/ExpensesContext";
import { YearMonthDuration } from "@/types/YearMonth";
import { CycleSetting } from "@/types/CycleSetting";
import CycleSettingField from "./CycleSettingField";

interface ExpensesFormProps {
  onSubmit?: () => void;
}

export default function ExpensesForm({ onSubmit }: ExpensesFormProps) {
  const { expenses: contextExpenses, setExpenses } = useExpenses();
  const [draftExpenses, setDraftExpenses] = useState<Expense[]>([]);

  // コンテキストの支出データをドラフトステートに同期
  useEffect(() => {
    setDraftExpenses(contextExpenses);
  }, [contextExpenses]);

  // 支出ごとに異なるデフォルト色を設定
  const getDefaultColor = (index: number) => {
    const colors = [
      "#EF4444", // Red
      "#F97316", // Orange
      "#F59E0B", // Amber
      "#EC4899", // Pink
      "#8B5CF6", // Violet
      "#06B6D4", // Cyan
      "#10B981", // Green
      "#84CC16", // Lime
    ];
    return colors[index % colors.length];
  };

  const handleAddExpense = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      name: "",
      monthlyAmount: 0,
      color: getDefaultColor(draftExpenses.length),
    };
    setDraftExpenses([...draftExpenses, newExpense]);
  };

  const handleUpdateExpense = (
    id: string,
    field: keyof Expense,
    value: string | number | YearMonthDuration | CycleSetting | undefined
  ) => {
    setDraftExpenses(
      draftExpenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  const handleUpdateYear = (
    id: string,
    field: "startYearMonth" | "endYearMonth",
    year: number | undefined
  ) => {
    const expense = draftExpenses.find((e) => e.id === id);
    if (!expense) return;

    const currentYearMonth = expense[field] || YearMonthDuration.from();
    const updatedYearMonth = currentYearMonth.withYear(year);
    handleUpdateExpense(id, field, updatedYearMonth);
  };

  const handleUpdateMonth = (
    id: string,
    field: "startYearMonth" | "endYearMonth",
    month: number | undefined
  ) => {
    const expense = draftExpenses.find((e) => e.id === id);
    if (!expense) return;

    const currentYearMonth = expense[field] || YearMonthDuration.from();
    const updatedYearMonth = currentYearMonth.withMonth(month);
    handleUpdateExpense(id, field, updatedYearMonth);
  };

  const handleRemoveExpense = (id: string) => {
    setDraftExpenses(draftExpenses.filter((expense) => expense.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ドラフトの変更をコンテキストに保存
    setExpenses(draftExpenses);
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        支出の設定
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              月間支出
            </label>
            <button
              type="button"
              onClick={handleAddExpense}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              + 支出を追加
            </button>
          </div>

          {draftExpenses.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                支出を追加してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftExpenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      支出 #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(expense.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      削除
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* 支出名 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        支出名
                      </label>
                      <input
                        type="text"
                        value={expense.name}
                        onChange={(e) =>
                          handleUpdateExpense(
                            expense.id,
                            "name",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        placeholder="例：家賃、食費、光熱費"
                      />
                    </div>

                    {/* 月間支出額 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        月間支出額（円）
                      </label>
                      <input
                        type="number"
                        value={expense.monthlyAmount || ""}
                        onChange={(e) =>
                          handleUpdateExpense(
                            expense.id,
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
                          value={expense.color}
                          onChange={(e) =>
                            handleUpdateExpense(
                              expense.id,
                              "color",
                              e.target.value
                            )
                          }
                          className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={expense.color}
                          onChange={(e) =>
                            handleUpdateExpense(
                              expense.id,
                              "color",
                              e.target.value
                            )
                          }
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-600 dark:text-white"
                          placeholder="#EF4444"
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
                          value={expense.startYearMonth?.getYear() || ""}
                          onChange={(e) =>
                            handleUpdateYear(
                              expense.id,
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
                          value={expense.startYearMonth?.getMonth() || ""}
                          onChange={(e) =>
                            handleUpdateMonth(
                              expense.id,
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
                          value={expense.endYearMonth?.getYear() || ""}
                          onChange={(e) =>
                            handleUpdateYear(
                              expense.id,
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
                          value={expense.endYearMonth?.getMonth() || ""}
                          onChange={(e) =>
                            handleUpdateMonth(
                              expense.id,
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

                  {/* サイクル設定 */}
                  <CycleSettingField
                    id={expense.id}
                    cycleSetting={expense.cycleSetting}
                    onChange={(cycleSetting) =>
                      handleUpdateExpense(
                        expense.id,
                        "cycleSetting",
                        cycleSetting
                      )
                    }
                  />
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
          支出情報を保存
        </button>
      </form>
    </div>
  );
}
