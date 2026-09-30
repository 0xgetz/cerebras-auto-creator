<div align="center">

<img src="assets/banner.svg" alt="Cerebras Auto Creator" width="100%"/>

# Cerebras Auto Creator

**End-to-end automation for creating Cerebras Cloud accounts and generating API keys.**

Fresh temp inbox → magic-link login → onboarding → API key. Built with Node.js + Playwright for headless Ubuntu VPS.

[![License: MIT](https://img.shields.io/badge/License-MIT-ff5a1f.svg?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-31c48d.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Platform](https://img.shields.io/badge/Platform-Ubuntu-E95420.svg?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=for-the-badge)](CONTRIBUTING.md)

[English](README.md) · [Bahasa Indonesia](docs/README.id.md) · [Español](docs/README.es.md) · [中文](docs/README.zh.md) · [日本語](docs/README.ja.md)

</div>

---

## ✨ Features

- 📬 **Fresh temp inbox** — creates a disposable mailbox on `tempmail.cloud`, no signup needed.
- 🔗 **Magic-link login** — reads the sign-in email, extracts the link, and authenticates automatically.
- 🧑 **Random identity** — generates a random full name and company for onboarding.
- 🔑 **Random API key name** — creates a key with a unique generated name.
- 📦 **Batch mode** — create N accounts in one run and export a combined CSV.
- 🖥️ **VPS-ready** — runs headless on a plain Ubuntu box; no desktop required.

## ⚠️ The one hard blocker

Cerebras gates **every** API key behind a saved payment method. The `GENERATE API KEY`
button opens a **Stripe card form**, not the key-name dialog. The GraphQL
`CreateOrganizationApiKey` mutation is unreachable until a card exists on the org.

This script does **all account steps automatically** and then either:

| Status | Meaning |
|---|---|
| `success` | A key was created (only if a card is already on the org). |
| `account_created_key_blocked` | Account created and logged in — Cerebras needs a card before a key can be generated. |

To get real keys, supply a payment method once per account. Set `CARD_NUMBER`,
`CARD_EXP`, `CARD_CVC`, `CARD_ZIP` in `.env` and the script fills the Stripe form
for you. Only use a card you are authorized to use.

## 🚀 Quick start

```bash
git clone https://github.com/0xgetz/cerebras-auto-creator.git
cd cerebras-auto-creator
npm install

node src/create.mjs              # one account
ACCOUNTS=5 node src/batch.mjs    # five accounts + CSV
HEADLESS=false node src/create.mjs   # watch the browser
```

### Requirements

- Ubuntu 20.04+ / Debian 12+
- Node.js 18+
- ~500 MB disk for Chromium

```bash
sudo apt-get update && sudo apt-get install -y nodejs npm
npm install
# if browser deps didn't install:
npx playwright install --with-deps chromium
```

## ⚙️ Configuration

| Variable | Default | Description |
|---|---|---|
| `HEADLESS` | `true` | `false` to watch the browser. |
| `OUT_DIR` | `outputs` | Where JSON/CSV results are written. |
| `MAIL_TIMEOUT_MS` | `180000` | How long to wait for the sign-in email. |
| `CEREBRAS_FULL_NAME` | random | Override the generated name. |
| `CEREBRAS_COMPANY` | random | Override the generated company. |
| `CEREBRAS_KEY_NAME` | random | Override the generated key name. |
| `CARD_NUMBER` / `CARD_EXP` / `CARD_CVC` / `CARD_ZIP` | unset | Fill the Stripe form (authorized cards only). |

Copy `.env.example` to `.env` and adjust.

## 📤 Output

`outputs/cerebras-account-<timestamp>.json`

```json
{
  "email": "prime.e44a3e@inbox.muhub.store",
  "inboxPassword": "T!5y0CAhgn5Ica9",
  "inboxToken": "2E8U8KoA...",
  "fullName": "Olivia Martin",
  "company": "Cedar Digital",
  "keyName": "key-m1x2y3-a9f3k2",
  "apiKey": "csk-...",
  "status": "success",
  "note": null,
  "createdAt": "2026-09-28T02:30:00.000Z"
}
```

Batch mode also writes `outputs/cerebras-accounts.csv`.

## 🧠 How it works

```
┌─────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
│ tempmail    │──▶│ cloud.       │──▶│ magic-link    │──▶│ onboarding   │
│ .cloud      │   │ cerebras.ai  │   │ email + open  │   │ name/company │
└─────────────┘   └──────────────┘   └───────────────┘   └──────┬───────┘
                                                                │
                                                        ┌───────▼────────┐
                                                        │ API key (gated)│
                                                        └────────────────┘
```

- **Cloudflare + Auth.js** protect `cloud.cerebras.ai` — a real browser is required.
  A plain HTTP client (curl/axios) will not work; do not rewrite it that way.
- **Invisible reCAPTCHA Enterprise** sits on the email submit. A residential IP is
  recommended; datacenter IPs may fail the score.
- **Temp-mail domains can be blocked** (`/api/emailban`). Swap provider/domain if rejected.
- **Fresh context per run** keeps accounts independent — never reuse `storageState`.
- **Real input events are required**: the submit button's enabled state depends on
  React receiving genuine input (Playwright's `.fill()` handles this).

## 🗂️ Project layout

```
cerebras-auto-creator/
├── assets/                 # logo + banner
├── docs/                   # translated READMEs
├── src/
│   ├── create.mjs          # main end-to-end flow
│   ├── batch.mjs           # run N accounts + build CSV
│   ├── tempmail.mjs        # tempmail.cloud API client
│   └── identity.mjs        # random name / company / key-name
├── .env.example
├── LICENSE
└── package.json
```

## ⚖️ Legal

This project is for **educational and research purposes**. Automating account
creation may violate Cerebras' Terms of Service. You are solely responsible for
how you use it. Do not use it for abuse, spam, or fraud. Respect rate limits and
applicable laws.

## 📄 License

[MIT](LICENSE) © 0xgetz

<div align="center">
<sub>Built with Node.js & Playwright · Not affiliated with Cerebras Systems.</sub>
</div>
