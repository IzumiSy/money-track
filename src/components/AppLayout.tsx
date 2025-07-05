"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { useSimulation } from "@/contexts/SimulationContext";
import { useFinancialAssets } from "@/contexts/FinancialAssetsContext";
import { useFinancialData } from "@/contexts/FinancialDataContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [simulationName, setSimulationName] = useState("");

  const {
    simulations,
    currentSimulation,
    saveSimulation,
    loadSimulation,
    deleteSimulation,
  } = useSimulation();

  const { financialAssets, setFinancialAssets } = useFinancialAssets();
  const { incomes, expenses } = useFinancialData();

  const handleSaveSimulation = () => {
    if (simulationName.trim()) {
      // Note: We need to convert grouped data back to the old format for saving
      // This is a temporary solution until we update the SimulationContext
      const oldFormatExpenses = expenses.map((e) => ({
        id: e.id,
        name: e.name,
        cycles: e.cycles,
        color: e.color,
      }));
      const oldFormatIncomes = incomes.map((i) => ({
        id: i.id,
        name: i.name,
        cycles: i.cycles,
        color: i.color,
      }));
      saveSimulation(
        simulationName.trim(),
        financialAssets,
        oldFormatExpenses,
        oldFormatIncomes
      );
      setSimulationName("");
      setShowSaveModal(false);
    }
  };

  const handleLoadSimulation = (id: string) => {
    const simulation = simulations.find((sim) => sim.id === id);
    if (simulation) {
      setFinancialAssets(simulation.financialAssets);
      // Note: Loading old format data - we'll need to update this
      // For now, we'll just clear the data
      loadSimulation(id);
      setShowLoadModal(false);
    }
  };

  const handleNewSimulation = () => {
    // 全てのデータをクリア
    setFinancialAssets({
      assets: [],
    });
    // Note: We can't directly clear grouped data from here
    // This would need to be handled in the FinancialDataContext
    // 現在のシミュレーションをクリア
    loadSimulation("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              MoneyTrack
            </h1>
            {currentSimulation && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                現在のシミュレーション: {currentSimulation.name}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleNewSimulation}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              新規作成
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              保存
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              読み込み
            </button>
          </div>
        </div>
      </header>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              シミュレーションを保存
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                シミュレーション名
              </label>
              <input
                type="text"
                value={simulationName}
                onChange={(e) => setSimulationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="例：退職後プラン"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSimulationName("");
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveSimulation}
                disabled={!simulationName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              シミュレーションを読み込み
            </h3>
            <div className="mb-4 max-h-64 overflow-y-auto">
              {simulations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  保存されたシミュレーションがありません
                </div>
              ) : (
                <div className="space-y-2">
                  {simulations.map((simulation) => (
                    <div
                      key={simulation.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {simulation.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(simulation.createdAt).toLocaleString(
                            "ja-JP"
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLoadSimulation(simulation.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200"
                        >
                          読み込み
                        </button>
                        <button
                          onClick={() => deleteSimulation(simulation.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors duration-200"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div className="max-w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
