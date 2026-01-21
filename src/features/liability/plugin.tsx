import { GroupedLiability } from "@/features/group/types";
import { SourcePlugin, MonthlyProcessingContext } from "@/core/plugin/types";
import {
  convertLiabilityToLiabilitySource,
  createLiabilityRepaymentSource,
} from "./source";
import LiabilitiesForm from "./LiabilitiesForm";

/**
 * 負債管理アイコン
 */
function LiabilityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth={1.5} />
      <path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" strokeWidth={1.5} />
      <rect x="7" y="13" width="4" height="2" rx="0.5" strokeWidth={1.5} />
    </svg>
  );
}

/**
 * 負債プラグイン
 */
export const LiabilityPlugin: SourcePlugin<GroupedLiability> = {
  type: "liability",
  displayName: "負債",
  icon: "📋",
  description: "ローン、借入などの負債を管理",
  dependencies: ["asset"], // 返済は資産から行われるため

  // Simulation Logic
  createSources(data: GroupedLiability) {
    const sources = [convertLiabilityToLiabilitySource(data)];
    const repaymentSource = createLiabilityRepaymentSource(data);
    if (repaymentSource) {
      sources.push(repaymentSource);
    }
    return sources;
  },

  getInitialBalance(source) {
    const metadata = source.getMetadata?.();
    return (metadata?.totalAmount as number) ?? 0;
  },

  applyMonthlyEffect(context: MonthlyProcessingContext) {
    const { source, cashFlowChange, sourceBalances, cashOutflows } =
      context;
    const metadata = source.getMetadata?.();
    const assetSourceId = metadata?.assetSourceId as string | undefined;

    // 返済額（expense）を処理
    if (cashFlowChange.expense > 0) {
      // 負債残高を減少
      const liabilityBalances = sourceBalances.get("liability");
      if (liabilityBalances) {
        const currentLiabilityBalance = liabilityBalances.get(source.id) ?? 0;
        const newLiabilityBalance = Math.max(
          0,
          currentLiabilityBalance - cashFlowChange.expense,
        );
        liabilityBalances.set(source.id, newLiabilityBalance);
      }

      // 返済をキャッシュアウトに記録
      const expenseKey = `repayment_${source.id}`;
      const prevExpense = cashOutflows.get(expenseKey) ?? 0;
      cashOutflows.set(expenseKey, prevExpense + cashFlowChange.expense);

      // 返済元資産から減算
      if (assetSourceId) {
        const assetBalances = sourceBalances.get("asset");
        if (assetBalances) {
          const currentAssetBalance = assetBalances.get(assetSourceId) ?? 0;
          assetBalances.set(
            assetSourceId,
            currentAssetBalance - cashFlowChange.expense,
          );
        }
      }
    }
  },

  // Chart Display
  getChartConfig() {
    return [
      {
        dataKeyPrefix: "balance_liability_",
        stackId: "balance",
        category: "balance",
        priority: 10, // 資産の後に表示
      },
      {
        dataKeyPrefix: "expense_repayment_",
        stackId: "expense",
        category: "expense",
        nameSuffix: " 返済",
        priority: 5,
      },
    ];
  },

  getDisplayName(source) {
    return source.name;
  },

  // UI Integration
  pageInfo: {
    path: "/dashboard/liabilities",
    label: "負債",
    order: 2,
    component: LiabilitiesForm,
    icon: LiabilityIcon,
  },

  // Data Access
  getGroupId(data) {
    return data.groupId;
  },
  isGroupScoped: true,
};
