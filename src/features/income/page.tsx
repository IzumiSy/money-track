import IncomeForm from "./IncomeForm";
import { toast } from "sonner";

export default function IncomePage() {
  const handleIncomeSubmit = () => {
    toast.success("収入情報を保存しました");
  };

  return (
    <div className="space-y-6">
      <IncomeForm onSubmit={handleIncomeSubmit} />
    </div>
  );
}
