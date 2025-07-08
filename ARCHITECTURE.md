# アーキテクチャドキュメント

## 技術構成

### 使用技術
- **Next.js 15.3.3**: React フレームワーク
- **React 19**: UI ライブラリ
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Recharts**: グラフ・チャート表示
- **Vitest**: テスティングフレームワーク
- **pnpm**: パッケージマネージャー

### プロジェクト構造
```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # ダッシュボード関連ページ
│   │   ├── financial-assets/  # 金融資産ページ
│   │   ├── income/           # 収入ページ
│   │   ├── expenses/         # 支出ページ
│   │   └── simulator/        # シミュレーターページ
│   └── layout.tsx         # ルートレイアウト
├── components/            # React コンポーネント
├── contexts/             # React Context（状態管理）
├── domains/              # ドメインロジック
│   ├── shared/           # 共通ドメイン
│   ├── group/            # グループドメイン
│   ├── income/           # 収入ドメイン
│   ├── expense/          # 支出ドメイン
│   ├── asset/            # 金融資産ドメイン
│   └── simulation/       # シミュレーションドメイン
├── hooks/                # カスタムフック
└── utils/                # ユーティリティ
```

## ドメインモデル

### 共通ドメイン (`domains/shared/`)
- **Cycle**: 収入・支出の周期設定（月次、年次、カスタム）
- **Calculator**: キャッシュフロー計算エンジン
- **CashFlowChange**: キャッシュフロー変化の抽象化
- **CalculatorSource**: 計算対象の抽象化
- **TimeRange**: 時間範囲の管理

### グループドメイン (`domains/group/`)
- **Group**: 収入・支出・金融資産をまとめるグループ
- **GroupedIncome**: グループに所属する収入
  - `assetSourceId`: 収入が加算される対象資産のID
- **GroupedExpense**: グループに所属する支出
  - `assetSourceId`: 支出が減算される対象資産のID
- **GroupedAsset**: グループに所属する金融資産

### シミュレーションドメイン (`domains/simulation/`)
- **Simulator**: 長期財務シミュレーション
- **SimulationParams**: シミュレーションパラメータ
- **SimulationResult**: シミュレーション結果
- **MonthlySimulationData**: 月次シミュレーションデータ

### 収入・支出・金融資産ドメイン
- **IncomeSource**: 収入データの計算用変換（GroupedIncomeから変換）
  - 収入は指定された資産（assetSourceId）に加算される
- **ExpenseSource**: 支出データの計算用変換（GroupedExpenseから変換）
  - 支出は指定された資産（assetSourceId）から減算される
- **AssetSource**: 金融資産データの計算用変換（GroupedAssetから変換）
  - 積立オプションを支出として計算
  - 引き出しオプションを収入として計算

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
- **FinancialAssetsChart**: シミュレーション結果のチャート表示
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
