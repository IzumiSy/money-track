"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Cycle } from "@/domains/shared/Cycle";

export interface Expense {
  id: string;
  name: string;
  cycles: Cycle[]; // 複数のサイクルを持てる
  color: string; // グラフ上での色
}

interface ExpensesContextType {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(
  undefined
);

// デフォルト色の配列
const DEFAULT_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#10B981", // Green
  "#84CC16", // Lime
];

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // 支出データに色が設定されていない場合にデフォルト色を設定する関数
  const setExpensesWithColors = (newExpenses: Expense[]) => {
    const expensesWithColors = newExpenses.map((expense, index) => {
      // 色が設定されていない場合はデフォルト色を設定
      if (!expense.color) {
        return {
          ...expense,
          color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        };
      }
      return expense;
    });

    setExpenses(expensesWithColors);
  };

  const addExpense = (expense: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      color:
        expense.color ||
        DEFAULT_COLORS[expenses.length % DEFAULT_COLORS.length],
    };
    setExpenses((prev) => [...prev, newExpense]);
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      )
    );
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        setExpenses: setExpensesWithColors,
        addExpense,
        updateExpense,
        removeExpense,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpensesProvider");
  }
  return context;
}
