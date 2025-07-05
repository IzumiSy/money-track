"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Group, GroupedIncome, GroupedExpense } from "@/domains/group/types";

interface FinancialDataContextType {
  // データ
  groups: Group[];
  incomes: GroupedIncome[];
  expenses: GroupedExpense[];

  // グループ操作
  addGroup: (group: Omit<Group, "id">) => void;
  updateGroup: (id: string, group: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  toggleGroupActive: (id: string) => void;

  // 収入操作
  addIncome: (income: Omit<GroupedIncome, "id">) => void;
  updateIncome: (id: string, income: Partial<GroupedIncome>) => void;
  deleteIncome: (id: string) => void;
  upsertIncomes: (groupId: string, incomes: GroupedIncome[]) => void;

  // 支出操作
  addExpense: (expense: Omit<GroupedExpense, "id">) => void;
  updateExpense: (id: string, expense: Partial<GroupedExpense>) => void;
  deleteExpense: (id: string) => void;
  upsertExpenses: (groupId: string, expenses: GroupedExpense[]) => void;

  // ユーティリティ
  getGroupById: (id: string) => Group | undefined;
  getIncomesByGroupId: (groupId: string) => GroupedIncome[];
  getExpensesByGroupId: (groupId: string) => GroupedExpense[];
  getActiveGroups: () => Group[];
}

const FinancialDataContext = createContext<
  FinancialDataContextType | undefined
>(undefined);

// デフォルトのグループ色
const DEFAULT_GROUP_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

// デフォルトの収入色（緑系）
const DEFAULT_INCOME_COLORS = [
  "#10B981", // Green
  "#059669", // Emerald
  "#16A34A", // Green-600
  "#22C55E", // Green-500
  "#84CC16", // Lime
  "#65A30D", // Lime-600
  "#15803D", // Green-700
  "#047857", // Emerald-700
];

// デフォルトの支出色（赤系）
const DEFAULT_EXPENSE_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#DC2626", // Red-600
  "#EA580C", // Orange-600
  "#D97706", // Amber-600
  "#DB2777", // Pink-600
];

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [incomes, setIncomes] = useState<GroupedIncome[]>([]);
  const [expenses, setExpenses] = useState<GroupedExpense[]>([]);

  // グループ操作
  const addGroup = (group: Omit<Group, "id">) => {
    const newGroup: Group = {
      ...group,
      id: Date.now().toString(),
      color:
        group.color ||
        DEFAULT_GROUP_COLORS[groups.length % DEFAULT_GROUP_COLORS.length],
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  const updateGroup = (id: string, updatedGroup: Partial<Group>) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === id ? { ...group, ...updatedGroup } : group
      )
    );
  };

  const deleteGroup = (id: string) => {
    // グループを削除
    setGroups((prev) => prev.filter((group) => group.id !== id));

    // 関連する収入・支出も削除
    setIncomes((prev) => prev.filter((income) => income.groupId !== id));
    setExpenses((prev) => prev.filter((expense) => expense.groupId !== id));
  };

  const toggleGroupActive = (id: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === id ? { ...group, isActive: !group.isActive } : group
      )
    );
  };

  // 収入操作
  const addIncome = (income: Omit<GroupedIncome, "id">) => {
    const newIncome: GroupedIncome = {
      ...income,
      id: Date.now().toString(),
      color:
        income.color ||
        DEFAULT_INCOME_COLORS[incomes.length % DEFAULT_INCOME_COLORS.length],
    };
    setIncomes((prev) => [...prev, newIncome]);
  };

  const updateIncome = (id: string, updatedIncome: Partial<GroupedIncome>) => {
    setIncomes((prev) =>
      prev.map((income) =>
        income.id === id ? { ...income, ...updatedIncome } : income
      )
    );
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((income) => income.id !== id));
  };

  const upsertIncomes = (groupId: string, newIncomes: GroupedIncome[]) => {
    setIncomes((prev) => {
      // 指定されたグループ以外の収入を保持
      const otherGroupIncomes = prev.filter(
        (income) => income.groupId !== groupId
      );

      // 新しい収入データの処理
      const processedIncomes = newIncomes.map((income) => {
        // 既存のIDがある場合はそのまま使用、なければ新規ID生成
        if (!income.id || income.id.startsWith("temp-")) {
          return {
            ...income,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            groupId,
            color:
              income.color ||
              DEFAULT_INCOME_COLORS[
                newIncomes.indexOf(income) % DEFAULT_INCOME_COLORS.length
              ],
          };
        }
        return {
          ...income,
          groupId,
        };
      });

      return [...otherGroupIncomes, ...processedIncomes];
    });
  };

  // 支出操作
  const addExpense = (expense: Omit<GroupedExpense, "id">) => {
    const newExpense: GroupedExpense = {
      ...expense,
      id: Date.now().toString(),
      color:
        expense.color ||
        DEFAULT_EXPENSE_COLORS[expenses.length % DEFAULT_EXPENSE_COLORS.length],
    };
    setExpenses((prev) => [...prev, newExpense]);
  };

  const updateExpense = (
    id: string,
    updatedExpense: Partial<GroupedExpense>
  ) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const upsertExpenses = (groupId: string, newExpenses: GroupedExpense[]) => {
    setExpenses((prev) => {
      // 指定されたグループ以外の支出を保持
      const otherGroupExpenses = prev.filter(
        (expense) => expense.groupId !== groupId
      );

      // 新しい支出データの処理
      const processedExpenses = newExpenses.map((expense) => {
        // 既存のIDがある場合はそのまま使用、なければ新規ID生成
        if (!expense.id || expense.id.startsWith("temp-")) {
          return {
            ...expense,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            groupId,
            color:
              expense.color ||
              DEFAULT_EXPENSE_COLORS[
                newExpenses.indexOf(expense) % DEFAULT_EXPENSE_COLORS.length
              ],
          };
        }
        return {
          ...expense,
          groupId,
        };
      });

      return [...otherGroupExpenses, ...processedExpenses];
    });
  };

  // ユーティリティ関数
  const getGroupById = (id: string) => {
    return groups.find((group) => group.id === id);
  };

  const getIncomesByGroupId = (groupId: string) => {
    return incomes.filter((income) => income.groupId === groupId);
  };

  const getExpensesByGroupId = (groupId: string) => {
    return expenses.filter((expense) => expense.groupId === groupId);
  };

  const getActiveGroups = () => {
    return groups.filter((group) => group.isActive);
  };

  return (
    <FinancialDataContext.Provider
      value={{
        groups,
        incomes,
        expenses,
        addGroup,
        updateGroup,
        deleteGroup,
        toggleGroupActive,
        addIncome,
        updateIncome,
        deleteIncome,
        upsertIncomes,
        addExpense,
        updateExpense,
        deleteExpense,
        upsertExpenses,
        getGroupById,
        getIncomesByGroupId,
        getExpensesByGroupId,
        getActiveGroups,
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialData() {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error(
      "useFinancialData must be used within a FinancialDataProvider"
    );
  }
  return context;
}
