# 技術仕様・要件定義

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 4
- **フォント**: Geist Sans, Geist Mono
- **アイコン**: カスタムSVGアイコン（シンプルなライン系）

## デザイン仕様

- **デザインテイスト**: シンプルなビジネス系
- **言語**: 日本語
- **カラーパレット**: グレー系を基調とした落ち着いた配色
- **レイアウト**: 固定サイドバー（256px）+ メインコンテンツエリア
- **インタラクション**: ホバー効果、スムーズなトランジション
- **レスポンシブ対応**: デスクトップ・モバイル対応
- **ダークモード対応**: システム設定に応じた自動切り替え

## UI構成

### サイドバー項目
- **金融資産**: 預金、投資、不動産などの資産管理
- **収入**: 給与、副業、投資収益などの収入管理  
- **支出**: 生活費、固定費、変動費などの支出管理

## 実装済み機能

- [x] トップページUI（サイドバー付きレイアウト）
- [x] 3つの主要カテゴリナビゲーション
- [x] レスポンシブデザイン
- [x] ダークモード対応
- [x] ホバー効果
- [x] 日本語対応

## 今後の実装予定

- [ ] 各カテゴリの詳細入力フォーム
- [ ] データの永続化（ローカルストレージ/データベース）
- [ ] キャッシュフローのグラフ表示
- [ ] 将来予測シミュレーション
- [ ] データのエクスポート機能
- [ ] データのインポート機能
- [ ] 複数シナリオの比較機能

## プロジェクト構造

```
src/
├── app/
│   ├── globals.css      # グローバルスタイル
│   ├── layout.tsx       # ルートレイアウト
│   └── page.tsx         # トップページ
└── ...
```

## 開発環境要件

- **Node.js**: 18以上
- **パッケージマネージャー**: pnpm
- **ブラウザ**: モダンブラウザ（Chrome, Firefox, Safari, Edge）
