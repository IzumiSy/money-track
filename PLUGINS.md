# プラグインアーキテクチャ設計書

## 概要

本ドキュメントは、計算ソース（金融資産、負債、収入、支出など）をプラグインとして独立的に扱うためのアーキテクチャ設計を記述します。

### 目次

1. [設計目標](#設計目標)
2. [アーキテクチャ全体図](#アーキテクチャ全体図)
3. [インターフェース定義](#インターフェース定義)
4. [プラグイン実装例](#プラグイン実装例)
5. [データフロー](#データフロー)
6. [UI統合](#ui統合)
7. [チャート統合](#チャート統合)
8. [新規プラグイン追加ガイド](#新規プラグイン追加ガイド)
9. [ディレクトリ構造](#ディレクトリ構造)
10. [設計原則](#設計原則)
11. [追加設計事項](#追加設計事項)
12. [実装方針（決定事項）](#実装方針決定事項)
13. [実装優先順位](#実装優先順位)

### 設計目標

- **拡張性**: 新しいソースタイプを追加する際、コアのSimulatorやChartコンポーネントを修正する必要がない
- **関心の分離**: ソースタイプ固有のロジックがそれぞれのプラグインにカプセル化される
- **UI自由度**: 入力フォームは任意のReactコンポーネントとして実装可能
- **自動統合**: サイドバーとルーティングへの自動統合

---

## アーキテクチャ全体図

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            Plugin Architecture                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                         SourcePlugin<TData>                                │  │
│  │                                                                            │  │
│  │   Pure Domain Logic                          UI (Free)                     │  │
│  │  ┌─────────────────────────────┐           ┌─────────────────────────────┐ │  │
│  │  │ • type                      │           │ • pageInfo.component        │ │  │
│  │  │ • createSource()            │           │                             │ │  │
│  │  │ • applyMonthlyEffect()      │           │   -> Any React component    │ │  │
│  │  │ • postMonthlyProcess()      │           │   -> Fully customizable     │ │  │
│  │  │ • getChartConfig()          │           │   -> Reuse existing comps   │ │  │
│  │  └─────────────────────────────┘           └─────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│              ┌────────────────────────┼────────────────────────┐                 │
│              ▼                        ▼                        ▼                 │
│  ┌──────────────-─────┐  ┌────────────────────┐  ┌────────────────────┐          │
│  │PluginAwareSimulator│  │ PluginAwareChart   │  │ Sidebar / Router   │          │
│  │                    │  │                    │  │ (auto-integration) │          │
│  └──────────────-─────┘  └────────────────────┘  └────────────────────┘          │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## インターフェース定義

### SourcePlugin

```typescript
// domains/shared/plugin/types.ts

import { ComponentType } from "react";

/**
 * サイドバー/ルーティングに追加されるページ情報
 */
interface PluginPageInfo {
  /** ルートパス（例: "/dashboard/income"） */
  path: string;
  /** サイドバーに表示するラベル */
  label: string;
  /** サイドバーの表示順序（小さいほど上） */
  order?: number;
  /** ページコンポーネント */
  component: ComponentType;
}

/**
 * チャート表示設定
 */
interface ChartBarConfig {
  /** データキーのプレフィックス（例: "investment_", "income_"） */
  dataKeyPrefix: string;
  /** スタックグループID（同じIDのバーは積み上げ表示） */
  stackId: string;
  /** バーのカテゴリ */
  category: "balance" | "income" | "expense";
  /** 表示名のサフィックス（オプション） */
  nameSuffix?: string;
  /** 透明度 */
  opacity?: number;
}

/**
 * シミュレーション中の月次処理コンテキスト
 */
interface MonthlyProcessingContext {
  monthIndex: number;
  source: CalculatorSource;
  cashFlowChange: CashFlowChange;
  assetBalances: Map<string, number>;
  liabilityBalances: Map<string, number>;
  incomeBreakdown: Map<string, number>;
  expenseBreakdown: Map<string, number>;
  allSources: readonly CalculatorSource[];
}

/**
 * ソースプラグインインターフェース
 */
interface SourcePlugin<TData = unknown> {
  // ===== Identity =====
  /** プラグインが処理するソースタイプ */
  readonly type: string;
  /** プラグインの表示名 */
  readonly displayName: string;
  /** アイコン（Emoji or SVGパス） */
  readonly icon?: string;
  /** プラグインの説明 */
  readonly description?: string;
  
  // ===== Simulation Logic (Pure) =====
  /** ドメインデータからCalculatorSourceを生成 */
  createSource(data: TData): CalculatorSource;
  /** 初期残高を取得（残高を持つソースタイプ用） */
  getInitialBalance?(source: CalculatorSource): number;
  /** 月次キャッシュフロー計算後の効果を適用 */
  applyMonthlyEffect?(context: MonthlyProcessingContext): void;
  /** 月末処理（全ソースの処理完了後に実行） */
  postMonthlyProcess?(context: Omit<MonthlyProcessingContext, 'source' | 'cashFlowChange'>): void;
  
  // ===== Chart Display =====
  /** チャート表示用の設定を返す */
  getChartConfig?(): ChartBarConfig[];
  /** チャートの凡例に表示する名前を返す */
  getDisplayName?(source: CalculatorSource): string;
  
  // ===== UI Integration =====
  /** ページ情報（サイドバー・ルーティング用） */
  pageInfo: PluginPageInfo;
}
```

### PluginRegistry

```typescript
// domains/shared/plugin/registry.ts

interface PluginRegistry {
  /** プラグインを登録 */
  register<T>(plugin: SourcePlugin<T>): void;
  /** プラグインを登録解除 */
  unregister(type: string): void;
  /** タイプからプラグインを取得 */
  getPlugin(type: string): SourcePlugin | undefined;
  /** 全プラグインを取得 */
  getAllPlugins(): SourcePlugin[];
  /** プラグインが登録されているか確認 */
  hasPlugin(type: string): boolean;
}

function createPluginRegistry(): PluginRegistry {
  const plugins = new Map<string, SourcePlugin>();
  
  return {
    register(plugin) {
      if (plugins.has(plugin.type)) {
        console.warn(`Plugin for type "${plugin.type}" already registered. Overwriting.`);
      }
      plugins.set(plugin.type, plugin);
    },
    
    unregister(type) {
      plugins.delete(type);
    },
    
    getPlugin(type) {
      return plugins.get(type);
    },
    
    getAllPlugins() {
      return Array.from(plugins.values());
    },
    
    hasPlugin(type) {
      return plugins.has(type);
    },
  };
}
```

---

## プラグイン実装例

### IncomePlugin

```typescript
// domains/income/plugin.ts

import IncomeForm from "@/components/IncomeForm";

export const IncomePlugin: SourcePlugin<GroupedIncome> = {
  type: "income",
  displayName: "収入",
  icon: "💰",
  description: "給与、副業収入、配当などの収入源を管理",
  
  // Simulation Logic
  createSource: convertIncomeToIncomeSource,
  
  applyMonthlyEffect(context) {
    const { source, cashFlowChange, assetBalances } = context;
    const metadata = source.getMetadata?.();
    const assetSourceId = metadata?.assetSourceId as string | undefined;
    
    if (assetSourceId && cashFlowChange.income > 0) {
      const currentBalance = assetBalances.get(assetSourceId) ?? 0;
      assetBalances.set(assetSourceId, currentBalance + cashFlowChange.income);
    }
  },
  
  // Chart Display
  getChartConfig() {
    return [{
      dataKeyPrefix: "income_",
      stackId: "income",
      category: "income",
    }];
  },
  
  // UI - 既存のコンポーネントをそのまま使用
  pageInfo: {
    path: "/dashboard/income",
    label: "収入",
    order: 2,
    component: IncomeForm,
  },
};
```

### AssetPlugin

```typescript
// domains/asset/plugin.ts

import FinancialAssetsForm from "@/components/FinancialAssetsForm";

export const AssetPlugin: SourcePlugin<GroupedAsset> = {
  type: "asset",
  displayName: "金融資産",
  icon: "🏦",
  description: "預金、投資信託、株式などの金融資産を管理",
  
  createSource: convertAssetToAssetSource,
  
  getInitialBalance(source) {
    const metadata = source.getMetadata?.();
    return (metadata?.baseAmount as number) ?? 0;
  },
  
  applyMonthlyEffect(context) {
    const { source, cashFlowChange, assetBalances } = context;
    const currentBalance = assetBalances.get(source.id) ?? 0;
    // 積立（expense）で残高増加、引き出し（income）で残高減少
    const newBalance = currentBalance + cashFlowChange.expense - cashFlowChange.income;
    assetBalances.set(source.id, newBalance);
  },
  
  postMonthlyProcess(context) {
    const { assetBalances, incomeBreakdown, allSources } = context;
    
    // 資産リターン（利息）を計算
    allSources
      .filter(s => s.type === "asset")
      .forEach(source => {
        const currentBalance = assetBalances.get(source.id) ?? 0;
        const metadata = source.getMetadata?.();
        const returnRate = (metadata?.returnRate as number) ?? 0;
        
        if (returnRate !== 0) {
          const interest = currentBalance * (returnRate / 12);
          assetBalances.set(source.id, currentBalance + interest);
          
          const returnIncomeKey = `return_income_${source.id}`;
          const prev = incomeBreakdown.get(returnIncomeKey) ?? 0;
          incomeBreakdown.set(returnIncomeKey, prev + interest);
        }
      });
  },
  
  getChartConfig() {
    return [
      {
        dataKeyPrefix: "investment_",
        stackId: "balance",
        category: "balance",
      },
      {
        dataKeyPrefix: "investment_expense_",
        stackId: "expense",
        category: "expense",
        nameSuffix: " 積立",
        opacity: 0.7,
      },
      {
        dataKeyPrefix: "sellback_income_",
        stackId: "income",
        category: "income",
        nameSuffix: " 売却益",
        opacity: 0.8,
      },
      {
        dataKeyPrefix: "return_income_",
        stackId: "income",
        category: "income",
        nameSuffix: " 利回り",
      },
    ];
  },
  
  pageInfo: {
    path: "/dashboard/financial-assets",
    label: "金融資産",
    order: 1,
    component: FinancialAssetsForm,
  },
};
```

---

## データフロー

### PluginDataContext

```typescript
// contexts/PluginDataContext.tsx

interface PluginContextValue<TData = unknown> {
  /** 現在のプラグイン */
  plugin: SourcePlugin<TData>;
  
  /** このプラグインタイプのデータ（グループでフィルタ済み） */
  data: TData[];
  
  /** データの更新（upsert） */
  upsert: (groupId: string, items: TData[]) => void;
  
  /** グループIDでフィルタしたデータを取得 */
  getByGroupId: (groupId: string) => TData[];
  
  /** 他のプラグインのデータにアクセス */
  getOtherPluginData: <K extends keyof PluginDataTypeMap>(pluginType: K, groupId?: string) => PluginDataTypeMap[K][];
}

// selectedGroupIdはSimulationContextでグローバル管理
// const { selectedGroupId, setSelectedGroupId } = useSimulationContext();
```

### usePluginData フック

```typescript
// hooks/usePluginData.ts

/**
 * プラグインのデータにアクセスする型安全なフック
 * PluginProvider内で使用する
 * 
 * @template K - PluginDataTypeMapのキー（"income" | "expense" | "asset" | "liability" | ...）
 */
export function usePluginData<K extends keyof PluginDataTypeMap>(): PluginContextValue<PluginDataTypeMap[K]> {
  const context = useContext(PluginDataContext);
  
  if (!context) {
    throw new Error(
      "usePluginData must be used within a PluginProvider. " +
      "Make sure your component is rendered inside a plugin page."
    );
  }
  
  return context as PluginContextValue<PluginDataTypeMap[K]>;
}

// 使用例
// const { data } = usePluginData<"income">();  // data: GroupedIncome[]
```

### データフロー図

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 Data Flow                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         SimulationContext                                │   │
│  │                         (Single Source of Truth)                         │   │
│  │                                                                          │   │
│  │   state: {                                                               │   │
│  │     groups: Group[],                                                     │   │
│  │     selectedGroupId: string | null,   <- グローバルで管理                │   │
│  │     pluginData: {                     <- 動的プラグインデータストア      │   │
│  │       "income": GroupedIncome[],                                         │   │
│  │       "expense": GroupedExpense[],                                       │   │
│  │       "asset": GroupedAsset[],                                           │   │
│  │       "liability": GroupedLiability[],                                   │   │
│  │     },                                                                   │   │
│  │     savedSimulations: SavedSimulation[],                                 │   │
│  │     activeSimulationId: string | null,                                   │   │
│  │   }                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      ▲                                          │
│                                      │ dispatch                                 │
│                                      │                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         PluginProvider                                   │   │
│  │                                                                          │   │
│  │   • Holds plugin information                                             │   │
│  │   • Extracts data of matching type from SimulationContext.pluginData     │   │
│  │   • Provides upsert, getByGroupId, getOtherPluginData                    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      ▲                                          │
│                                      │ usePluginData()                          │
│                                      │                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    pageInfo.component (e.g., IncomeForm)                 │   │
│  │                                                                          │   │
│  │   const { plugin, data, upsert, getOtherPluginData } = usePluginData();  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## UI統合

### サイドバー自動生成

```tsx
// components/Sidebar.tsx

function Sidebar() {
  const registry = usePluginRegistry();
  const plugins = registry.getAllPlugins();
  
  // プラグインからページ情報を取得してソート
  const pluginPages = plugins
    .map(p => ({ ...p.pageInfo, icon: p.icon }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  
  return (
    <nav>
      {/* 固定メニュー */}
      <NavItem to="/dashboard" icon="📊" label="ダッシュボード" />
      
      {/* プラグインから動的に生成 */}
      {pluginPages.map(page => (
        <NavItem 
          key={page.path}
          to={page.path}
          icon={page.icon}
          label={page.label}
        />
      ))}
      
      {/* シミュレーターは常に最後 */}
      <NavItem to="/dashboard/simulator" icon="📈" label="シミュレーター" />
    </nav>
  );
}
```

### ルーティング自動生成

```tsx
// App.tsx

function App() {
  const registry = usePluginRegistry();
  const plugins = registry.getAllPlugins();
  
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        
        {/* プラグインページは自動的にPluginProviderでラップ */}
        {plugins.map(plugin => (
          <Route
            key={plugin.type}
            path={plugin.pageInfo.path.replace("/dashboard/", "")}
            element={
              <PluginProvider plugin={plugin}>
                <plugin.pageInfo.component />
              </PluginProvider>
            }
          />
        ))}
        
        <Route path="simulator" element={<SimulatorPage />} />
      </Route>
    </Routes>
  );
}
```

---

## チャート統合

### プラグインからバー定義を生成

```typescript
// domains/shared/plugin/chartHelpers.ts

interface ChartBarDefinition {
  key: string;
  dataKey: string;
  stackId: string;
  fill: string;
  name: string;
  opacity: number;
}

function generateChartBars(
  registry: PluginRegistry,
  simulationData: SimulationDataPoint[],
  sourceDataMap: Map<string, { id: string; name: string; color: string; groupId: string }>,
  activeGroupIds: string[]
): ChartBarDefinition[] {
  const bars: ChartBarDefinition[] = [];
  
  if (simulationData.length === 0) return bars;
  
  const dataKeys = Object.keys(simulationData[0]);
  
  registry.getAllPlugins().forEach(plugin => {
    const chartConfigs = plugin.getChartConfig?.() ?? [];
    
    chartConfigs.forEach(config => {
      dataKeys
        .filter(key => key.startsWith(config.dataKeyPrefix))
        .forEach(dataKey => {
          const sourceId = dataKey.replace(config.dataKeyPrefix, "");
          const sourceData = sourceDataMap.get(sourceId);
          
          if (!sourceData || !activeGroupIds.includes(sourceData.groupId)) {
            return;
          }
          
          bars.push({
            key: dataKey,
            dataKey,
            stackId: config.stackId,
            fill: sourceData.color,
            name: sourceData.name + (config.nameSuffix ?? ""),
            opacity: config.opacity ?? 1,
          });
        });
    });
  });
  
  return bars;
}
```

---

## 新規プラグイン追加ガイド

### 追加手順

1. **ドメイン型を定義**
   ```
   domains/xxx/types.ts
   ```

2. **変換関数を実装**
   ```
   domains/xxx/source.ts
   ```

3. **UIコンポーネントを作成**
   ```
   components/XxxForm.tsx
   ```

4. **プラグインを実装**
   ```
   domains/xxx/plugin.ts
   ```

5. **レジストリに登録**
   ```
   domains/shared/plugin/defaultRegistry.ts
   ```

### チェックリスト

| #  | タスク | ファイル | 必須 |
|----|--------|----------|------|
| 1  | ドメイン型を定義 | `domains/xxx/types.ts` | ✅ |
| 2  | 変換関数を実装 | `domains/xxx/source.ts` | ✅ |
| 3  | UIコンポーネントを作成 | `components/XxxForm.tsx` | ✅ |
| 4  | プラグインを実装 | `domains/xxx/plugin.ts` | ✅ |
| 5  | レジストリに登録 | `defaultRegistry.ts` | ✅ |
| ❌ | Simulatorを修正 | - | 不要 |
| ❌ | Chartを修正 | - | 不要 |
| ❌ | Sidebarを修正 | - | 不要 |
| ❌ | ルーティングを修正 | - | 不要 |

### 実装例: 暗号資産プラグイン

```typescript
// 1. domains/crypto/types.ts
export interface GroupedCrypto {
  id: string;
  groupId: string;
  name: string;
  symbol: string;
  amount: number;
  color: string;
}

// 2. domains/crypto/source.ts
export function convertCryptoToSource(crypto: GroupedCrypto): CalculatorSource {
  return {
    id: crypto.id,
    name: crypto.name,
    type: "crypto",
    calculate: (monthIndex) => ({ income: 0, expense: 0 }),
    getMetadata: () => ({
      color: crypto.color,
      symbol: crypto.symbol,
      amount: crypto.amount,
    }),
  };
}

// 3. components/CryptoForm.tsx
export default function CryptoForm() {
  const { plugin, data, upsert, getOtherPluginData } = usePluginData<GroupedCrypto>();
  // 自由にUIを実装
}

// 4. domains/crypto/plugin.ts
export const CryptoPlugin: SourcePlugin<GroupedCrypto> = {
  type: "crypto",
  displayName: "暗号資産",
  icon: "₿",
  
  createSource: convertCryptoToSource,
  // ... simulation logic ...
  
  getChartConfig() {
    return [{
      dataKeyPrefix: "crypto_",
      stackId: "balance",
      category: "balance",
    }];
  },
  
  pageInfo: {
    path: "/dashboard/crypto",
    label: "暗号資産",
    order: 6,
    component: CryptoForm,
  },
};

// 5. domains/shared/plugin/defaultRegistry.ts
registry.register(CryptoPlugin);
```

---

## ディレクトリ構造

```
src/
├── domains/
│   ├── shared/
│   │   ├── plugin/
│   │   │   ├── index.ts
│   │   │   ├── types.ts          # SourcePlugin, ChartBarConfig, etc.
│   │   │   ├── registry.ts       # createPluginRegistry
│   │   │   ├── defaultRegistry.ts # デフォルトプラグインの登録
│   │   │   └── chartHelpers.ts   # generateChartBars
│   │   └── ...
│   ├── asset/
│   │   ├── types.ts
│   │   ├── source.ts
│   │   └── plugin.ts             # AssetPlugin
│   ├── income/
│   │   ├── source.ts
│   │   └── plugin.ts             # IncomePlugin
│   ├── expense/
│   │   ├── source.ts
│   │   └── plugin.ts             # ExpensePlugin
│   ├── liability/
│   │   ├── source.ts
│   │   └── plugin.ts             # LiabilityPlugin
│   └── simulation/
│       ├── createSimulator.ts
│       └── createPluginAwareSimulator.ts
├── contexts/
│   ├── SimulationContext.tsx
│   └── PluginDataContext.tsx     # PluginProvider
├── hooks/
│   ├── usePluginData.ts
│   └── usePluginRegistry.ts
└── components/
    ├── Sidebar.tsx               # プラグインから自動生成
    └── ...
```

---

## 設計原則

### Open/Closed Principle（開放/閉鎖原則）

- Simulatorは拡張に対して開いており、修正に対して閉じている
- 新しいソースタイプを追加してもコアロジックの変更は不要

### 関心の分離

| レイヤー | 責務 |
|----------|------|
| **Plugin (Domain)** | シミュレーションロジック、チャート設定 |
| **Plugin (UI)** | 入力フォーム（任意のReactコンポーネント） |
| **PluginProvider** | データアクセスAPI、プラグイン情報の注入 |
| **Simulator** | プラグインのライフサイクル実行 |
| **Chart** | プラグインからバー定義を動的生成 |

### 依存関係の方向

```
UI Components → PluginProvider → SimulationContext
                     ↓
                  Plugins → CalculatorSource
                     ↓
                  Simulator
```

---

## 追加設計事項

以下は、プラグインアーキテクチャを実装する際に考慮すべき追加の設計事項です。

### 1. 永続化とシリアライズ

プラグイン別のシリアライザで永続化を制御します。

```typescript
interface SourcePlugin<TData> {
  // ... 既存 ...
  
  /** データのシリアライズ（オプション） */
  serialize?(data: TData[]): unknown;
  /** デシリアライズ（オプション） */
  deserialize?(raw: unknown): TData[];
  /** スキーマバージョン */
  readonly schemaVersion?: number;
}

// 保存フォーマット
interface PersistedSimulation {
  version: number;
  groups: Group[];
  pluginData: Record<string, { version: number; data: unknown }>;
}
```

ロード時に各プラグインの`deserialize`を呼び、未登録プラグインのデータは破棄します。

---

### 2. プラグイン間の依存関係

明示的な依存宣言とトポロジカルソートで解決します。

```typescript
interface SourcePlugin<TData> {
  // ... 既存 ...
  
  /** このプラグインが依存する他プラグインのtype */
  readonly dependencies?: readonly string[];
}

// レジストリ側で依存解決
function createPluginRegistry(): PluginRegistry {
  return {
    register(plugin) {
      // 依存プラグインが全て登録済みかチェック
      const missing = plugin.dependencies?.filter(dep => !this.hasPlugin(dep));
      if (missing?.length) {
        throw new Error(`Plugin "${plugin.type}" requires: ${missing.join(", ")}`);
      }
      plugins.set(plugin.type, plugin);
    },
    
    // 依存順にソートして取得
    getAllPluginsSorted() {
      return topologicalSort(plugins);
    },
  };
}
```

---

### 3. チャート表示の順序制御

`ChartBarConfig`に優先度を追加します。

```typescript
interface ChartBarConfig {
  dataKeyPrefix: string;
  stackId: string;
  category: "balance" | "income" | "expense";
  
  /** カテゴリ内での表示優先度（小さいほど先） */
  priority?: number;
  
  /** レンダリング順序（zIndex的な役割） */
  renderOrder?: number;
  
  nameSuffix?: string;
  opacity?: number;
}

// カテゴリ自体の順序はシステム定義
const CATEGORY_ORDER = { balance: 0, income: 1, expense: 2 } as const;
```

---

### 4. グループ関連付けのオプション化

グループに属さないデータも扱えるようにします。

```typescript
interface SourcePlugin<TData> {
  // ... 既存 ...
  
  /** グループに属するデータかどうか（デフォルト: true） */
  readonly isGroupScoped?: boolean;
  
  /** データからgroupIdを取得（isGroupScoped=trueの場合必須） */
  getGroupId?(data: TData): string;
}

// グローバルデータ（グループに属さない）の例
export const GlobalSettingsPlugin: SourcePlugin<GlobalSettings> = {
  type: "globalSettings",
  isGroupScoped: false,
  // ...
};
```

---

### 5. バリデーションとエラーハンドリング

Result型とエラー報告機構を導入します。

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

interface SourcePlugin<TData> {
  // ... 既存 ...
  
  /** データのバリデーション */
  validate?(data: TData): Result<TData, ValidationError[]>;
}

interface MonthlyProcessingContext {
  // ... 既存 ...
  
  /** エラー報告用 */
  reportError(error: SimulationError): void;
  
  /** 前の月のスナップショット（リカバリー用） */
  previousSnapshot?: MonthlySnapshot;
}
```

Simulatorは各プラグインの処理をtry-catchでラップし、エラーがあってもシミュレーション全体は継続します。

---

### 6. テストユーティリティ

プラグインのテストを容易にするヘルパーを提供します。

```typescript
// domains/shared/plugin/testing.ts

/** テスト用のモックレジストリ */
export function createMockRegistry(plugins: SourcePlugin[]): PluginRegistry;

/** プラグイン単体テスト用ヘルパー */
export function testPlugin<TData>(
  plugin: SourcePlugin<TData>,
  testCases: {
    data: TData;
    expectedSource: Partial<CalculatorSource>;
    monthlyEffectAssertions?: (context: MonthlyProcessingContext) => void;
  }[]
): void;

/** シミュレーション結果の検証ヘルパー */
export function assertSimulationResult(
  result: SimulationResult,
  expectations: {
    month: number;
    assetBalance?: Record<string, number>;
    incomeBreakdown?: Record<string, number>;
  }[]
): void;
```

---

### 7. プラグインライフサイクル

登録・削除時のフックを提供します。

```typescript
interface SourcePlugin<TData> {
  // ... 既存 ...
  
  /** プラグイン登録時に呼ばれる */
  onRegister?(registry: PluginRegistry): void;
  
  /** プラグイン削除時に呼ばれる（クリーンアップ用） */
  onUnregister?(context: { 
    deletePluginData: () => void;  // SimulationContextから関連データを削除
  }): void;
}
```

---

## 実装方針（決定事項）

以下は実装時の方針として決定された事項です。

### 移行戦略: Big Bang

本番稼働前のため、段階的移行ではなく一括で新アーキテクチャに移行します。

- 既存の固定フィールド構造（`incomes`, `expenses`, `financialAssets`, `liabilities`）を廃止
- `pluginData: Record<string, unknown[]>` 構造に完全移行
- 既存のカスタムフック（`useIncomeManagement`等）も`usePluginData`に置き換え

### Registry初期化: シングルトン

モジュールレベルでシングルトンとして初期化します。

```typescript
// domains/shared/plugin/defaultRegistry.ts
export const globalRegistry = createPluginRegistry();
globalRegistry.register(IncomePlugin);
globalRegistry.register(ExpensePlugin);
globalRegistry.register(AssetPlugin);
globalRegistry.register(LiabilityPlugin);
```

- アクセスが簡単でコードがシンプル
- テスト時はモジュールモック（`vi.mock`）で対応

### 型安全性: PluginDataTypeMap

モジュール拡張による型マップで型安全性を確保します。

```typescript
// domains/shared/plugin/types.ts
interface PluginDataTypeMap {
  income: GroupedIncome;
  expense: GroupedExpense;
  asset: GroupedAsset;
  liability: GroupedLiability;
}

// 型安全なフック
function usePluginData<K extends keyof PluginDataTypeMap>(): 
  PluginContextValue<PluginDataTypeMap[K]>;
```

新規プラグイン追加時はモジュール拡張で型マップを拡張：

```typescript
// domains/crypto/plugin.ts
declare module "@/domains/shared/plugin/types" {
  interface PluginDataTypeMap {
    crypto: GroupedCrypto;
  }
}
```

### フォーム互換: 即時移行

既存のフォームコンポーネント（`IncomeForm`, `ExpensesForm`等）を`usePluginData`を使うように書き換えます。

- 互換レイヤーは設けない
- 既存のドメイン別フック（`useIncomeManagement`等）は廃止

### GroupId管理: グローバルContext

`selectedGroupId`は`SimulationContext`でグローバルに管理します。

```typescript
interface SimulationState {
  selectedGroupId: string | null;
  pluginData: Record<string, unknown[]>;
  // ...
}
```

- ページ間で選択状態が維持される
- 一貫したUXを提供

---

## 実装優先順位

追加設計事項の実装優先順位です。

| 優先度 | 追加設計事項 | 理由 |
|--------|-------------|------|
| **高** | 2. プラグイン間の依存関係 | 実装順序に影響 |
| **中** | 4. グループ関連付けのオプション化 | 柔軟性に影響 |
| **中** | 5. バリデーションとエラーハンドリング | 堅牢性 |
| **低** | 1. 永続化とシリアライズ | 後から追加可能 |
| **低** | 3. チャート表示の順序制御 | 微調整レベル |
| **低** | 6. テストユーティリティ | 並行で整備可能 |
| **低** | 7. プラグインライフサイクル | 当面不要 |
