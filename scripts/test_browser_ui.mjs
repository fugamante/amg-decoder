import assert from "node:assert/strict";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEEP_ARTIFACTS = process.env.KEEP_BROWSER_ARTIFACTS === "1";
const REQUIRE_BROWSER = process.env.AMG_BROWSER_REQUIRED === "1";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function browserPath() {
  if (process.env.AMG_BROWSER_PATH && (await exists(process.env.AMG_BROWSER_PATH))) {
    return process.env.AMG_BROWSER_PATH;
  }
  const candidates = [
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function staticServer() {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const decoded = decodeURIComponent(url.pathname);
    const relative =
      decoded === "/" || decoded === "/web/" ? "web/index.html" : decoded.replace(/^\/+/, "");
    const filePath = path.resolve(ROOT, relative);
    if (!filePath.startsWith(ROOT)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    response.setHeader("Content-Type", MIME_TYPES[path.extname(filePath)] ?? "application/octet-stream");
    createReadStream(filePath)
      .on("error", () => {
        response.writeHead(404);
        response.end("Not found");
      })
      .pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        close: () => new Promise((done) => server.close(done)),
        origin: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const executablePath = await browserPath();
    if (executablePath) {
      return chromium.launch({ headless: true, executablePath });
    }
    if (REQUIRE_BROWSER) {
      throw error;
    }
    console.warn("test_browser_ui: skipped; no Playwright browser or supported system Chromium browser found");
    return null;
  }
}

async function closeBrowser(browser) {
  const browserProcess = typeof browser.process === "function" ? browser.process() : null;
  try {
    await Promise.race([
      browser.close(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("browser close timed out")), 5000)),
    ]);
  } catch (error) {
    browserProcess?.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (browserProcess && !browserProcess.killed) {
      browserProcess.kill("SIGKILL");
    }
    if (browserProcess && browserProcess.exitCode === null) {
      await Promise.race([
        once(browserProcess, "exit"),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
      browserProcess.unref?.();
    }
    console.warn(`test_browser_ui: browser teardown forced after ${error.message}`);
  }
}

async function assertNoAxeViolations(page, axeSource) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    });
  });
  const blocking = result.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact),
  );
  assert.deepEqual(
    blocking.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target),
    })),
    [],
    "axe should not report serious or critical accessibility violations",
  );
}

async function checkState(page, label, serial, expectedText, sourceText = "C. F. Martin & Co. Serial/Date Lookup") {
  await page.fill("[data-serial-input]", serial);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(100);
  const bodyText = await page.locator("body").innerText();
  const focusedResult = await page.evaluate(
    () => document.activeElement?.getAttribute("data-result-region") !== null,
  );
  assert.ok(bodyText.includes(expectedText), `${label}: missing ${expectedText}`);
  assert.ok(
    bodyText.includes(sourceText),
    `${label}: missing source link`,
  );
  assert.ok(focusedResult, `${label}: result region should receive focus`);
}

const server = await staticServer();
const artifactDir = await mkdtemp(path.join(tmpdir(), "amg-browser-"));
let browser;

try {
  browser = await launchBrowser();
  if (!browser) {
    process.exit(0);
  }

  const axeSource = await readFile(path.join(ROOT, "node_modules", "axe-core", "axe.min.js"), "utf8");
  const failures = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on("response", (response) => {
    if (response.status() >= 400) {
      failures.push({ url: response.url(), status: response.status() });
    }
  });

  await desktop.goto(`${server.origin}/web/`, { waitUntil: "networkidle" });
  const emptyText = await desktop.locator("body").innerText();
  assert.ok(emptyText.includes("Ready for a Martin serial"), "empty state should render");
  assert.ok(emptyText.includes("Enabled brands use scoped source-backed rules"), "scoped brand note should render");
  assert.equal(await desktop.locator("button.brand-row:disabled").count(), 0);
  assert.equal(await desktop.locator('button[data-brand="taylor"]:not(:disabled)').count(), 1);
  assert.equal(await desktop.locator('button[data-brand="prs"]:not(:disabled)').count(), 1);
  assert.equal(await desktop.locator('button[data-brand="gibson"]:not(:disabled)').count(), 1);
  assert.equal(await desktop.locator('button[data-brand="fender"]:not(:disabled)').count(), 1);
  assert.equal(await desktop.locator('button[data-brand="epiphone"]:not(:disabled)').count(), 1);
  assert.equal(await desktop.locator('button[data-brand="collings"]:not(:disabled)').count(), 1);
  assert.equal(await desktop.locator('button[data-research="suhr"]').count(), 0);
  assert.equal(await desktop.locator('button[data-research="novo"]').count(), 0);

  await desktop.keyboard.press("Tab");
  assert.ok(
    String(await desktop.evaluate(() => document.activeElement.className)).includes("skip-link"),
    "skip link should be the first keyboard stop",
  );
  await desktop.keyboard.press("Enter");
  assert.equal(await desktop.evaluate(() => document.activeElement.id), "main");
  await assertNoAxeViolations(desktop, axeSource);

  await checkState(desktop, "supported", "2935987", "Production year 2024");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-supported.png"), fullPage: true });
  await checkState(desktop, "unsupported", "900001", "Sigma-Martin quarantine");
  await checkState(desktop, "invalid", "2935987A", "Serial is required and must contain digits only.");
  await checkState(
    desktop,
    "above-table",
    "3043481",
    "above the current official Martin guitar/ukulele table",
  );
  await desktop.click('button[data-brand="taylor"]');
  await checkState(desktop, "taylor-supported", "1107064001", "Start date 2014-07-06", "Decoding a Taylor Guitar's Serial #");
  const taylorText = await desktop.locator("body").innerText();
  assert.ok(taylorText.includes("El Cajon, California, USA"), "Taylor factory should render");
  assert.ok(taylorText.includes("Decoding a Taylor Guitar's Serial #"), "Taylor source should render");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-taylor-supported.png"), fullPage: true });
  await desktop.click('button[data-brand="prs"]');
  await checkState(desktop, "prs-supported", "24375043", "Production year 2024", "PRS Guitars Year Identification");
  const prsText = await desktop.locator("body").innerText();
  assert.ok(prsText.includes("Back of the guitar headstock"), "PRS serial location should render");
  assert.ok(prsText.includes("set-neck and S2 models only"), "PRS scope should render");
  await checkState(desktop, "prs-s2-supported", "S2071820", "Production year 2024", "PRS Guitars Year Identification");
  const prsS2Text = await desktop.locator("body").innerText();
  assert.ok(prsS2Text.includes("S2"), "PRS S2 family should render");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-prs-s2-supported.png"), fullPage: true });
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-prs-supported.png"), fullPage: true });
  await checkState(desktop, "prs-quarantine", "2335906", "PRS set-neck quarantined authority row", "PRS Guitars Year Identification");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-prs-quarantine.png"), fullPage: true });
  await desktop.click('button[data-brand="gibson"]');
  await checkState(desktop, "gibson-supported", "91418009", "Production year 1998", "Gibson Serial Numbers");
  const gibsonText = await desktop.locator("body").innerText();
  assert.ok(gibsonText.includes("Official Gibson guitar formats"), "Gibson scope should render");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-gibson-supported.png"), fullPage: true });
  await desktop.click('button[data-brand="fender"]');
  await checkState(desktop, "fender-supported", "US17123456", "Production year 2017", "How can I find out when my American-made instrument was manufactured?");
  const fenderText = await desktop.locator("body").innerText();
  assert.ok(fenderText.includes("Scoped U.S., Mexico, Indonesia, and Japan-context Fender instruments"), "Fender scope should render");
  await checkState(desktop, "fender-mexico-supported", "MX17123456", "Production range 2017-2018", "How can I find out when my Mexican-made instrument was manufactured?");
  await checkState(desktop, "fender-indonesia-supported", "ICF10123456", "Production range 2010-2011", "How can I find out when my Indonesian-made instrument was manufactured?");
  await checkState(desktop, "fender-japan-context", "JD12123456", "Fender Japan JD-prefix context required", "How can I find out when my Japanese-made instrument was manufactured?");
  const fenderJapanText = await desktop.locator("body").innerText();
  assert.ok(fenderJapanText.includes("Confirm Made in Japan decal"), "Fender Japan context guidance should render");
  assert.ok(!fenderJapanText.includes("Production year 2012"), "Fender Japan context guidance must not decode a production year");
  await checkState(desktop, "fender-v-prefix", "V12345", "Production range 1982-present", "How can I find out when my American-made instrument was manufactured?");
  const fenderVintageText = await desktop.locator("body").innerText();
  assert.ok(fenderVintageText.includes("neck heel production date"), "Fender V-prefix required context should render");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-fender-supported.png"), fullPage: true });
  await desktop.click('button[data-brand="epiphone"]');
  await checkState(desktop, "epiphone-supported", "EE04091234", "Production year 2004", "Gibson Serial Numbers: Epiphone section");
  const epiphoneText = await desktop.locator("body").innerText();
  assert.ok(epiphoneText.includes("Factory code"), "Epiphone factory code should render");
  assert.ok(epiphoneText.includes("Gibson-documented Epiphone guitar formats"), "Epiphone scope should render");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-epiphone-supported.png"), fullPage: true });
  await desktop.click('button[data-brand="collings"]');
  await checkState(desktop, "collings-supported", "I35LC232197", "Production year 2023", "Collings FAQ: Serial Number Questions");
  const collingsText = await desktop.locator("body").innerText();
  assert.ok(collingsText.includes("Model hint"), "Collings model prefix hint should render");
  assert.ok(collingsText.includes("Electric prefix, production-start year, sequence"), "Collings scope should render");
  await checkState(desktop, "collings-acoustic-guidance", "12345", "Collings acoustic records-assisted lookup guidance", "Collings FAQ: Serial Number Questions");
  const collingsAcousticText = await desktop.locator("body").innerText();
  assert.ok(collingsAcousticText.includes("Contact Collings"), "Collings acoustic guidance should render");
  await desktop.screenshot({ path: path.join(artifactDir, "desktop-collings-supported.png"), fullPage: true });
  assert.equal(await desktop.locator("[data-analyzer-form]").isVisible(), true, "implemented brand form should remain visible");
  assert.equal(
    await desktop.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    false,
    "desktop should not have page-level horizontal overflow",
  );
  assert.deepEqual(failures, [], "browser run should not produce HTTP failures");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  await mobile.goto(`${server.origin}/web/`, { waitUntil: "networkidle" });
  await mobile.fill("[data-serial-input]", "900001");
  await mobile.click('button[type="submit"]');
  await mobile.waitForTimeout(100);
  const mobileText = await mobile.locator("body").innerText();
  assert.ok(mobileText.includes("Sigma-Martin quarantine"), "mobile unsupported state should render");
  assert.ok(
    mobileText.includes("C. F. Martin & Co. Serial/Date Lookup"),
    "mobile source link should render",
  );
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    false,
    "mobile should not have page-level horizontal overflow",
  );
  await mobile.screenshot({ path: path.join(artifactDir, "mobile-quarantine.png"), fullPage: true });

  if (KEEP_ARTIFACTS) {
    console.log(`test_browser_ui: ok; artifacts kept at ${artifactDir}`);
  } else {
    console.log("test_browser_ui: ok");
  }
} finally {
  if (browser) {
    await closeBrowser(browser);
  }
  await server.close();
  if (!KEEP_ARTIFACTS) {
    await rm(artifactDir, { recursive: true, force: true });
  }
}

process.exit(0);
