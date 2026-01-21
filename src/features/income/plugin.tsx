import { GroupedIncome } from "@/features/group/types";
import { SourcePlugin, MonthlyProcessingContext } from "@/core/plugin/types";
import { convertIncomeToIncomeSource } from "./source";
import IncomeForm from "./IncomeForm";

/**
 * 収入管理アイコン
 */
function IncomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

/**
 * 収入プラグイン
 */
export const IncomePlugin: SourcePlugin<GroupedIncome> = {
  type: "income",
  displayName: "収入",
  icon: "💰",
  description: "給与、副業収入、配当などの収入源を管理",
  dependencies: ["asset"], // 収入は資産に紐づくため

  // Simulation Logic
  createSources(data) {
    return [convertIncomeToIncomeSource(data)];
  },

  applyMonthlyEffect(context: MonthlyProcessingContext) {
    const { source, cashFlowChange, sourceBalances, cashInflows } = context;
    const metadata = source.getMetadata?.();
    const assetSourceId = metadata?.assetSourceId as string | undefined;

    // 収入をキャッシュインに記録
    if (cashFlowChange.income > 0) {
      const incomeKey = source.id;
      const prevIncome = cashInflows.get(incomeKey) ?? 0;
      cashInflows.set(incomeKey, prevIncome + cashFlowChange.income);

      // 収入を指定された資産に加算
      if (assetSourceId) {
        const assetBalances = sourceBalances.get("asset");
        if (assetBalances) {
          const currentBalance = assetBalances.get(assetSourceId) ?? 0;
          assetBalances.set(
            assetSourceId,
            currentBalance + cashFlowChange.income,
          );
        }
      }
    }
  },

  // Chart Display
  getChartConfig() {
    return [
      {
        dataKeyPrefix: "income_",
        stackId: "income",
        category: "income",
        priority: 1,
      },
    ];
  },

  getDisplayName(source) {
    return source.name;
  },

  // UI Integration
  pageInfo: {
    path: "/dashboard/income",
    label: "収入",
    order: 3,
    component: IncomeForm,
    icon: IncomeIcon,
  },

  // Data Access
  getGroupId(data) {
    return data.groupId;
  },
  isGroupScoped: true,
};
