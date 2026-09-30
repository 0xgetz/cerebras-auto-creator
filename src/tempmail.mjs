/**
 * tempmail.cloud client.
 *
 * The public API is gated behind a "browser_required" check that inspects
 * Origin/Referer/User-Agent/Sec-Fetch-* headers, so every request sends a
 * realistic same-origin browser header set.
 */

const BASE = "https://tempmail.cloud";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

function browserHeaders(extra = {}) {
  return {
    "User-Agent": UA,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Origin: BASE,
    Referer: BASE + "/",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    ...extra,
  };
}

async function jfetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

/** Create a fresh guest mailbox. Returns { email, password, token }. */
export async function createMailbox() {
  const { status, body } = await jfetch(`${BASE}/api/mailboxes`, {
    method: "POST",
    headers: browserHeaders({ "Content-Type": "application/json" }),
    body: "{}",
  });
  if (status !== 201 || !body?.mailbox?.email) {
    throw new Error(`tempmail createMailbox failed (HTTP ${status}): ${JSON.stringify(body)}`);
  }
  return { email: body.mailbox.email, password: body.password, token: body.token };
}

/** List messages currently in the mailbox. */
export async function listMessages(token) {
  const { status, body } = await jfetch(`${BASE}/api/messages`, {
    headers: browserHeaders({ Authorization: `Bearer ${token}` }),
  });
  if (status !== 200) throw new Error(`tempmail listMessages failed (HTTP ${status})`);
  return body?.messages || [];
}

/** Full message (html/text) by id. */
export async function getMessage(token, id) {
  const { status, body } = await jfetch(`${BASE}/api/messages/${encodeURIComponent(id)}`, {
    headers: browserHeaders({ Authorization: `Bearer ${token}` }),
  });
  if (status !== 200) throw new Error(`tempmail getMessage failed (HTTP ${status})`);
  return body;
}

/**
 * Poll the inbox until a message matching `subjectRe` arrives, then return its
 * full body. Returns null on timeout.
 */
export async function waitForMessage(
  token,
  { subjectRe = /cerebras/i, timeoutMs = 120000, pollMs = 3000 } = {}
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const messages = await listMessages(token);
    const hit = messages.find((m) => subjectRe.test(m.subject || ""));
    if (hit) return getMessage(token, hit.id);
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return null;
}

/**
 * Extract a Cerebras magic-link URL from a message body.
 * The link may be an <a href>, a plain-text anchor, or an escaped amp entity.
 */
export function extractMagicLink(message) {
  const haystack = [
    message?.html || "",
    message?.text || "",
    message?.body || "",
    typeof message === "string" ? message : "",
  ].join("\n");

  // Prefer the magic-link endpoint, then any cloud.cerebras.ai/auth URL.
  const patterns = [
    /https:\/\/cloud\.cerebras\.ai\/auth\/magic-link[^"'\s<>)]+/i,
    /https:\/\/cloud\.cerebras\.ai\/auth\/[^"'\s<>)]+/i,
  ];
  for (const re of patterns) {
    const m = haystack.match(re);
    if (m) return m[0].replace(/&amp;/g, "&");
  }
  return null;
}
