import AppLayout from "@/components/AppLayout";
import { FinancialAssetsProvider } from "@/contexts/FinancialAssetsContext";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { Toaster } from "sonner";

const Layout = (props: React.PropsWithChildren) => {
  return (
    <SimulationProvider>
      <FinancialAssetsProvider>
        <FinancialDataProvider>
          <AppLayout>
            {props.children}
            <Toaster richColors />
          </AppLayout>
        </FinancialDataProvider>
      </FinancialAssetsProvider>
    </SimulationProvider>
  );
};

export default Layout;
