import { GroupedAsset } from "@/features/group/types";
import {
  SourcePlugin,
  MonthlyProcessingContext,
  PostMonthlyContext,
} from "@/core/plugin/types";
import { convertAssetToAssetSource } from "./source";
import FinancialAssetsForm from "./FinancialAssetsForm";

/**
 * 金融資産管理アイコン
 */
function AssetIcon({ className }: { className?: string }) {
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
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  );
}

/**
 * 金融資産プラグイン
 */
export const AssetPlugin: SourcePlugin<GroupedAsset> = {
  type: "asset",
  displayName: "金融資産",
  icon: "🏦",
  description: "預金、投資信託、株式などの金融資産を管理",

  // Simulation Logic
  createSources(data) {
    return [convertAssetToAssetSource(data)];
  },

  getInitialBalance(source) {
    const metadata = source.getMetadata?.();
    return (metadata?.baseAmount as number) ?? 0;
  },

  applyMonthlyEffect(context: MonthlyProcessingContext) {
    const { source, cashFlowChange, assetBalances, expenseBreakdown } = context;

    // 資産自体のキャッシュフローによる残高変動
    const currentBalance = assetBalances.get(source.id) ?? 0;
    // 積立（expense）で残高増加、引き出し（income）で残高減少
    const newBalance =
      currentBalance + cashFlowChange.expense - cashFlowChange.income;
    assetBalances.set(source.id, newBalance);

    // 積立を支出内訳に記録
    if (cashFlowChange.expense > 0) {
      const expenseKey = `investment_${source.id}`;
      const prevExpense = expenseBreakdown.get(expenseKey) ?? 0;
      expenseBreakdown.set(expenseKey, prevExpense + cashFlowChange.expense);
    }
  },

  postMonthlyProcess(context: PostMonthlyContext) {
    const { assetBalances, incomeBreakdown, allSources } = context;

    // 資産リターン（利息）を計算
    allSources
      .filter((s) => s.type === "asset")
      .forEach((source) => {
        const currentBalance = assetBalances.get(source.id) ?? 0;
        const metadata = source.getMetadata?.();
        const returnRate = (metadata?.returnRate as number) ?? 0;

        if (returnRate !== 0) {
          const interest = currentBalance * (returnRate / 12);
          assetBalances.set(source.id, currentBalance + interest);

          const returnIncomeKey = `return_${source.id}`;
          const prev = incomeBreakdown.get(returnIncomeKey) ?? 0;
          incomeBreakdown.set(returnIncomeKey, prev + interest);
        }
      });
  },

  // Chart Display
  getChartConfig() {
    return [
      {
        dataKeyPrefix: "balance_asset_",
        stackId: "balance",
        category: "balance",
        priority: 1,
      },
      {
        dataKeyPrefix: "expense_investment_",
        stackId: "expense",
        category: "expense",
        nameSuffix: " 積立",
        opacity: 0.7,
        priority: 2,
      },
      {
        dataKeyPrefix: "income_sellback_",
        stackId: "income",
        category: "income",
        nameSuffix: " 売却益",
        opacity: 0.8,
        priority: 3,
      },
      {
        dataKeyPrefix: "income_return_",
        stackId: "income",
        category: "income",
        nameSuffix: " 利回り",
        priority: 4,
      },
    ];
  },

  getDisplayName(source) {
    return source.name;
  },

  // UI Integration
  pageInfo: {
    path: "/dashboard/financial-assets",
    label: "金融資産",
    order: 1,
    component: FinancialAssetsForm,
    icon: AssetIcon,
  },

  // Data Access
  getGroupId(data) {
    return data.groupId;
  },
  isGroupScoped: true,
};
