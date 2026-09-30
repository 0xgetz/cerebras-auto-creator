<div align="center">

<img src="../assets/banner.svg" alt="Cerebras Auto Creator" width="100%"/>

# Cerebras Auto Creator

**Automatización de extremo a extremo para crear cuentas de Cerebras Cloud y generar claves API.**

Bandeja temporal nueva → inicio de sesión con enlace mágico → onboarding → clave API. Hecho con Node.js + Playwright para VPS Ubuntu sin interfaz gráfica.

[![License: MIT](https://img.shields.io/badge/License-MIT-ff5a1f.svg?style=for-the-badge)](../LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-31c48d.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![Platform](https://img.shields.io/badge/Platform-Ubuntu-E95420.svg?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com)

[English](../README.md) · [Bahasa Indonesia](README.id.md) · [Español](README.es.md) · [中文](README.zh.md) · [日本語](README.ja.md)

</div>

---

## ✨ Características

- 📬 **Bandeja temporal nueva** — crea un buzón desechable en `tempmail.cloud`, sin registro.
- 🔗 **Inicio con enlace mágico** — lee el correo, extrae el enlace y autentica automáticamente.
- 🧑 **Identidad aleatoria** — genera un nombre completo y una empresa aleatorios.
- 🔑 **Nombre de clave aleatorio** — crea una clave con un nombre único generado.
- 📦 **Modo por lotes** — crea N cuentas en una ejecución y exporta un CSV combinado.
- 🖥️ **Listo para VPS** — funciona sin interfaz en un Ubuntu básico.

## ⚠️ El único bloqueo importante

Cerebras protege **todas** las claves API con un método de pago guardado. El botón
`GENERATE API KEY` abre un **formulario de tarjeta de Stripe**, no el diálogo del nombre.
La mutación GraphQL `CreateOrganizationApiKey` no es accesible hasta que haya una tarjeta.

Este script hace **todos los pasos de la cuenta automáticamente** y luego:

| Estado | Significado |
|---|---|
| `success` | Se creó una clave (solo si ya hay una tarjeta en la organización). |
| `account_created_key_blocked` | Cuenta creada e iniciada — Cerebras necesita una tarjeta antes de generar una clave. |

Para obtener claves reales, añade un método de pago una vez por cuenta. Define
`CARD_NUMBER`, `CARD_EXP`, `CARD_CVC`, `CARD_ZIP` en `.env` y el script rellenará el
formulario de Stripe. Usa solo una tarjeta que estés autorizado a usar.

## 🚀 Inicio rápido

```bash
git clone https://github.com/0xgetz/cerebras-auto-creator.git
cd cerebras-auto-creator
npm install

node src/create.mjs              # una cuenta
ACCOUNTS=5 node src/batch.mjs    # cinco cuentas + CSV
HEADLESS=false node src/create.mjs   # ver el navegador
```

### Requisitos

- Ubuntu 20.04+ / Debian 12+
- Node.js 18+
- ~500 MB de disco para Chromium

```bash
sudo apt-get update && sudo apt-get install -y nodejs npm
npm install
npx playwright install --with-deps chromium
```

## ⚙️ Configuración

| Variable | Por defecto | Descripción |
|---|---|---|
| `HEADLESS` | `true` | `false` para ver el navegador. |
| `OUT_DIR` | `outputs` | Dónde se escriben los resultados. |
| `MAIL_TIMEOUT_MS` | `180000` | Tiempo de espera del correo. |
| `CEREBRAS_FULL_NAME` | aleatorio | Sobrescribe el nombre. |
| `CEREBRAS_COMPANY` | aleatorio | Sobrescribe la empresa. |
| `CEREBRAS_KEY_NAME` | aleatorio | Sobrescribe el nombre de la clave. |
| `CARD_*` | vacío | Rellena el formulario de Stripe (solo tarjetas autorizadas). |

## 📤 Salida

`outputs/cerebras-account-<timestamp>.json` — email, contraseña del buzón, nombre,
empresa, nombre de la clave, clave API y estado. El modo por lotes también escribe
`outputs/cerebras-accounts.csv`.

## ⚖️ Legal

Este proyecto es para **fines educativos y de investigación**. Automatizar la
creación de cuentas puede violar los Términos de Servicio de Cerebras. Eres el
único responsable de su uso. No lo uses para abuso, spam o fraude.

## 📄 Licencia

[MIT](../LICENSE) © 0xgetz
