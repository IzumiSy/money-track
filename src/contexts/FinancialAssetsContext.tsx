"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FinancialAsset } from "@/components/FinancialAssetsForm";

interface FinancialAssetsContextType {
  financialAssets: FinancialAsset;
  setFinancialAssets: (assets: FinancialAsset) => void;
}

const FinancialAssetsContext = createContext<
  FinancialAssetsContextType | undefined
>(undefined);

export function FinancialAssetsProvider({ children }: { children: ReactNode }) {
  const [financialAssets, setFinancialAssets] = useState<FinancialAsset>({
    deposits: 0,
    investments: 0,
  });

  return (
    <FinancialAssetsContext.Provider
      value={{ financialAssets, setFinancialAssets }}
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
