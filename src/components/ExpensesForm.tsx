"use client";

import { useState, useEffect } from "react";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { GroupedExpense } from "@/domains/group/types";
import { Cycle, CycleType } from "@/domains/shared/Cycle";
import {
  convertIndexToYearMonth,
  convertYearMonthToIndex,
} from "@/domains/shared/TimeRange";

interface ExpensesFormProps {
  onSubmit?: () => void;
}

export default function ExpensesForm({ onSubmit }: ExpensesFormProps) {
  const { groups, addExpense, deleteExpense, getExpensesByGroupId } =
    useFinancialData();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups.length > 0 ? groups[0].id : ""
  );
  const [draftExpenses, setDraftExpenses] = useState<GroupedExpense[]>([]);

  // コンテキストの支出データをドラフトステートに同期（グループIDでフィルタ）
  useEffect(() => {
    const groupExpenses = getExpensesByGroupId(selectedGroupId);
    setDraftExpenses(groupExpenses);
  }, [getExpensesByGroupId, selectedGroupId]);

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
    if (!selectedGroupId) {
      alert("グループを選択してください");
      return;
    }

    const newExpense: GroupedExpense = {
      id: Date.now().toString(),
      groupId: selectedGroupId,
      name: "",
      cycles: [],
      color: getDefaultColor(draftExpenses.length),
    };
    setDraftExpenses([...draftExpenses, newExpense]);
  };

  const handleUpdateExpense = (
    id: string,
    field: keyof GroupedExpense,
    value: string | Cycle[]
  ) => {
    setDraftExpenses(
      draftExpenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  const handleRemoveExpense = (id: string) => {
    if (confirm("この支出を削除しますか？")) {
      setDraftExpenses(draftExpenses.filter((expense) => expense.id !== id));
    }
  };

  const handleAddCycle = (expenseId: string) => {
    const expense = draftExpenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const newCycle: Cycle = {
      id: Date.now().toString(),
      type: "monthly",
      startMonthIndex: 0, // 1年1ヶ月目
      amount: 0,
    };

    handleUpdateExpense(expenseId, "cycles", [...expense.cycles, newCycle]);
  };

  const handleUpdateCycle = (
    expenseId: string,
    cycleId: string,
    updates: Partial<Cycle>
  ) => {
    const expense = draftExpenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const updatedCycles = expense.cycles.map((cycle) =>
      cycle.id === cycleId ? { ...cycle, ...updates } : cycle
    );

    handleUpdateExpense(expenseId, "cycles", updatedCycles);
  };

  const handleRemoveCycle = (expenseId: string, cycleId: string) => {
    const expense = draftExpenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const updatedCycles = expense.cycles.filter(
      (cycle) => cycle.id !== cycleId
    );
    handleUpdateExpense(expenseId, "cycles", updatedCycles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 既存の支出を削除
    const existingExpenses = getExpensesByGroupId(selectedGroupId);
    existingExpenses.forEach((expense) => deleteExpense(expense.id));

    // 新しい支出を追加
    draftExpenses.forEach((expense) => {
      addExpense(expense);
    });

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
              支出項目
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
                このグループに支出を追加してください
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                  {/* サイクル設定 */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        サイクル設定
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddCycle(expense.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors duration-200"
                      >
                        + サイクルを追加
                      </button>
                    </div>

                    {expense.cycles.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          サイクルを追加してください
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {expense.cycles.map((cycle) => (
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
                                    handleUpdateCycle(expense.id, cycle.id, {
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
                                        handleUpdateCycle(
                                          expense.id,
                                          cycle.id,
                                          {
                                            interval: Number(e.target.value),
                                          }
                                        )
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
                                        handleUpdateCycle(
                                          expense.id,
                                          cycle.id,
                                          {
                                            intervalUnit: e.target.value as
                                              | "month"
                                              | "year",
                                          }
                                        )
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
                                    handleUpdateCycle(expense.id, cycle.id, {
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
                                    handleRemoveCycle(expense.id, cycle.id)
                                  }
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors duration-200"
                                >
                                  削除
                                </button>
                              </div>
                            </div>

                            {/* 開始・終了時期 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  開始時期
                                </label>
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="number"
                                    value={
                                      convertIndexToYearMonth(
                                        cycle.startMonthIndex
                                      ).year
                                    }
                                    onChange={(e) => {
                                      const year = Number(e.target.value);
                                      const month = convertIndexToYearMonth(
                                        cycle.startMonthIndex
                                      ).month;
                                      handleUpdateCycle(expense.id, cycle.id, {
                                        startMonthIndex:
                                          convertYearMonthToIndex(year, month),
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="年"
                                    min="1"
                                  />
                                  <select
                                    value={
                                      convertIndexToYearMonth(
                                        cycle.startMonthIndex
                                      ).month
                                    }
                                    onChange={(e) => {
                                      const year = convertIndexToYearMonth(
                                        cycle.startMonthIndex
                                      ).year;
                                      const month = Number(e.target.value);
                                      handleUpdateCycle(expense.id, cycle.id, {
                                        startMonthIndex:
                                          convertYearMonthToIndex(year, month),
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}ヶ月目
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  終了時期（任意）
                                </label>
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="number"
                                    value={
                                      cycle.endMonthIndex !== undefined
                                        ? convertIndexToYearMonth(
                                            cycle.endMonthIndex
                                          ).year
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const year = e.target.value
                                        ? Number(e.target.value)
                                        : undefined;
                                      if (year !== undefined) {
                                        const month =
                                          cycle.endMonthIndex !== undefined
                                            ? convertIndexToYearMonth(
                                                cycle.endMonthIndex
                                              ).month
                                            : 1;
                                        handleUpdateCycle(
                                          expense.id,
                                          cycle.id,
                                          {
                                            endMonthIndex:
                                              convertYearMonthToIndex(
                                                year,
                                                month
                                              ),
                                          }
                                        );
                                      } else {
                                        handleUpdateCycle(
                                          expense.id,
                                          cycle.id,
                                          {
                                            endMonthIndex: undefined,
                                          }
                                        );
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="年"
                                    min="1"
                                  />
                                  <select
                                    value={
                                      cycle.endMonthIndex !== undefined
                                        ? convertIndexToYearMonth(
                                            cycle.endMonthIndex
                                          ).month
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const month = e.target.value
                                        ? Number(e.target.value)
                                        : undefined;
                                      if (
                                        month !== undefined &&
                                        cycle.endMonthIndex !== undefined
                                      ) {
                                        const year = convertIndexToYearMonth(
                                          cycle.endMonthIndex
                                        ).year;
                                        handleUpdateCycle(
                                          expense.id,
                                          cycle.id,
                                          {
                                            endMonthIndex:
                                              convertYearMonthToIndex(
                                                year,
                                                month
                                              ),
                                          }
                                        );
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    disabled={cycle.endMonthIndex === undefined}
                                  >
                                    <option value="">-</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}ヶ月目
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
          disabled={groups.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          支出情報を保存
        </button>
      </form>
    </div>
  );
}
