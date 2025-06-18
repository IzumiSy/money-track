"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { YearMonthDuration } from "@/types/YearMonth";

export interface Income {
  id: string;
  name: string;
  monthlyAmount: number; // 月間収入額
  color: string; // グラフ上での色
  startYearMonth?: YearMonthDuration; // 開始年月
  endYearMonth?: YearMonthDuration; // 終了年月
}

interface IncomeContextType {
  incomes: Income[];
  setIncomes: (incomes: Income[]) => void;
  addIncome: (income: Omit<Income, "id">) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  removeIncome: (id: string) => void;
  getTotalMonthlyIncome: () => number;
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

// デフォルト色の配列（収入用に緑系を中心とした色合い）
const DEFAULT_COLORS = [
  "#10B981", // Green
  "#059669", // Emerald
  "#16A34A", // Green-600
  "#22C55E", // Green-500
  "#84CC16", // Lime
  "#65A30D", // Lime-600
  "#15803D", // Green-700
  "#047857", // Emerald-700
];

export function IncomeProvider({ children }: { children: ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>([]);

  // 収入データに色が設定されていない場合にデフォルト色を設定する関数
  const setIncomesWithColors = (newIncomes: Income[]) => {
    const incomesWithColors = newIncomes.map((income, index) => {
      // 色が設定されていない場合はデフォルト色を設定
      if (!income.color) {
        return {
          ...income,
          color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        };
      }
      return income;
    });

    setIncomes(incomesWithColors);
  };

  const addIncome = (income: Omit<Income, "id">) => {
    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
      color:
        income.color || DEFAULT_COLORS[incomes.length % DEFAULT_COLORS.length],
    };
    setIncomes((prev) => [...prev, newIncome]);
  };

  const updateIncome = (id: string, updatedIncome: Partial<Income>) => {
    setIncomes((prev) =>
      prev.map((income) =>
        income.id === id ? { ...income, ...updatedIncome } : income
      )
    );
  };

  const removeIncome = (id: string) => {
    setIncomes((prev) => prev.filter((income) => income.id !== id));
  };

  const getTotalMonthlyIncome = () => {
    return incomes.reduce((total, income) => total + income.monthlyAmount, 0);
  };

  return (
    <IncomeContext.Provider
      value={{
        incomes,
        setIncomes: setIncomesWithColors,
        addIncome,
        updateIncome,
        removeIncome,
        getTotalMonthlyIncome,
      }}
    >
      {children}
    </IncomeContext.Provider>
  );
}

export function useIncome() {
  const context = useContext(IncomeContext);
  if (context === undefined) {
    throw new Error("useIncome must be used within an IncomeProvider");
  }
  return context;
}
