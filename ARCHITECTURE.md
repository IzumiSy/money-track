# アーキテクチャドキュメント

## 技術構成

### 使用技術
- **Vite 6**: ビルドツール・開発サーバー
- **React 19**: UI ライブラリ
- **React Router 7**: クライアントサイドルーティング
- **TypeScript**: 型安全性
- **Tailwind CSS 4**: スタイリング
- **Recharts**: グラフ・チャート表示
- **Vitest**: テスティングフレームワーク
- **pnpm**: パッケージマネージャー

### プロジェクト構造
```
src/
├── main.tsx                # アプリケーションエントリポイント
├── App.tsx                 # ルーティング設定（プラグインから動的生成）
├── index.css               # グローバルスタイル
├── core/                   # コアインフラストラクチャ
│   ├── calculator/         # 計算エンジン（共通基盤）
│   │   ├── CalculatorSource.ts   # 計算対象の抽象化
│   │   ├── CashFlowChange.ts     # キャッシュフロー変化
│   │   ├── createCalculator.ts   # 計算機ファクトリー
│   │   ├── Cycle.ts              # 周期設定
│   │   ├── CycleCalculator.ts    # 周期計算
│   │   └── TimeRange.ts          # 時間範囲
│   └── plugin/             # プラグインシステム
│       ├── types.ts              # 型定義
│       ├── registry.ts           # レジストリ
│       ├── defaultRegistry.ts    # グローバルシングルトン
│       ├── chartHelpers.ts       # チャート統合
│       ├── PluginDataContext.tsx # プラグインデータProvider
│       └── usePluginRegistry.ts  # レジストリアクセスフック
├── features/               # 機能別モジュール（Feature-based）
│   ├── income/             # 収入機能
│   │   ├── plugin.tsx            # プラグイン定義
│   │   ├── source.ts             # ドメインロジック
│   │   ├── IncomeForm.tsx        # UIコンポーネント
│   │   ├── useIncomeManagement.tsx # フック
│   │   └── page.tsx              # ページ
│   ├── expense/            # 支出機能
│   ├── asset/              # 金融資産機能
│   ├── liability/          # 負債機能
│   ├── group/              # グループ機能
│   │   ├── types.ts              # 型定義
│   │   ├── GroupSelector.tsx     # UIコンポーネント
│   │   └── useGroupManagement.tsx # フック
│   └── simulator/          # シミュレーター機能
│       ├── context.tsx           # SimulationContext（状態管理）
│       ├── types.ts              # 型定義（状態・アクション含む）
│       ├── createSimulator.ts    # シミュレーターファクトリー
│       ├── financialSimulation.ts # シミュレーションロジック
│       ├── useFinancialSimulation.tsx # フック
│       ├── useSimulationManagement.tsx # 管理フック
│       └── page.tsx              # ページ
└── shared/                 # 共有リソース
    └── ui/                 # 共通UIコンポーネント
        ├── AppLayout.tsx         # レイアウト
        └── Sidebar.tsx           # サイドバー
```

## ドメインモデル

### 計算エンジン (`core/calculator/`)
- **Cycle**: 収入・支出の周期設定（月次、年次、カスタム）
- **Calculator**: キャッシュフロー計算エンジン
- **CashFlowChange**: キャッシュフロー変化の抽象化
- **CalculatorSource**: 計算対象の抽象化
- **TimeRange**: 時間範囲の管理

### グループ機能 (`features/group/`)
- **Group**: 収入・支出・金融資産をまとめるグループ
- **GroupedIncome**: グループに所属する収入
  - `assetSourceId`: 収入が加算される対象資産のID
- **GroupedExpense**: グループに所属する支出
  - `assetSourceId`: 支出が減算される対象資産のID
- **GroupedAsset**: グループに所属する金融資産

### シミュレーター機能 (`features/simulator/`)
- **Simulator**: 長期財務シミュレーション
- **SimulationParams**: シミュレーションパラメータ
- **SimulationResult**: シミュレーション結果
- **MonthlySimulationData**: 月次シミュレーションデータ

### 各feature（income, expense, asset, liability）
- **Source変換**: ドメインデータを計算用ソースに変換
  - 収入は指定された資産（assetSourceId）に加算される
  - 支出は指定された資産（assetSourceId）から減算される
  - 資産は積立オプションを支出、引き出しオプションを収入として計算

## 状態管理

### Single Source of Truth (SSOT) アーキテクチャ
- **SimulationContext**: すべてのデータを一元管理する統一Context
  - グループ、収入、支出、金融資産データを統合管理
  - シミュレーションの保存・読み込み機能
  - Reducerパターンによる予測可能な状態更新

### ドメイン別カスタムフック
責務の分離と使いやすさを両立するため、ドメイン別のカスタムフックを提供：

- **useGroupManagement**: グループ管理
  - `addGroup`: グループ追加
  - `updateGroup`: グループ更新
  - `deleteGroup`: グループ削除（関連する収入・支出も削除）
  - `toggleGroupActive`: グループの表示/非表示切り替え

- **useIncomeManagement**: 収入管理
  - `upsertIncomes`: 収入データの効率的な一括更新
  - `getIncomesByGroupId`: グループ別収入取得

- **useExpenseManagement**: 支出管理
  - `upsertExpenses`: 支出データの効率的な一括更新
  - `getExpensesByGroupId`: グループ別支出取得

- **useAssetManagement**: 金融資産管理
  - `upsertAssets`: 金融資産データの効率的な一括更新
  - `getAssetsByGroupId`: グループ別金融資産取得

- **useSimulationManagement**: シミュレーション管理
  - `saveSimulation`: 現在のデータをシミュレーションとして保存
  - `loadSimulation`: 保存済みシミュレーションの読み込み
  - `deleteSimulation`: シミュレーションの削除

### データフロー
1. ユーザーがフォームに入力
2. ドメイン別フック経由でSimulationContextを更新
3. useFinancialSimulationフックでシミュレーション実行
   - 収入は対象資産の残高を増加
   - 支出は対象資産の残高を減少
   - 資産の積立・引き出しも同時に計算
4. 結果をチャートコンポーネントに表示

## 主要コンポーネント

### フォームコンポーネント
- **FinancialAssetsForm**: 金融資産入力フォーム
- **IncomeForm**: グループ別収入入力フォーム
  - グループ選択必須
  - 対象資産選択必須（収入が加算される資産）
- **ExpensesForm**: グループ別支出入力フォーム
  - グループ選択必須
  - 対象資産選択必須（支出が減算される資産）
- **GroupSelector**: グループ選択コンポーネント

### 表示コンポーネント
- **SimulationChart**: シミュレーション結果のチャート表示
- **AppLayout**: アプリケーション全体のレイアウト
- **Sidebar**: ナビゲーションサイドバー

### カスタムフック
- **useFinancialSimulation**: シミュレーション実行ロジック

## 設計パターン

### ドメイン駆動設計（DDD）
- ビジネスロジックをドメイン層に集約
- UIとビジネスロジックの分離
- 各ドメインの責務を明確化

### 戦略パターン
- `CalculatorSource`インターフェースによる計算戦略の抽象化
- 収入・支出・資産の計算を統一的に処理

### ファクトリーパターン
- `createCalculator`: 計算機の生成
- `createSimulator`: シミュレーターの生成

## テスト戦略

### ユニットテスト
- ドメインロジックの単体テスト
- 計算エンジンの精度確認
- シミュレーション結果の妥当性検証

### テストファイル
- `createSimulator.test.ts`: シミュレーター生成のテスト
- `useFinancialSimulation.test.ts`: カスタムフックのテスト
- `asset/source.test.ts`: 金融資産ソース変換のテスト

## パフォーマンス最適化

### 計算最適化
- 月次計算の効率化
- 大量データ処理の最適化
- メモ化による再計算の削減

### UI最適化
- React.memo による不要な再レンダリング防止
- コンテキストの適切な分割
- 遅延ローディング

## 将来の拡張計画

### データ永続化
- LocalStorage/IndexedDBによるクライアントサイド保存
- 将来的なサーバーサイド対応の準備

### 機能拡張
- 複数シナリオ比較
- 税金計算機能
- データエクスポート機能
- より詳細なグラフ表示オプション

## プラグインアーキテクチャ

### 概要
計算ソース（金融資産、負債、収入、支出など）をプラグインとして独立的に扱うアーキテクチャ。
新しいソースタイプを追加する際、コアのSimulatorやChartコンポーネントを修正する必要がない。

### 設計目標
- **拡張性**: 新しいソースタイプの追加が容易（Open/Closed Principle）
- **型安全性**: プラグインタイプとデータ型の静的な対応付け
- **関心の分離**: ソースタイプ固有のロジックがプラグインにカプセル化
- **UI自由度**: 入力フォームは任意のReactコンポーネントとして実装可能
- **自動統合**: サイドバーとルーティングへの自動統合

### SourcePluginインターフェース
```typescript
interface SourcePlugin<TData> {
  // Identity
  type: keyof PluginDataTypeMap;  // "income" | "expense" | "asset" | "liability"
  displayName: string;
  icon?: string;
  description?: string;
  dependencies?: ReadonlyArray<keyof PluginDataTypeMap>;

  // Simulation Logic
  createSources(data: TData): CalculatorSource[];  // 1つのデータから複数ソースを生成可能
  getInitialBalance?(source: CalculatorSource): number;
  applyMonthlyEffect?(context: MonthlyProcessingContext): void;
  postMonthlyProcess?(context: PostMonthlyContext): void;

  // Chart Display
  getChartConfig?(): ChartBarConfig[];
  getDisplayName?(source: CalculatorSource): string;

  // UI Integration
  pageInfo: PluginPageInfo;

  // Data Access
  getGroupId?(data: TData): string;
  isGroupScoped?: boolean;
}
```

### createSources メソッド
`createSources`は単一のドメインデータから複数の`CalculatorSource`を生成できます。
これにより、プラグインは付随する追加ソース（例：負債の返済に伴う支出ソース）を
一緒に定義でき、シミュレーションコアにプラグイン固有の知識を持たせる必要がなくなります。

例：LiabilityPluginは負債データから以下を生成：
- メインの負債ソース（type: "liability"）
- 返済に伴う支出ソース（type: "expense"、返済元資産が指定されている場合）

### チャートデータのキー形式
シミュレーション結果のチャートデータは以下の命名規則に従います：
- 残高: `balance_asset_{id}`, `balance_liability_{id}`
- 収入: `income_{breakdownKey}`
- 支出: `expense_{breakdownKey}`

各プラグインは`getChartConfig()`で自身が生成するキーのプレフィックスを定義し、
`SimulationChart`は`generateChartBars()`を使用してプラグインから動的にバー定義を生成します。
これにより、チャートコンポーネントはプラグイン固有のキープレフィックスを知る必要がありません。

### 型安全なプラグインデータ管理

#### PluginDataTypeMap
プラグインタイプとデータ型の静的なマッピングを定義：

```typescript
interface PluginDataTypeMap {
  income: GroupedIncome;
  expense: GroupedExpense;
  asset: GroupedAsset;
  liability: GroupedLiability;
}
```

新しいプラグインを追加する際は、このマッピングにエントリを追加する。

#### PluginDataStore
全プラグインのデータを格納する型安全な構造：

```typescript
type PluginDataStore = {
  [K in keyof PluginDataTypeMap]: PluginDataTypeMap[K][];
};
```

#### 統一アクション
プラグインデータの更新は単一のジェネリックアクションで処理：

```typescript
type SimulationAction = 
  | { type: "UPSERT_PLUGIN_DATA"; pluginType: keyof PluginDataTypeMap; data: unknown[] }
  // ...
```

これにより、新しいプラグイン追加時にReducerの修正が不要。

### プラグインレジストリ
- グローバルシングルトンとして初期化
- 依存関係のトポロジカルソートをサポート
- 型安全なプラグイン登録・取得

### 登録済みプラグイン
| プラグイン | 型 | 依存関係 | 説明 |
|------------|-----|----------|------|
| AssetPlugin | asset | なし | 金融資産管理 |
| LiabilityPlugin | liability | asset | 負債管理 |
| IncomePlugin | income | asset | 収入管理 |
| ExpensePlugin | expense | asset | 支出管理 |

### 新規プラグイン追加手順
1. `types/simulation.ts` の `PluginDataTypeMap` に新しいタイプを追加
2. `features/xxx/types.ts` - ドメイン型を定義
3. `features/xxx/source.ts` - 変換関数を実装
4. `features/xxx/XxxForm.tsx` - UIコンポーネントを作成
5. `features/xxx/useXxxManagement.tsx` - 管理フックを作成
6. `features/xxx/plugin.tsx` - プラグインを実装
7. `features/xxx/index.ts` - エクスポートを定義
8. `App.tsx` でプラグインをレジストリに登録

### UI統合
- **Sidebar**: プラグインから動的にナビゲーションメニューを生成
- **App.tsx**: プラグインから動的にルーティングを生成、各ページはPluginProviderでラップ
- **PluginDataContext**: 型安全なプラグインデータアクセスを提供（switch文不要）
- **usePluginData**: プラグインページ内でデータにアクセスするフック

### データ永続化
SimulationContextはlocalStorageを使用してデータを永続化。
レガシー形式（incomes, expenses, assets, liabilitiesの個別配列）からの自動マイグレーションをサポート。
