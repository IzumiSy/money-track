import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "@/shared/ui/AppLayout";
import { SimulationProvider } from "@/features/simulator/context";
import { PluginProvider } from "@/core/plugin/PluginDataContext";
import { usePluginRegistry, globalRegistry } from "@/core/plugin";
import { Toaster } from "sonner";

// Import page components
import SimulatorPage from "@/features/simulator/page";

// Import plugins
import { AssetPlugin } from "@/features/asset/plugin";
import { LiabilityPlugin } from "@/features/liability/plugin";
import { IncomePlugin } from "@/features/income/plugin";
import { ExpensePlugin } from "@/features/expense/plugin";

// プラグインを依存関係順に登録
// 1. Asset（依存なし）
// 2. Liability, Income, Expense（Assetに依存）
globalRegistry.register(AssetPlugin);
globalRegistry.register(LiabilityPlugin);
globalRegistry.register(IncomePlugin);
globalRegistry.register(ExpensePlugin);

/**
 * プラグインルートを動的に生成する関数
 */
function usePluginRoutes() {
  const registry = usePluginRegistry();
  const plugins = registry.getAllPlugins();

  return plugins.map((plugin) => {
    const PageComponent = plugin.pageInfo.component;
    const path = plugin.pageInfo.path.replace("/dashboard/", "");
    return (
      <Route
        key={plugin.type}
        path={path}
        element={
          <PluginProvider plugin={plugin}>
            <PageComponent />
          </PluginProvider>
        }
      />
    );
  });
}

function App() {
  const pluginRoutes = usePluginRoutes();

  return (
    <BrowserRouter basename="/money-track">
      <SimulationProvider>
        <Routes>
          {/* Root redirect to simulator */}
          <Route
            path="/"
            element={<Navigate to="/dashboard/simulator" replace />}
          />

          {/* Dashboard routes with layout */}
          <Route
            path="/dashboard/*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="simulator" element={<SimulatorPage />} />
                  {/* プラグインページは自動的にPluginProviderでラップ */}
                  {pluginRoutes}
                </Routes>
                <Toaster richColors />
              </AppLayout>
            }
          />
        </Routes>
      </SimulationProvider>
    </BrowserRouter>
  );
}

export default App;
