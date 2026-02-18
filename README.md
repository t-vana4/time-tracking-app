# Time Tracking App

個人の作業時間を記録・可視化・分析するためのWebアプリケーション。

## 概要

タブ切り替え式の4つの画面で、作業時間の計測から分析・データ管理までを一貫して行える。

| 画面 | 機能 |
|------|------|
| タイムトラッカー | 円形プログレスリングによるリアルタイム作業計測 |
| タイムライン | 週単位カレンダーでの作業履歴表示・編集・手動追加 |
| レポート | ドーナツグラフによるプロジェクト別/カテゴリ別の作業時間可視化 |
| データ管理 | CSVエクスポート・期間指定データ削除 |

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + TypeScript（Vite） |
| バックエンド | Python 3.12 + FastAPI |
| データベース | PostgreSQL 16 |
| 実行環境 | Docker（docker-compose） |

## ディレクトリ構成

```
time-tracking-app/
├── docker-compose.yml
├── .env
├── docs/
│   └── PRD.md                  # 製品要求仕様書
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI エントリポイント
│       ├── database.py         # DB接続設定
│       ├── models.py           # SQLAlchemy モデル
│       ├── schemas.py          # Pydantic スキーマ
│       └── routers/
│           ├── entries.py      # 作業記録 CRUD
│           ├── suggestions.py  # サジェスト候補取得
│           ├── reports.py      # 集計レポート
│           └── export.py       # CSVエクスポート
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx             # タブ切り替えルート
        ├── api.ts              # APIクライアント
        ├── types.ts            # 型定義
        └── components/
            ├── TimeTracker.tsx  # タイムトラッカー画面
            ├── Timeline.tsx    # タイムライン画面
            ├── Report.tsx      # レポート画面
            ├── DataManagement.tsx # データ管理画面
            ├── EntryModal.tsx  # 作業記録の編集/追加モーダル
            └── SuggestInput.tsx # サジェスト付き入力コンポーネント
```

## 起動方法

### 前提条件

- Docker および Docker Compose がインストール済みであること

### 起動

```bash
docker-compose up --build
```

ビルド完了後、ブラウザで **http://localhost:9400** にアクセスする。

### 停止

```bash
docker-compose down
```

データベースのデータは Docker Volume（`pgdata`）に永続化されるため、停止・再起動してもデータは保持される。

データも含めて完全にリセットする場合:

```bash
docker-compose down -v
```

## API エンドポイント

バックエンドAPIは `http://localhost:9400/api/` 経由でアクセスできる（Nginxがプロキシ）。

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/entries` | 作業記録一覧取得（期間フィルタ対応） |
| POST | `/api/entries` | 作業記録の新規登録 |
| GET | `/api/entries/{id}` | 作業記録の個別取得 |
| PUT | `/api/entries/{id}` | 作業記録の更新 |
| DELETE | `/api/entries/{id}` | 作業記録の削除 |
| DELETE | `/api/entries` | 期間指定による一括削除 |
| GET | `/api/suggestions/tasks` | タスク名サジェスト候補 |
| GET | `/api/suggestions/projects` | プロジェクト名サジェスト候補 |
| GET | `/api/suggestions/categories` | カテゴリサジェスト候補 |
| GET | `/api/reports/summary` | 集計データ取得 |
| GET | `/api/export/csv` | CSVエクスポート |
| GET | `/api/health` | ヘルスチェック |
