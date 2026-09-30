#!/usr/bin/env node
/**
 * Cerebras Cloud auto account creator (Playwright).
 *
 * Flow:
 *   1. Create a fresh tempmail.cloud inbox.
 *   2. Open cloud.cerebras.ai, submit the email, trigger the magic link.
 *   3. Poll the inbox for the "Sign in to Cerebras" mail and open the link.
 *   4. Complete onboarding with a random full name + company.
 *   5. Go to API keys and create a key with a random name.
 *   6. Write { email, password, fullName, company, apiKey } to outputs/.
 *
 * IMPORTANT: Cerebras gates API-key creation behind a payment method. If no card
 * is supplied the script stops cleanly and reports the account as created but
 * key-blocked. See README.md for how to supply a card via Stripe test mode.
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { createMailbox, waitForMessage, extractMagicLink } from "./tempmail.mjs";
import { randomFullName, randomCompany, randomKeyName } from "./identity.mjs";

const CEREBRAS_URL = "https://cloud.cerebras.ai/?utm_source=homepage";
const OUT_DIR = process.env.OUT_DIR || "outputs";
const HEADLESS = process.env.HEADLESS !== "false";
const NAV_TIMEOUT = 60000;

function log(...a) {
  console.log(new Date().toISOString().slice(11, 19), ...a);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function firstVisible(page, selectors) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) return loc;
  }
  return null;
}

/** Click Accept All / dismiss the cookie banner if present. */
async function dismissCookies(page) {
  const btn = await firstVisible(page, [
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
  ]);
  if (btn) {
    await btn.click().catch(() => {});
    await sleep(500);
  }
}

/** Sign up / log in by email, which triggers a magic link. */
async function requestMagicLink(page, email) {
  log("Opening Cerebras…");
  await page.goto(CEREBRAS_URL, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  await sleep(2500);
  await dismissCookies(page);

  const emailInput = await firstVisible(page, [
    'input#email',
    'input[type="email"]',
    'input[placeholder*="example.com" i]',
  ]);
  if (!emailInput) throw new Error("Email input not found on landing page.");
  await emailInput.fill(email);

  const cta = await firstVisible(page, [
    'button:has-text("CONTINUE WITH EMAIL")',
    'button:has-text("Continue with email")',
    'button[type="submit"]',
  ]);
  if (!cta) throw new Error("Continue-with-email button not found.");
  await cta.click();

  // Either a "Check your email" state or immediate redirect.
  await page
    .locator('text=/check your email/i')
    .first()
    .waitFor({ timeout: 30000 })
    .catch(() => {});
  log("Magic link requested for", email);
}

/** Open the magic link exactly like a mail client would. */
async function consumeMagicLink(page, link) {
  log("Opening magic link…");
  await page.goto(link, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  await page
    .locator('text=/enter details/i, input#fullName')
    .first()
    .waitFor({ timeout: 45000 })
    .catch(() => {});
  await sleep(1000);
}

/** Fill onboarding (full name + company) and continue to the console. */
async function completeOnboarding(page, fullName, company) {
  const nameInput = await firstVisible(page, [
    'input#fullName',
    'input[name="fullName"]',
    'input[placeholder="John Smith"]',
  ]);
  if (!nameInput) {
    log("Onboarding form not present — already onboarded?");
    return;
  }
  log("Completing onboarding as", fullName);
  await nameInput.fill(fullName);

  const companyInput = await firstVisible(page, [
    'input#company',
    'input[name="company"]',
  ]);
  if (companyInput) await companyInput.fill(company);

  const cont = await firstVisible(page, [
    'button:has-text("Continue")',
    'button[type="submit"]',
  ]);
  if (cont) await cont.click();
  await sleep(4000);

  // Optional credits screen: skip it.
  await dismissCookies(page);
  const skip = await firstVisible(page, [
    'button:has-text("SKIP TO CONSOLE")',
    'button:has-text("Skip to Console")',
    'a:has-text("SKIP TO CONSOLE")',
  ]);
  if (skip) {
    await skip.click();
    await sleep(4000);
  }
  log("In console:", page.url());
}

/** Open the API keys page, directly if possible. */
async function gotoApiKeys(page) {
  if (!/\/platform\//.test(page.url())) {
    // Derive the org id from anywhere on the page.
    log("Waiting for platform URL…");
    await page
      .locator('text=/Get started|API keys/i')
      .first()
      .waitFor({ timeout: 30000 })
      .catch(() => {});
  }
  const links = await page
    .locator('a:has-text("API keys"), a[href*="/apikeys"]')
    .all();
  for (const l of links) {
    if (await l.isVisible().catch(() => false)) {
      await l.click();
      await sleep(3000);
      break;
    }
  }
  // Or the "VIEW ALL API KEYS" button on the get-started page.
  if (!/\/apikeys/.test(page.url())) {
    const viewAll = await firstVisible(page, [
      'text=/VIEW ALL API KEYS/i',
      'text=/View all API keys/i',
    ]);
    if (viewAll) {
      await viewAll.click();
      await sleep(3000);
    }
  }
  log("API keys page:", page.url());
}

/**
 * Attempt to create an API key with a random name.
 * Returns { ok, name, secretKey, reason }.
 */
async function createApiKey(page, name) {
  const gen = await firstVisible(page, [
    'button:has-text("GENERATE API KEY")',
    'button:has-text("Generate API key")',
    'button:has-text("Create API key")',
  ]);
  if (!gen) return { ok: false, reason: "generate_button_missing" };
  await gen.click();
  await sleep(2500);

  // Payment gate check: the card form replaces the key-name dialog.
  const cardField = page
    .locator('input[placeholder*="1234"], input[name="cardnumber"], iframe[title*="card" i]')
    .first();
  const hasCardForm = (await cardField.count()) > 0;
  if (hasCardForm) {
    const card = {
      number: process.env.CARD_NUMBER,
      exp: process.env.CARD_EXP,
      cvc: process.env.CARD_CVC,
      zip: process.env.CARD_ZIP,
    };
    if (!card.number) return { ok: false, reason: "payment_method_required" };

    // Stripe renders card fields inside cross-origin iframes; Playwright can
    // reach them by frame.
    log("Filling Stripe card form…");
    const frames = page.frames();
    const findByPlaceholder = async (re) => {
      for (const f of frames) {
        const loc = f.locator(`input[placeholder*="${re}"], input[name*="${re}"]`).first();
        if (await loc.count().catch(() => 0)) return loc;
      }
      return null;
    };
    const numberLoc =
      (await findByPlaceholder("1234")) ||
      (await findByPlaceholder("card number")) ||
      cardField;
    if (numberLoc) await numberLoc.fill(card.number);
    const expLoc = await findByPlaceholder("MM / YY");
    if (expLoc) await expLoc.fill(card.exp);
    const cvcLoc = await findByPlaceholder("CVC");
    if (cvcLoc) await cvcLoc.fill(card.cvc);
    const zipLoc = await firstVisible(page, ['input[placeholder="12345"]', 'input[name="postalCode"]']);
    if (zipLoc) await zipLoc.fill(card.zip);

    const save = await firstVisible(page, [
      'button:has-text("SAVE PAYMENT METHOD")',
      'button:has-text("Save payment method")',
    ]);
    if (save) await save.click();
    await sleep(6000);

    // After saving, the key-name dialog should appear; fall through to it.
    if (await page.locator('text=/csk-[a-z0-9]{20,}/i').count()) {
      const secret = await page.locator('text=/csk-[a-z0-9]{20,}/i').first().textContent();
      const m = secret && secret.match(/csk-[a-z0-9]+/i);
      if (m) return { ok: true, name, secretKey: m[0] };
    }
  }

  // Otherwise a "Key name" dialog should be present.
  const nameInput = await firstVisible(page, [
    'input[placeholder*="name" i]',
    'input#keyName',
    'input[name="name"]',
  ]);
  if (!nameInput) return { ok: false, reason: "key_name_input_missing" };
  await nameInput.fill(name);

  const submit = await firstVisible(page, [
    'button:has-text("Create")',
    'button:has-text("Generate")',
    'button[type="submit"]',
  ]);
  if (submit) await submit.click();
  await sleep(3500);

  // The plaintext secret appears once, e.g. "csk-...".
  const secret = await page
    .locator('text=/csk-[a-z0-9]{20,}/i')
    .first()
    .textContent()
    .catch(() => null);
  const match = secret && secret.match(/csk-[a-z0-9]+/i);
  if (match) return { ok: true, name, secretKey: match[0] };

  return { ok: false, reason: "secret_not_captured" };
}

async function main() {
  const fullName = process.env.CEREBRAS_FULL_NAME || randomFullName();
  const company = process.env.CEREBRAS_COMPANY || randomCompany();
  const keyName = process.env.CEREBRAS_KEY_NAME || randomKeyName();

  log("Creating temp inbox…");
  const inbox = await createMailbox();
  log("Inbox:", inbox.email);

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  const page = await context.newPage();

  const result = {
    email: inbox.email,
    inboxPassword: inbox.password,
    inboxToken: inbox.token,
    fullName,
    company,
    keyName,
    apiKey: null,
    status: "started",
    note: null,
    createdAt: new Date().toISOString(),
  };

  try {
    await requestMagicLink(page, inbox.email);

    log("Waiting for the sign-in email…");
    const msg = await waitForMessage(inbox.token, {
      subjectRe: /cerebras/i,
      timeoutMs: Number(process.env.MAIL_TIMEOUT_MS || 180000),
    });
    if (!msg) throw new Error("No Cerebras email arrived within the timeout.");
    const link = extractMagicLink(msg);
    if (!link) throw new Error("Could not extract a magic link from the email.");
    log("Magic link found.");

    await consumeMagicLink(page, link);
    await dismissCookies(page);
    await completeOnboarding(page, fullName, company);

    await gotoApiKeys(page);
    const key = await createApiKey(page, keyName);

    if (key.ok) {
      result.apiKey = key.secretKey;
      result.status = "success";
      log("API key created:", key.secretKey);
    } else if (key.reason === "payment_method_required") {
      result.status = "account_created_key_blocked";
      result.note =
        "Account created and authenticated, but Cerebras requires a payment method before any API key can be generated.";
      log(result.note);
    } else {
      result.status = "account_created_key_failed";
      result.note = `Key creation failed: ${key.reason}`;
      log(result.note);
    }
  } catch (err) {
    result.status = "error";
    result.note = String(err && err.message ? err.message : err);
    log("ERROR:", result.note);
    await page.screenshot({ path: path.join(OUT_DIR, "cerebras-error.png") }).catch(() => {});
  } finally {
    await context.storageState({ path: path.join(OUT_DIR, "cerebras-session.json") }).catch(() => {});
    await browser.close();
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `cerebras-account-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  log("Wrote", file);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "success" || result.status === "account_created_key_blocked" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
