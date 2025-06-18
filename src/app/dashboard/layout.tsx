import AppLayout from "@/components/AppLayout";
import { FinancialAssetsProvider } from "@/contexts/FinancialAssetsContext";
import { ExpensesProvider } from "@/contexts/ExpensesContext";

const Layout = (props: React.PropsWithChildren) => {
  return (
    <FinancialAssetsProvider>
      <ExpensesProvider>
        <AppLayout>{props.children}</AppLayout>
      </ExpensesProvider>
    </FinancialAssetsProvider>
  );
};

export default Layout;
