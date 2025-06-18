import AppLayout from "@/components/AppLayout";
import { FinancialAssetsProvider } from "@/contexts/FinancialAssetsContext";

const Layout = (props: React.PropsWithChildren) => {
  return (
    <FinancialAssetsProvider>
      <AppLayout>{props.children}</AppLayout>
    </FinancialAssetsProvider>
  );
};

export default Layout;
