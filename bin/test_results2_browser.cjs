const { chromium } = require(process.env.RESULTS2_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.RESULTS2_URL || "http://127.0.0.1:18082/results2/";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(
    () => document.querySelectorAll("#matrix tbody .task-name").length === 10,
  );
  assert.equal(await page.locator("#models .model-card").count(), 1);
  assert.equal(await page.locator("h1").innerText(), "Evaluation\nResults");
  await page.selectOption("#category", "Programming Languages");
  assert.equal(
    await page.locator("#matrix .task-name").innerText(),
    "Reusable Library Candidates",
  );
  assert.equal(
    await page.locator("#matrix .task-label").innerText(),
    "Programming Languages",
  );
  await page.selectOption("#category", "");

  const snapshot = await (
    await page.request.get(new URL("/assets/data/results2.json", base).href)
  ).json();
  assert.equal(
    await page.locator("#matrix .badge.pass").count(),
    snapshot.results.filter((r) => r.verdict === "PASS").length,
  );
  assert.equal(
    await page.locator("#matrix .badge.fail").count(),
    snapshot.results.filter((r) => r.verdict === "FAIL").length,
  );
  assert.equal(await page.locator("#matrix .badge.running").count(), 0);
  await page.selectOption("#status", "FAIL");
  assert.equal(
    await page.locator("#matrix .task-name").count(),
    snapshot.results.filter((r) => r.verdict === "FAIL").length,
  );
  await page.selectOption("#status", "");
  await page.fill("#search", "no such task");
  await page.getByText("No tasks match these filters.").waitFor();
  await page.fill("#search", "Sparse");
  assert.equal(await page.locator("#matrix .score").innerText(), "0");
  await page.fill("#search", "");
  await page.selectOption("#detail-task", "join_tree_rewriting");
  assert.ok((await page.locator("#chart circle").count()) > 0);
  await page.locator("#chart circle").first().focus();
  assert.equal(await page.locator("#chart .chart-tooltip").isVisible(), true);
  await page.keyboard.press("Tab");
  await page.selectOption("#axis", "total_tokens");
  assert.ok((await page.locator("#chart circle").count()) > 0);
  await page.selectOption("#phase", "final");
  assert.equal(await page.locator("#chart circle").count(), 1);
  const downloadPromise = page.waitForEvent("download");
  await page.click("#download");
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "frontier-cs-preview-results.csv");
  if (process.env.RESULTS2_SCREENSHOTS) {
    await page.selectOption("#phase", "train");
    await page.screenshot({
      path: `${process.env.RESULTS2_SCREENSHOTS}/desktop.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  if (process.env.RESULTS2_SCREENSHOTS)
    await page.screenshot({
      path: `${process.env.RESULTS2_SCREENSHOTS}/mobile.png`,
      fullPage: true,
    });
  // Test a second model without publishing synthetic results.
  const data = await (
    await page.request.get(new URL("/assets/data/results2.json", base).href)
  ).json();
  const extra = structuredClone(data);
  extra.tasks
    .find((t) => t.id === "join_tree_rewriting")
    .labels.push("Query Optimization");
  extra.models.push({ id: "browser-test", label: "Browser test only" });
  extra.results.push({
    ...extra.results.find((r) => r.task_id === "join_tree_rewriting"),
    model_id: "browser-test",
    score: 20,
    verdict: "FAIL",
  });
  await page.route("**/assets/data/results2.json", (route) =>
    route.fulfill({ json: extra }),
  );
  await page.click("#refresh");
  await page.locator('#model-filter input[value="browser-test"]').waitFor();
  await page.locator('#model-filter input[value="browser-test"]').check();
  await page.waitForFunction(
    () => document.querySelectorAll("#models .model-card").length === 2,
  );
  assert.equal(await page.locator("#matrix thead th").count(), 3);
  await page.selectOption("#category", "Query Optimization");
  assert.equal(
    await page.locator("#matrix .task-name").innerText(),
    "Join-Tree Rewriting",
  );
  assert.equal(await page.locator("#matrix .task-label").count(), 2);
  await page.selectOption("#category", "");
  await page.locator('#model-filter input[value="kimi_k2_7"]').uncheck();
  assert.equal(await page.locator("#models .model-card").count(), 1);
  await page.locator('#model-filter input[value="kimi_k2_7"]').check();
  assert.ok(
    (await page.locator("#models").innerText()).includes(
      "1 shared scored task",
    ),
  );
  const dirty = structuredClone(extra);
  dirty.results.push({
    ...dirty.results[0],
    task_id: "debug-smoke",
    status: "running",
    score: null,
    verdict: null,
  });
  await page.route("**/assets/data/results2.json", (route) =>
    route.fulfill({ json: dirty }),
  );
  await page.click("#refresh");
  await page
    .getByText(
      "Could not refresh. The previous snapshot is still shown. Try again shortly.",
    )
    .waitFor();
  assert.equal(await page.locator("#matrix .task-name").count(), 10);
  await page.route("**/assets/data/results2.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.click("#refresh");
  await page
    .getByText(
      "Could not refresh. The previous snapshot is still shown. Try again shortly.",
    )
    .waitFor();
  assert.equal(await page.locator("#models .model-card").count(), 2);
  assert.deepEqual(errors, []);
  await page.reload();
  await page
    .getByText(
      "Results could not be loaded. Please try Refresh snapshot again shortly.",
    )
    .waitFor();
  assert.equal(await page.locator("#download").isDisabled(), true);
  await browser.close();
  console.log(
    "Results2 browser checks passed: desktop, mobile, filters, zero, curves, CSV, multi-model, refresh failure.",
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
