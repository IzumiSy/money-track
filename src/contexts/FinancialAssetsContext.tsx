"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FinancialAssets } from "@/components/FinancialAssetsForm";

interface FinancialAssetsContextType {
  financialAssets: FinancialAssets;
  setFinancialAssets: (assets: FinancialAssets) => void;
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
  const [financialAssets, setFinancialAssets] = useState<FinancialAssets>({
    assets: [],
  });

  // 資産データにデフォルト値を設定する関数
  const setFinancialAssetsWithDefaults = (assets: FinancialAssets) => {
    const assetsWithDefaults = assets.assets.map((asset, index) => {
      return {
        ...asset,
        // 色が設定されていない場合はデフォルト色を設定
        color: asset.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        // ベース評価額が未定義の場合はデフォルト値を設定
        baseAmount: asset.baseAmount ?? 0,
        // 積立オプションが未定義の場合はデフォルト値を設定
        contributionOptions: asset.contributionOptions ?? [],
        // 引き出しオプションが未定義の場合はデフォルト値を設定
        withdrawalOptions: asset.withdrawalOptions ?? [],
      };
    });

    setFinancialAssets({
      assets: assetsWithDefaults,
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
