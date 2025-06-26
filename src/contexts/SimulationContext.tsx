"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FinancialAssets } from "@/components/FinancialAssetsForm";
import { Expense } from "@/contexts/ExpensesContext";
import { Income } from "@/contexts/IncomeContext";

export interface SimulationData {
  id: string;
  name: string;
  createdAt: Date;
  financialAssets: FinancialAssets;
  expenses: Expense[];
  incomes: Income[];
}

interface SimulationContextType {
  simulations: SimulationData[];
  currentSimulation: SimulationData | null;
  saveSimulation: (
    name: string,
    financialAssets: FinancialAssets,
    expenses: Expense[],
    incomes: Income[]
  ) => void;
  loadSimulation: (id: string) => void;
  deleteSimulation: (id: string) => void;
  updateSimulationName: (id: string, name: string) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(
  undefined
);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulations, setSimulations] = useState<SimulationData[]>([]);
  const [currentSimulation, setCurrentSimulation] =
    useState<SimulationData | null>(null);

  const saveSimulation = (
    name: string,
    financialAssets: FinancialAssets,
    expenses: Expense[],
    incomes: Income[]
  ) => {
    const newSimulation: SimulationData = {
      id: Date.now().toString(),
      name,
      createdAt: new Date(),
      financialAssets,
      expenses,
      incomes,
    };

    setSimulations((prev) => [...prev, newSimulation]);
    setCurrentSimulation(newSimulation);
  };

  const loadSimulation = (id: string) => {
    if (id === "") {
      setCurrentSimulation(null);
    } else {
      const simulation = simulations.find((sim) => sim.id === id);
      if (simulation) {
        setCurrentSimulation(simulation);
      }
    }
  };

  const deleteSimulation = (id: string) => {
    setSimulations((prev) => prev.filter((sim) => sim.id !== id));
    if (currentSimulation?.id === id) {
      setCurrentSimulation(null);
    }
  };

  const updateSimulationName = (id: string, name: string) => {
    setSimulations((prev) =>
      prev.map((sim) => (sim.id === id ? { ...sim, name } : sim))
    );
    if (currentSimulation?.id === id) {
      setCurrentSimulation((prev) => (prev ? { ...prev, name } : null));
    }
  };

  return (
    <SimulationContext.Provider
      value={{
        simulations,
        currentSimulation,
        saveSimulation,
        loadSimulation,
        deleteSimulation,
        updateSimulationName,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
