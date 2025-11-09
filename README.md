# Nizi CMS

Vercel 常駐の NEWS 管理システム。Supabase を使用して、LP/HP から直接リアルタイム読み取り可能な共通CMSです。

## 📋 概要

- **CMS側**: Vercel にデプロイし、/admin で NEWS を CRUD 管理
- **書き込み**: Supabase の service_role キーでサーバ側から直接書き込み
- **読み取り**: LP/HP は xserver の静的サイトから anon キーでブラウザ実行時に直接読み取り
- **認証**: /admin は Basic 認証で保護
- **セキュリティ**: RLS により公開記事のみ anon で読み取り可能

## 🚀 セットアップ手順

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editor で以下のファイルを順番に実行:
   - `sql/schema.sql` - テーブル作成
   - `sql/rls.sql` - RLS ポリシー設定

### 2. 環境変数の設定

Supabase ダッシュボードから以下の情報を取得:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY`

`.env.local` ファイルを作成:

```bash
# .env.example をコピーして編集
cp .env.example .env.local
```

`.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Basic Auth for /admin
BASIC_USER=admin
BASIC_PASS=password
```

### 3. ローカル起動

```bash
npm install
npm run dev
```

http://localhost:3000 にアクセス

### 4. Vercel へデプロイ

1. [Vercel](https://vercel.com/) で新規プロジェクト作成
2. GitHub リポジトリと連携
3. 環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BASIC_USER`
   - `BASIC_PASS`
4. デプロイ

## 🔐 管理画面

デプロイ後、`https://<your-domain>/admin` にアクセス

- Basic 認証でログイン（BASIC_USER / BASIC_PASS）
- NEWS の作成・編集・削除が可能

### 機能

- ✅ タイトル・本文（HTML）の入力
- ✅ 対象サイト選択（LP / HP / BOTH）
- ✅ ステータス管理（下書き / 公開）
- ✅ 公開日時の設定
- ✅ HTML サニタイズ（XSS 対策）
- ✅ 一覧表示・編集・削除

## 📖 LP/HP 側での読み取り

LP や HP（xserver の静的サイト）から、ブラウザ実行時に直接 Supabase を読み取ります。

### LP 用サンプルコード

```tsx
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewsListLP() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from("news")
        .select("id,title,body_html,target_site,published_at")
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching news:", error);
        setLoading(false);
        return;
      }

      // LP または BOTH の記事のみフィルタ
      const filtered = (data || []).filter(
        (d) => d.target_site === "LP" || d.target_site === "BOTH"
      );
      setItems(filtered);
      setLoading(false);
    }

    fetchNews();
  }, []);

  if (loading) return <p>読み込み中...</p>;

  return (
    <ul>
      {items.map((n) => (
        <li key={n.id}>
          <h3>{n.title}</h3>
          <time>{new Date(n.published_at).toLocaleDateString("ja-JP")}</time>
          <div dangerouslySetInnerHTML={{ __html: n.body_html }} />
        </li>
      ))}
    </ul>
  );
}
```

### HP 用サンプルコード

LP のコードで、フィルタ部分を以下のように変更:

```tsx
// HP または BOTH の記事のみフィルタ
const filtered = (data || []).filter(
  (d) => d.target_site === "HP" || d.target_site === "BOTH"
);
```

### 静的HTML から直接読み取る場合

CDN から Supabase JS を読み込んで使用:

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>NEWS</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  </head>
  <body>
    <div id="news-list"></div>

    <script>
      const { createClient } = supabase;
      const supabaseClient = createClient("YOUR_SUPABASE_URL", "YOUR_ANON_KEY");

      async function loadNews() {
        const { data, error } = await supabaseClient
          .from("news")
          .select("id,title,body_html,target_site,published_at")
          .eq("status", "published")
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false });

        if (error) {
          console.error("Error:", error);
          return;
        }

        // LP の記事のみフィルタ
        const filtered = data.filter(
          (d) => d.target_site === "LP" || d.target_site === "BOTH"
        );

        const html = filtered
          .map(
            (n) => `
        <article>
          <h3>${n.title}</h3>
          <time>${new Date(n.published_at).toLocaleDateString("ja-JP")}</time>
          <div>${n.body_html}</div>
        </article>
      `
          )
          .join("");

        document.getElementById("news-list").innerHTML = html;
      }

      loadNews();
    </script>
  </body>
</html>
```

## 🔒 セキュリティ

### RLS（Row Level Security）

- ✅ `anon` ロールは `status='published'` かつ `published_at <= now()` の記事のみ読み取り可能
- ✅ 書き込みは `service_role` のみ（サーバ側の Server Action 経由）
- ✅ Basic 認証で /admin を保護

### HTML サニタイズ

- ✅ `isomorphic-dompurify` でサーバ側でサニタイズして保存
- ✅ 許可タグ: p, br, strong, em, u, h1-h6, ul, ol, li, a, img, blockquote, code, pre, span, div
- ✅ 許可属性: href, src, alt, title, class, id, target, rel

### 環境変数の扱い

- ⚠️ `NEXT_PUBLIC_*` はクライアント側で公開されます
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` は**絶対に公開しない**（サーバ側のみ）
- ⚠️ Vercel の環境変数設定で管理

## 🗂️ ディレクトリ構成

```
/
├── app/
│   ├── _lib/
│   │   ├── actions.ts         # Server Actions (CRUD)
│   │   ├── supaAdmin.ts       # Supabase Admin Client
│   │   ├── supaClient.ts      # Supabase Client (anon)
│   │   └── types.ts           # TypeScript 型定義
│   ├── admin/
│   │   └── page.tsx           # 管理画面
│   ├── layout.tsx             # ルートレイアウト
│   ├── page.tsx               # トップページ
│   └── globals.css            # グローバルスタイル
├── sql/
│   ├── schema.sql             # テーブル定義
│   └── rls.sql                # RLS ポリシー
├── middleware.ts              # Basic 認証
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.example               # 環境変数テンプレート
```

## 📊 データベーススキーマ

### `public.news` テーブル

| カラム       | 型          | 説明                            |
| ------------ | ----------- | ------------------------------- |
| id           | bigint      | 主キー（自動採番）              |
| title        | text        | タイトル                        |
| body_html    | text        | 本文（HTML）                    |
| target_site  | text        | 対象サイト（LP / HP / BOTH）    |
| status       | text        | ステータス（draft / published） |
| published_at | timestamptz | 公開日時                        |
| created_at   | timestamptz | 作成日時                        |
| updated_at   | timestamptz | 更新日時（自動更新）            |

## 🔧 将来の拡張案

- 📡 **Realtime チャンネル**: Supabase Realtime で記事更新時に自動再読込
- 🖼️ **画像アップロード**: Supabase Storage または外部 CDN 連携
- 📰 **RSS/Atom フィード**: 公開記事を RSS で配信
- 🗺️ **Sitemap 生成**: SEO 対策で sitemap.xml 自動生成
- 👥 **マルチユーザー**: Supabase Auth で管理者ごとの権限管理
- 🔍 **全文検索**: PostgreSQL の全文検索機能を活用
- 📝 **リッチエディタ**: TinyMCE や Tiptap で WYSIWYG 編集

## ✅ 受け入れ条件

- [x] `/sql/schema.sql` / `/sql/rls.sql` が Supabase SQL Editor で実行可能
- [x] `.env.example` に必要な環境変数が揃っている
- [x] `/admin` で「作成→一覧に反映→編集→削除」が動作
- [x] 公開記事（`status='published'` かつ `published_at<=now()`）が LP/HP から取得可能
- [x] Vercel デプロイ後、Basic 認証で `/admin` にアクセス可能

## 📝 ライセンス

MIT

## 🙋 サポート

問題が発生した場合は、以下を確認してください:

1. Supabase のテーブルが正しく作成されているか
2. RLS が有効になっているか
3. 環境変数が正しく設定されているか
4. Vercel のログにエラーが出ていないか

---

**開発**: Nizi CMS Team  
**最終更新**: 2025-11-09
