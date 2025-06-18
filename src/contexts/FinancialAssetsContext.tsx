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

  // 投資データに色や売却設定が設定されていない場合にデフォルト値を設定する関数
  const setFinancialAssetsWithDefaults = (assets: FinancialAsset) => {
    const investmentsWithDefaults = assets.investments.map(
      (investment, index) => {
        return {
          ...investment,
          // 色が設定されていない場合はデフォルト色を設定
          color:
            investment.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          // ベース評価額が未定義の場合はデフォルト値を設定
          baseAmount: investment.baseAmount ?? 0,
          // 積立オプションが未定義の場合はデフォルト値を設定
          investmentOptions: investment.investmentOptions ?? [],
          // 売却オプションが未定義の場合はデフォルト値を設定
          sellbackOptions: investment.sellbackOptions ?? [],
        };
      }
    );

    setFinancialAssets({
      ...assets,
      investments: investmentsWithDefaults,
    });
  };

  return (
    <FinancialAssetsContext.Provider
      value={{
        financialAssets,
        setFinancialAssets: setFinancialAssetsWithDefaults,
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
