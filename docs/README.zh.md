<div align="center">

<img src="../assets/banner.svg" alt="Cerebras Auto Creator" width="100%"/>

# Cerebras Auto Creator

**端到端自动化创建 Cerebras Cloud 账户并生成 API 密钥。**

全新临时邮箱 → 魔法链接登录 → 引导流程 → API 密钥。基于 Node.js + Playwright，适用于无桌面的 Ubuntu VPS。

[![License: MIT](https://img.shields.io/badge/License-MIT-ff5a1f.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-31c48d.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Platform](https://img.shields.io/badge/Platform-Ubuntu-E95420.svg?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [Español](README.es.md) · [中文](README.zh.md) · [日本語](README.ja.md)

</div>

---

## ✨ 功能

- 📬 **全新临时邮箱** — 在 `tempmail.cloud` 创建一次性邮箱，无需注册。
- 🔗 **魔法链接登录** — 读取登录邮件、提取链接并自动完成认证。
- 🧑 **随机身份** — 为引导流程生成随机姓名和公司。
- 🔑 **随机密钥名称** — 使用生成的唯一名称创建密钥。
- 📦 **批量模式** — 一次运行创建 N 个账户并导出合并 CSV。
- 🖥️ **适配 VPS** — 可在普通 Ubuntu 上无界面运行。

## ⚠️ 唯一的硬性限制

Cerebras 将**所有** API 密钥都限制在已保存的支付方式之后。`GENERATE API KEY`
按钮打开的是 **Stripe 银行卡表单**，而不是密钥命名对话框。在组织没有绑定银行卡前，
GraphQL 的 `CreateOrganizationApiKey` 变更无法调用。

本脚本会**自动完成所有账户步骤**，然后：

| 状态 | 含义 |
|---|---|
| `success` | 已创建密钥（仅当组织已绑定银行卡）。 |
| `account_created_key_blocked` | 账户已创建并登录 — Cerebras 需要银行卡才能生成密钥。 |

要获得真实密钥，请为每个账户添加一次支付方式。在 `.env` 中设置
`CARD_NUMBER`、`CARD_EXP`、`CARD_CVC`、`CARD_ZIP`，脚本会自动填写 Stripe 表单。
请仅使用你有权使用的银行卡。

## 🚀 快速开始

```bash
git clone https://github.com/0xgetz/cerebras-auto-creator.git
cd cerebras-auto-creator
npm install

node src/create.mjs              # 单个账户
ACCOUNTS=5 node src/batch.mjs    # 五个账户 + CSV
HEADLESS=false node src/create.mjs   # 查看浏览器
```

### 环境要求

- Ubuntu 20.04+ / Debian 12+
- Node.js 18+
- 约 500 MB 磁盘空间（Chromium）

```bash
sudo apt-get update && sudo apt-get install -y nodejs npm
npm install
npx playwright install --with-deps chromium
```

## ⚙️ 配置

| 变量 | 默认值 | 说明 |
|---|---|---|
| `HEADLESS` | `true` | 设为 `false` 可查看浏览器。 |
| `OUT_DIR` | `outputs` | 结果输出目录。 |
| `MAIL_TIMEOUT_MS` | `180000` | 等待登录邮件的时长。 |
| `CEREBRAS_FULL_NAME` | 随机 | 覆盖生成的姓名。 |
| `CEREBRAS_COMPANY` | 随机 | 覆盖生成的公司。 |
| `CEREBRAS_KEY_NAME` | 随机 | 覆盖生成的密钥名称。 |
| `CARD_*` | 空 | 填写 Stripe 表单（仅限授权银行卡）。 |

## 📤 输出

`outputs/cerebras-account-<timestamp>.json` — 包含邮箱、邮箱密码、姓名、公司、
密钥名称、API 密钥和状态。批量模式还会写入 `outputs/cerebras-accounts.csv`。

## ⚖️ 法律声明

本项目仅供**教育与研究**用途。自动化创建账户可能违反 Cerebras 的服务条款。
使用后果由你自行承担。请勿用于滥用、垃圾信息或欺诈。

## 📄 许可证

[MIT](../LICENSE) © 0xgetz
