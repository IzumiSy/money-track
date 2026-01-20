import FinancialAssetsForm from "@/components/FinancialAssetsForm";
import { toast } from "sonner";

export default function FinancialAssetsPage() {
  const handleFinancialAssetsSubmit = () => {
    toast.success("資産情報を保存しました");
  };

  return <FinancialAssetsForm onSubmit={handleFinancialAssetsSubmit} />;
}
