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
│   ├── income/           # 収入ドメイン
│   ├── expense/          # 支出ドメイン
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

### シミュレーションドメイン (`domains/simulation/`)
- **Simulator**: 長期財務シミュレーション
- **SimulationParams**: シミュレーションパラメータ
- **SimulationResult**: シミュレーション結果
- **MonthlySimulationData**: 月次シミュレーションデータ

### 収入・支出ドメイン
- **IncomeSource**: 収入データの計算用変換
- **ExpenseSource**: 支出データの計算用変換

## 状態管理

### React Context
- **FinancialAssetsContext**: 金融資産データの管理
- **IncomeContext**: 収入データの管理
- **ExpensesContext**: 支出データの管理
- **SimulationContext**: シミュレーション設定の管理

### データフロー
1. ユーザーがフォームに入力
2. Context経由でデータを更新
3. カスタムフック（useFinancialSimulation）でシミュレーション実行
4. 結果をチャートコンポーネントに表示

## 主要コンポーネント

### フォームコンポーネント
- **FinancialAssetsForm**: 金融資産入力フォーム
- **IncomeForm**: 収入入力フォーム
- **ExpensesForm**: 支出入力フォーム

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