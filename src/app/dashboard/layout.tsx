import AppLayout from "@/components/AppLayout";
import { FinancialAssetsProvider } from "@/contexts/FinancialAssetsContext";
import { ExpensesProvider } from "@/contexts/ExpensesContext";
import { IncomeProvider } from "@/contexts/IncomeContext";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { Toaster } from "sonner";

const Layout = (props: React.PropsWithChildren) => {
  return (
    <SimulationProvider>
      <FinancialAssetsProvider>
        <ExpensesProvider>
          <IncomeProvider>
            <AppLayout>
              {props.children}
              <Toaster richColors />
            </AppLayout>
          </IncomeProvider>
        </ExpensesProvider>
      </FinancialAssetsProvider>
    </SimulationProvider>
  );
};

export default Layout;
