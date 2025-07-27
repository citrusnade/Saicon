# ポイント管理Webアプリ

Next.js (React), Express, SQLiteを使用した、フルスタックのポイント管理Webアプリケーションです。招待コードベースの認証システム、ユーザー間のポイント送受信、管理者によるポイント調整など、基本的な機能を網羅しています。

## 機能

- **認証**: 招待コードを利用したシンプルなユーザー登録・ログイン機能。
- **ロールベースアクセス制御**: `管理者`と`一般ユーザー`の2つの役割。
- **ポイント管理**:
  - 一般ユーザー: 他のユーザーへのポイント送信、残高確認、取引履歴の閲覧。
  - 管理者: 全ユーザーへのポイント発行・調整、全取引履歴の閲覧・フィルタリング。
- **UI**: Tailwind CSSを使用した、クリーンでレスポンシブなダッシュボード。

## 技術スタック

- **フロントエンド**: Next.js (React, TypeScript), Tailwind CSS
- **バックエンド**: Node.js, Express
- **データベース**: SQLite
- **テスト**: Jest & Supertest

## プロジェクト構造

```
.
├── backend/
│   ├── db/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── tests/
│   ├── .env
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── .env.local
│   └── next.config.mjs
├── .env.example
├── package.json
└── README.md
```

## セットアップ手順

### 1. 前提条件

- Node.js (v18以上推奨)
- npm (または yarn, pnpm)

### 2. インストール

プロジェクトのルートディレクトリで、全ての依存関係をインストールします。

```bash
npm run install:all
```

### 3. 環境変数の設定

ルートディレクトリにある `.env.example` をコピーして、バックエンド用に `backend/.env` を、フロントエンド用に `frontend/.env.local` を作成します。

**バックエンド (`backend/.env`):**
```
PORT=3001
DATABASE_PATH=./db/db.sqlite3
JWT_SECRET="your-super-secret-jwt-key-change-me"
ADMIN_INVITE_CODES="admin01,admin02"
USER_INVITE_CODES="user01,user02,user03"
```

**フロントエンド (`frontend/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. データベースのマイグレーション

データベースのテーブルをセットアップします。

```bash
npm run db:migrate
```

### 5. 開発サーバーの起動

フロントエンドとバックエンドのサーバーを同時に起動します。

```bash
npm run dev
```

- フロントエンド: `http://localhost:3000`
- バックエンドAPI: `http://localhost:3001`

### 6. テストの実行

バックエンドのAPIテストを実行します。

```bash
cd backend
npm test
```