import AppLayout from "@/components/AppLayout";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { Toaster } from "sonner";

const Layout = (props: React.PropsWithChildren) => {
  return (
    <SimulationProvider>
      <AppLayout>
        {props.children}
        <Toaster richColors />
      </AppLayout>
    </SimulationProvider>
  );
};

export default Layout;
