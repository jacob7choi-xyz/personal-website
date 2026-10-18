#!/usr/bin/env node
/**
 * Rendered-visibility check. Fails CLOSED.
 *
 * Why this exists: from 2026-05-30 to 2026-10-15 the site rendered an
 * essentially blank page for visitors with prefers-reduced-motion, and for
 * visitors without JavaScript. The server HTML ships every animated block at
 * opacity 0, and the reduced-motion branch never moved it. The code looked
 * correct and the docs said reduced motion was "honored"; only rendering under
 * the emulated preference showed the problem. This makes that a gate instead of
 * a one-off check.
 *
 * What it does: serves the existing production build (`next start`, bound to
 * 127.0.0.1 only), drives headless Chrome over the DevTools protocol, and for
 * each case asserts that the hero and every section (heading and body) are
 * fully visible, the waveform and footer signature are drawn, the name and
 * every section label sit on one line, nothing overflows horizontally, and the
 * console carries no unexpected errors.
 *
 *   npm run build && npm run check:render
 *
 * Chrome is located via CHROME_PATH or the usual install paths. If none is
 * found the check fails; a skipped check would read as a pass.
 */

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.CHECK_RENDER_PORT ?? 3217);
const BASE = `http://127.0.0.1:${PORT}/`;
const OVERALL_TIMEOUT_MS = 300_000;
/* Generous on purpose: a slow CI runner once took ~12s just for
   `chrome --version`, and a 20s startup budget failed the required check on
   main (2026-10-15) without testing anything. */
const CHROME_START_TIMEOUT_MS = 60_000;

/* Cases chosen to cover the failure that shipped: no-motion paths at both
   breakpoints, plus normal motion so the check also proves the animated path
   still ends visible after the reveals fire. 320px is the narrowest width the
   fluid type was measured at: the name and the longest section label
   ("Honors & Credentials") shrink with the viewport there and should stay on
   one line. "print" emulates print media on an unscrolled page, where blocks
   below the fold are still at their opacity-0 starting state. Before the
   2026-10-17 fix, Chrome's print to PDF of such a page left every section
   after the hero blank. */
const CASES = [
  { motion: "reduce", width: 320 },
  { motion: "reduce", width: 390 },
  { motion: "reduce", width: 1440 },
  { motion: "nojs", width: 390 },
  { motion: "nojs", width: 1440 },
  { motion: "no-preference", width: 1440 },
  { motion: "print", width: 1440 },
];

/* Console lines that are expected locally and are not defects. Speed Insights
   loads its script from a path that only exists on Vercel. Matched exactly by
   prefix so an unrelated error cannot hide behind it. */
const EXPECTED_CONSOLE = ["[Vercel Speed Insights] Failed to load script"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const children = [];
const profiles = [];

function cleanup() {
  for (const c of children) {
    try {
      c.kill("SIGTERM");
    } catch {}
  }
  for (const p of profiles) {
    try {
      rmSync(p, { recursive: true, force: true });
    } catch {}
  }
}

function fail(message) {
  console.error(`check-render: FAIL\n  ${message}`);
  cleanup();
  process.exit(1);
}

process.on("SIGINT", () => fail("interrupted"));
process.on("SIGTERM", () => fail("terminated"));
setTimeout(() => fail(`timed out after ${OVERALL_TIMEOUT_MS / 1000}s`), OVERALL_TIMEOUT_MS).unref();

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

async function waitFor(url, label) {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {}
    await sleep(200);
  }
  fail(`${label} did not become ready at ${url}`);
}

async function startServer() {
  if (!existsSync(".next/BUILD_ID")) fail("no production build found; run `npm run build` first");
  const server = spawn("node_modules/.bin/next", ["start", "-H", "127.0.0.1", "-p", String(PORT)], {
    stdio: "ignore",
  });
  children.push(server);
  server.on("exit", (code) => {
    if (code !== null && code !== 0) fail(`next start exited with code ${code} (is port ${PORT} free?)`);
  });
  await waitFor(BASE, "next start");
}

/* One Chrome for the whole run; each case gets its own fresh tab. Chrome picks
   a free debugging port itself (--remote-debugging-port=0) and writes it to
   DevToolsActivePort in the profile, so there is no port to collide on. */
async function startChrome(chromePath) {
  const profile = mkdtempSync(join(tmpdir(), "check-render-"));
  profiles.push(profile);
  const chrome = spawn(
    chromePath,
    ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--hide-scrollbars", "--disable-gpu", "about:blank"],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  children.push(chrome);
  let stderrTail = "";
  chrome.stderr.on("data", (d) => {
    stderrTail = (stderrTail + d.toString()).slice(-2000);
  });
  const portFile = join(profile, "DevToolsActivePort");
  const started = Date.now();
  while (Date.now() - started < CHROME_START_TIMEOUT_MS) {
    if (chrome.exitCode !== null) fail(`Chrome exited during startup (code ${chrome.exitCode}). stderr tail:\n${stderrTail}`);
    if (existsSync(portFile)) {
      const port = Number(readFileSync(portFile, "utf8").split("\n")[0]);
      if (Number.isInteger(port) && port > 0) {
        await waitFor(`http://127.0.0.1:${port}/json/version`, "Chrome DevTools endpoint");
        return port;
      }
    }
    await sleep(250);
  }
  fail(`Chrome did not start within ${CHROME_START_TIMEOUT_MS / 1000}s. stderr tail:\n${stderrTail}`);
}

async function openPage(devtoolsPort) {
  const res = await fetch(`http://127.0.0.1:${devtoolsPort}/json/new?about:blank`, { method: "PUT" });
  if (!res.ok) fail(`could not open a tab: HTTP ${res.status}`);
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("DevTools socket error")));
  });
  let id = 0;
  const pending = new Map();
  const consoleLines = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning", "log"].includes(msg.params.type)) {
      consoleLines.push(msg.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    } else if (msg.method === "Runtime.exceptionThrown") {
      consoleLines.push(`exception: ${msg.params.exceptionDetails.text}`);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const n = ++id;
      pending.set(n, resolve);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) fail(`probe threw: ${r.result.exceptionDetails.text}`);
    return r.result.result.value;
  };
  const close = async () => {
    ws.close();
    await fetch(`http://127.0.0.1:${devtoolsPort}/json/close/${target.id}`).catch(() => {});
  };
  return { send, evaluate, consoleLines, close };
}

/* Runs in the page. Reads computed values, so it measures what a visitor
   actually sees rather than what the markup intends. */
const PROBE = `(() => {
  const opacity = (el) => (el ? Number(getComputedStyle(el).opacity) : -1);
  const hero = [...document.querySelectorAll('header > div')].map(opacity);
  // Each section is [Reveal(heading), Reveal(body)]; both must end visible.
  const sections = [...document.querySelectorAll('section')].map((s) => Math.min(opacity(s.children[0]), opacity(s.children[1])));
  // Rendered lines of text: height over line height, rounded.
  const lines = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
  const wrapped = [document.querySelector('h1'), ...document.querySelectorAll('section h2')]
    .filter((el) => el && lines(el) > 1)
    .map((el) => el.textContent);
  const wave = document.querySelector('svg[viewBox="0 0 1000 70"] path');
  const dash = wave ? getComputedStyle(wave).strokeDasharray : null;
  const sigPieces = [...document.querySelectorAll('path[stroke="url(#sigGrad)"]')];
  const sigFill = document.querySelector('rect[fill="url(#sigFeather)"]');
  return {
    sigPieces: sigPieces.length,
    sigDrawn: sigPieces.length > 0 && sigPieces.every((p) => parseFloat(getComputedStyle(p).strokeDashoffset) === 0),
    sigFilled: !!sigFill && getComputedStyle(sigFill).transform === 'none',
    sigInstant: [...sigPieces, sigFill].every((el) => el && getComputedStyle(el).transitionProperty === 'none'),
    hero,
    sections,
    waveOpacity: opacity(wave),
    waveDrawn: dash === 'none' || dash === '1px, 1px',
    wrapped,
    overflowX: document.documentElement.scrollWidth > innerWidth,
  };
})()`;

async function runCase(devtoolsPort, { motion, width }) {
  const label = `${motion} @ ${width}px`;
  const page = await openPage(devtoolsPort);
  const noJs = motion === "nojs";
  const print = motion === "print";
  await page.send("Runtime.enable");
  await page.send("Page.enable");
  await page.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
  if (noJs) await page.send("Emulation.setScriptExecutionDisabled", { value: true });
  await page.send("Emulation.setEmulatedMedia", {
    media: print ? "print" : "",
    features: [{ name: "prefers-reduced-motion", value: noJs || print ? "no-preference" : motion }],
  });
  await page.send("Page.navigate", { url: `${BASE}?check=${motion}-${width}` });
  await sleep(3500);
  if (motion === "no-preference") {
    /* Viewport-triggered reveals only fire when scrolled into view, as for a
       real visitor. Skipped without JavaScript: page timers never run then. */
    await page.evaluate(`(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      await new Promise((r) => setTimeout(r, 1200));
      return true;
    })()`);
  }
  const r = await page.evaluate(PROBE);
  await page.close();

  const problems = [];
  if (r.hero.length === 0) problems.push("no hero blocks found");
  if (r.hero.some((o) => o < 0.99)) problems.push(`hero not fully visible: ${JSON.stringify(r.hero)}`);
  if (r.sections.length === 0) problems.push("no sections found");
  if (r.sections.some((o) => o < 0.99)) problems.push(`section(s) not fully visible: ${JSON.stringify(r.sections)}`);
  if (r.waveOpacity < 0.99 || !r.waveDrawn) problems.push(`waveform not drawn (opacity ${r.waveOpacity})`);
  /* The footer signature (outline pieces and fill) must be at its end state
     wherever the end state is immediate. Not checked under normal motion: the
     probe runs about 1s after the footer scrolls into view, mid-animation. */
  if (motion !== "no-preference" && (!r.sigDrawn || !r.sigFilled))
    problems.push(`signature not at its end state (${r.sigPieces} pieces, drawn ${r.sigDrawn}, filled ${r.sigFilled})`);
  /* By the time the probe runs, a staggered reveal would also have finished,
     so the end state alone cannot show that reduced motion skipped it. The
     global reduced-motion rule shortens transition durations but not delays;
     the component must turn the transitions off. */
  if (motion === "reduce" && !r.sigInstant) problems.push("signature still transitions under reduced motion");
  if (r.wrapped.length) problems.push(`wraps onto a second line: ${JSON.stringify(r.wrapped)}`);
  if (r.overflowX) problems.push("horizontal overflow");
  const unexpected = page.consoleLines.filter((line) => !EXPECTED_CONSOLE.some((ok) => line.startsWith(ok)));
  if (unexpected.length) problems.push(`unexpected console output: ${JSON.stringify(unexpected.slice(0, 3))}`);

  console.log(`  ${problems.length ? "FAIL" : "ok  "} ${label}: hero ${JSON.stringify(r.hero)}, ${r.sections.length} sections visible=${!r.sections.some((o) => o < 0.99)}`);
  for (const p of problems) console.log(`         ${p}`);
  return problems.length === 0;
}

const chromePath = findChrome();
if (!chromePath) fail("no Chrome or Chromium found; set CHROME_PATH");
/* Logged so a green CI job is evidence of WHAT ran, not only that it passed. */
let chromeVersion = "unknown";
try {
  chromeVersion = execFileSync(chromePath, ["--version"], { encoding: "utf8", timeout: 15_000 }).trim();
} catch {}
console.log(`check-render: ${chromeVersion} at ${chromePath}`);
await startServer();
const devtoolsPort = await startChrome(chromePath);
let allOk = true;
for (const c of CASES) {
  allOk = (await runCase(devtoolsPort, c)) && allOk;
}
cleanup();
if (!allOk) {
  console.error("check-render: FAIL");
  process.exit(1);
}
console.log(`check-render: PASS (${CASES.length} cases)`);
process.exit(0);
