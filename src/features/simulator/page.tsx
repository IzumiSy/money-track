import FinancialAssetsChart from "@/features/asset/FinancialAssetsChart";
import { useAssetManagement } from "@/features/asset/useAssetManagement";

export default function SimulatorPage() {
  const { assets } = useAssetManagement();

  return (
    <div className="space-y-6">
      {/* 資産状況チャート */}
      <FinancialAssetsChart assets={assets} />
    </div>
  );
}
