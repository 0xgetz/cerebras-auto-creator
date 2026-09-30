# Contributing

Thanks for your interest! Contributions are welcome.

## Development

```bash
git clone https://github.com/0xgetz/cerebras-auto-creator.git
cd cerebras-auto-creator
npm install
HEADLESS=false node src/create.mjs   # run with a visible browser
```

## Guidelines

- Keep the browser-driven approach: `cloud.cerebras.ai` is behind Cloudflare +
  Auth.js, so HTTP-only rewrites will not work.
- Do not commit secrets, generated accounts, or `outputs/`.
- Keep the code dependency-light (Playwright is the only runtime dep).
- Test on Ubuntu before opening a PR.
- Update all five READMEs if you change user-facing behavior.

## Reporting issues

Include your OS, Node version, and the exact command plus the full error output.
Never paste real credentials or API keys.
