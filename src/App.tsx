import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "@/components/AppLayout";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { Toaster } from "sonner";

// Import page components
import SimulatorPage from "@/app/dashboard/simulator/page";
import ExpensesPage from "@/app/dashboard/expenses/page";
import FinancialAssetsPage from "@/app/dashboard/financial-assets/page";
import IncomePage from "@/app/dashboard/income/page";
import LiabilitiesPage from "@/app/dashboard/liabilities/page";

function App() {
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
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route
                    path="financial-assets"
                    element={<FinancialAssetsPage />}
                  />
                  <Route path="income" element={<IncomePage />} />
                  <Route path="liabilities" element={<LiabilitiesPage />} />
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
