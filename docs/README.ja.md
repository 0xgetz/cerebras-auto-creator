<div align="center">

<img src="../assets/banner.svg" alt="Cerebras Auto Creator" width="100%"/>

# Cerebras Auto Creator

**Cerebras Cloud アカウントの作成と API キー生成をエンドツーエンドで自動化。**

新規の一時メール → マジックリンクログイン → オンボーディング → API キー。ヘッドレスの Ubuntu VPS 向けに Node.js + Playwright で構築。

[![License: MIT](https://img.shields.io/badge/License-MIT-ff5a1f.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-31c48d.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Platform](https://img.shields.io/badge/Platform-Ubuntu-E95420.svg?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [Español](README.es.md) · [中文](README.zh.md) · [日本語](README.ja.md)

</div>

---

## ✨ 機能

- 📬 **新規の一時メール** — `tempmail.cloud` で使い捨てメールボックスを作成（登録不要）。
- 🔗 **マジックリンクログイン** — ログインメールを読み取り、リンクを抽出して自動認証。
- 🧑 **ランダムな身元** — オンボーディング用にランダムな氏名と会社を生成。
- 🔑 **ランダムなキー名** — 一意に生成された名前で API キーを作成。
- 📦 **バッチモード** — 1 回で N アカウントを作成し、CSV にまとめて出力。
- 🖥️ **VPS 対応** — デスクトップ不要で Ubuntu 上でヘッドレス実行。

## ⚠️ 唯一の大きな制約

Cerebras は**すべての** API キーを保存済みの支払い方法の背後に制限しています。
`GENERATE API KEY` ボタンはキー名ダイアログではなく **Stripe のカードフォーム**を開きます。
組織にカードが登録されるまで、GraphQL の `CreateOrganizationApiKey` ミューテーションは呼び出せません。

このスクリプトは**アカウント作成の全ステップを自動化**し、その後に:

| ステータス | 意味 |
|---|---|
| `success` | キーを作成済み（組織にカードがある場合のみ）。 |
| `account_created_key_blocked` | アカウント作成・ログイン済み — キー生成にはカードが必要。 |

実際のキーを取得するには、アカウントごとに一度支払い方法を登録してください。`.env` に
`CARD_NUMBER`、`CARD_EXP`、`CARD_CVC`、`CARD_ZIP` を設定すると、スクリプトが Stripe
フォームを入力します。使用権限のあるカードのみを使用してください。

## 🚀 クイックスタート

```bash
git clone https://github.com/0xgetz/cerebras-auto-creator.git
cd cerebras-auto-creator
npm install

node src/create.mjs              # 1 アカウント
ACCOUNTS=5 node src/batch.mjs    # 5 アカウント + CSV
HEADLESS=false node src/create.mjs   # ブラウザを表示
```

### 要件

- Ubuntu 20.04+ / Debian 12+
- Node.js 18+
- Chromium 用に約 500 MB のディスク

```bash
sudo apt-get update && sudo apt-get install -y nodejs npm
npm install
npx playwright install --with-deps chromium
```

## ⚙️ 設定

| 変数 | 既定値 | 説明 |
|---|---|---|
| `HEADLESS` | `true` | `false` でブラウザを表示。 |
| `OUT_DIR` | `outputs` | 結果の出力先。 |
| `MAIL_TIMEOUT_MS` | `180000` | ログインメールの待機時間。 |
| `CEREBRAS_FULL_NAME` | ランダム | 生成される氏名を上書き。 |
| `CEREBRAS_COMPANY` | ランダム | 生成される会社を上書き。 |
| `CEREBRAS_KEY_NAME` | ランダム | 生成されるキー名を上書き。 |
| `CARD_*` | 未設定 | Stripe フォームを入力（権限のあるカードのみ）。 |

## 📤 出力

`outputs/cerebras-account-<timestamp>.json` — メール、メールボックスのパスワード、
氏名、会社、キー名、API キー、ステータス。バッチモードでは
`outputs/cerebras-accounts.csv` も出力します。

## ⚖️ 法的注意

本プロジェクトは**教育・研究目的**です。アカウント作成の自動化は Cerebras の利用規約に
違反する可能性があります。使用に関する責任はすべて利用者にあります。悪用、スパム、
詐欺には使用しないでください。

## 📄 ライセンス

[MIT](../LICENSE) © 0xgetz
