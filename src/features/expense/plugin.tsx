import { GroupedExpense } from "@/features/group/types";
import { SourcePlugin, MonthlyProcessingContext } from "@/core/plugin/types";
import { convertExpenseToExpenseSource } from "./source";
import ExpensesForm from "./ExpensesForm";

/**
 * 支出管理アイコン
 */
function ExpenseIcon({ className }: { className?: string }) {
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
        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
      />
    </svg>
  );
}

/**
 * 支出プラグイン
 */
export const ExpensePlugin: SourcePlugin<GroupedExpense> = {
  type: "expense",
  displayName: "支出",
  icon: "💸",
  description: "生活費、固定費、その他の支出を管理",
  dependencies: ["asset"], // 支出は資産から減算されるため

  // Simulation Logic
  createSources(data) {
    return [convertExpenseToExpenseSource(data)];
  },

  applyMonthlyEffect(context: MonthlyProcessingContext) {
    const { source, cashFlowChange, sourceBalances, cashOutflows } =
      context;
    const metadata = source.getMetadata?.();
    const assetSourceId = metadata?.assetSourceId as string | undefined;

    // 支出をキャッシュアウトに記録
    if (cashFlowChange.expense > 0) {
      const expenseKey = source.id;
      const prevExpense = cashOutflows.get(expenseKey) ?? 0;
      cashOutflows.set(expenseKey, prevExpense + cashFlowChange.expense);

      // 支出を指定された資産から減算
      if (assetSourceId) {
        const assetBalances = sourceBalances.get("asset");
        if (assetBalances) {
          const currentBalance = assetBalances.get(assetSourceId) ?? 0;
          assetBalances.set(
            assetSourceId,
            currentBalance - cashFlowChange.expense,
          );
        }
      }
    }
  },

  // Chart Display
  getChartConfig() {
    return [
      {
        dataKeyPrefix: "expense_",
        stackId: "expense",
        category: "expense",
        priority: 1,
      },
    ];
  },

  getDisplayName(source) {
    return source.name;
  },

  // UI Integration
  pageInfo: {
    path: "/dashboard/expenses",
    label: "支出",
    order: 4,
    component: ExpensesForm,
    icon: ExpenseIcon,
  },

  // Data Access
  getGroupId(data) {
    return data.groupId;
  },
  isGroupScoped: true,
};
