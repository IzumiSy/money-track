"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FinancialAsset, Investment } from "@/components/FinancialAssetsForm";

interface FinancialAssetsContextType {
  financialAssets: FinancialAsset;
  setFinancialAssets: (assets: FinancialAsset) => void;
}

const FinancialAssetsContext = createContext<
  FinancialAssetsContextType | undefined
>(undefined);

// デフォルト色の配列
const DEFAULT_COLORS = [
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#EC4899", // Pink
  "#84CC16", // Lime
];

export function FinancialAssetsProvider({ children }: { children: ReactNode }) {
  const [financialAssets, setFinancialAssets] = useState<FinancialAsset>({
    deposits: 0,
    investments: [],
  });

  // 投資データに色が設定されていない場合にデフォルト色を設定する関数
  const setFinancialAssetsWithColors = (assets: FinancialAsset) => {
    const investmentsWithColors = assets.investments.map(
      (investment, index) => {
        // 色が設定されていない場合はデフォルト色を設定
        if (!investment.color) {
          return {
            ...investment,
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          };
        }
        return investment;
      }
    );

    setFinancialAssets({
      ...assets,
      investments: investmentsWithColors,
    });
  };

  return (
    <FinancialAssetsContext.Provider
      value={{
        financialAssets,
        setFinancialAssets: setFinancialAssetsWithColors,
      }}
    >
      {children}
    </FinancialAssetsContext.Provider>
  );
}

export function useFinancialAssets() {
  const context = useContext(FinancialAssetsContext);
  if (context === undefined) {
    throw new Error(
      "useFinancialAssets must be used within a FinancialAssetsProvider"
    );
  }
  return context;
}
