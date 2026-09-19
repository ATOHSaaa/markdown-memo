# メモ

自分専用の Markdown メモアプリです。左に一覧と検索、右に WYSIWYG 寄りの編集画面があります。本文は Cloudflare D1、画像は R2 に保存し、Workers にデプロイします。

## できること

- パスワードでアプリ全体を閉じる
- メモの作成・自動保存・削除
- 更新が新しい順の一覧と、タイトル / 本文の検索
- 見出し・リスト・リンク・画像（ペースト / ドロップ / ボタン）
- スマホではメニューからサイドバーを開く

## 必要なもの

- Node.js 22 以降
- Cloudflare アカウント
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)（プロジェクトの devDependency で入ります）

## ローカルで動かす

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate
npm run dev
```

ブラウザで `http://localhost:5173` を開き、パスワード `password` でログインします（`.dev.vars` の `AUTH_PASSWORD`）。

`.dev.vars` はコミットしません。`AUTH_SECRET` は十分長いランダム文字列に変えてください。

## GitHub に載せる

```bash
git init -b main
git add -A
git commit -m "Initial commit"
gh repo create markdown-memo --public --source=. --remote=origin --push
```

## Cloudflare へデプロイ

### 初回（手元のマシン）

1. ログイン

```bash
npx wrangler login
```

2. D1 と R2 を作る

```bash
npx wrangler d1 create markdown-notes
npx wrangler r2 bucket create markdown-images
```

3. `wrangler.jsonc` の `d1_databases[0].database_id` を、作成時に表示された ID に書き換える

4. 本番のマイグレーションとシークレット

```bash
npm run db:migrate:remote
npx wrangler secret put AUTH_PASSWORD
npx wrangler secret put AUTH_SECRET
```

`AUTH_SECRET` には、セッション署名用の長いランダム文字列を入れてください。

5. デプロイ

```bash
npm run deploy
```

### GitHub Actions で自動デプロイ

`main` への push で `.github/workflows/deploy.yml` が動きます。GitHub リポジトリに次の Secrets を登録してください。

| Secret | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Workers / D1 / R2 に書き込みできる API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

`AUTH_PASSWORD` と `AUTH_SECRET` は Worker のシークレットとして Cloudflare 側に一度だけ設定すれば、以後のデプロイでも保持されます。

型定義を bindings 変更後に更新する場合:

```bash
npm run cf-typegen
```

## 構成

- UI: React + Vite + Tailwind CSS + TipTap
- API: Hono on Cloudflare Workers
- データ: D1（メモ） / R2（画像）
- 認証: 単一パスワード + httpOnly セッション Cookie
