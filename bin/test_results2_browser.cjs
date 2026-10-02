const { chromium } = require(process.env.RESULTS2_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = process.env.RESULTS2_URL || "http://127.0.0.1:18082/results2/";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(
    () => document.querySelectorAll("#matrix .task-name").length === 10,
  );
  const snapshot = await (
    await page.request.get(new URL("/assets/data/results2.json", base).href)
  ).json();
  assert.equal(await page.locator("h1").innerText(), "Evaluation results");
  assert.equal(await page.locator("#summary .stat").count(), 6);
  assert.equal(
    await page.locator("#matrix .badge.pass").count(),
    snapshot.results.filter((r) => r.verdict === "PASS").length,
  );
  assert.equal(
    await page.locator("#matrix .badge.fail").count(),
    snapshot.results.filter((r) => r.verdict === "FAIL").length,
  );
  await page.selectOption("#category", "Programming Languages");
  assert.equal(
    await page.locator("#matrix .task-name").innerText(),
    "Reusable Library Candidates",
  );
  await page.selectOption("#category", "");
  await page.selectOption("#status", "FAIL");
  assert.equal(await page.locator("#matrix .task-name").count(), 5);
  await page.selectOption("#status", "");
  await page.fill("#search", "nothing matches");
  await page.getByText("No results match these filters.").waitFor();
  await page.fill("#search", "");
  await page
    .locator("#matrix thead button")
    .filter({ hasText: "Final score" })
    .click();
  assert.equal(
    await page.locator("#matrix .task-name").first().innerText(),
    "Graph Mining Method Selection",
  );
  await page.locator("#columns-menu summary").click();
  await page.locator('#column-filter input[value="output_tokens"]').uncheck();
  assert.equal(await page.locator("#matrix th").count(), 10);
  await page.reload();
  await page.waitForFunction(
    () => document.querySelectorAll("#matrix .task-name").length === 10,
  );
  assert.equal(await page.locator("#matrix th").count(), 10);
  assert.equal(
    await page.locator("#matrix .task-name").first().innerText(),
    "Graph Mining Method Selection",
  );
  await page.locator("#columns-menu summary").click();
  await page.locator('#column-filter input[value="output_tokens"]').check();
  await page.locator("#columns-menu summary").click();
  await page.fill("#search", "Sparse");
  const zero = page.locator("#matrix tbody tr td").nth(2);
  assert.equal(await zero.innerText(), "0");
  assert.equal(await zero.getAttribute("title"), "0");
  await page.fill("#search", "");
  await page
    .locator("#matrix .task-name")
    .filter({ hasText: "Join-Tree Rewriting" })
    .click();
  assert.equal(
    await page.locator("#detail-task").inputValue(),
    "join_tree_rewriting",
  );
  assert.equal(await page.locator("#matrix tr.selected").count(), 1);
  assert.equal(await page.locator(".charts .chart").count(), 3);
  const join = snapshot.results.find(
    (r) => r.task_id === "join_tree_rewriting",
  );
  assert.ok(
    await page
      .locator("#detail-metrics")
      .innerText()
      .then((t) => t.includes("Best train")),
  );
  for (const id of ["chart-time", "chart-tokens", "chart-submissions"])
    assert.ok((await page.locator(`#${id} circle`).count()) > 0);
  await page.locator("#chart-time circle").first().focus();
  assert.equal(
    await page.locator("#chart-time .chart-tooltip").isVisible(),
    true,
  );
  assert.equal(await page.locator(".charts circle.highlight").count(), 3);
  assert.ok(
    (await page.locator("#point-inspector").innerText()).includes("score"),
  );
  await page.locator('.expand-chart[data-axis="total_tokens"]').click();
  assert.equal(await page.locator("#chart-dialog").isVisible(), true);
  assert.ok((await page.locator("#chart-expanded circle").count()) > 0);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#chart-dialog").isVisible(), false);
  await page.selectOption("#phase", "final");
  for (const id of ["chart-time", "chart-tokens", "chart-submissions"])
    assert.equal(await page.locator(`#${id} circle`).count(), 1);
  assert.equal(await page.locator("#history tbody tr").count(), 1);
  await page.selectOption("#phase", "train");
  assert.equal(
    await page.locator("#history tbody tr").count(),
    join.history.filter((p) => p.phase === "train").length,
  );
  let download = page.waitForEvent("download");
  await page.click("#download");
  const tableDownload = await download;
  assert.equal(
    tableDownload.suggestedFilename(),
    "frontier-cs-preview-results.csv",
  );
  const exported = await fs.readFile(await tableDownload.path(), "utf8");
  assert.ok(exported.includes(String(join.score)));
  assert.ok(exported.includes('"best_train_score"'));
  assert.ok(!exported.includes("run_01"));

  await page.locator("#raw-data summary").click();
  download = page.waitForEvent("download");
  await page.click("#download-history");
  assert.equal(
    (await download).suggestedFilename(),
    "frontier-cs-submissions.csv",
  );
  await page.locator("#raw-data summary").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  if (process.env.RESULTS2_SCREENSHOTS)
    await page.screenshot({
      path: `${process.env.RESULTS2_SCREENSHOTS}/dashboard-desktop.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(180);
  assert.ok(
    await page.locator(".main-table").evaluate((node) => {
      node.scrollLeft = node.scrollWidth;
      const last = node.querySelector("th:last-child").getBoundingClientRect();
      const reached =
        node.scrollLeft > 0 &&
        last.right <= node.getBoundingClientRect().right + 1;
      node.scrollLeft = 0;
      return reached;
    }),
  );
  assert.ok(
    await page
      .locator("#point-inspector")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  );

  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  if (process.env.RESULTS2_SCREENSHOTS)
    await page.screenshot({
      path: `${process.env.RESULTS2_SCREENSHOTS}/dashboard-mobile.png`,
      fullPage: true,
    });
  // Synthetic comparisons exist only in intercepted browser requests, never published.
  const extra = structuredClone(snapshot);
  extra.models.push({ id: "browser-test", label: "Browser test only" });
  extra.tasks
    .find((t) => t.id === "join_tree_rewriting")
    .labels.push("Query Optimization");
  extra.results.push({
    ...join,
    model_id: "browser-test",
    score: 0,
    verdict: "FAIL",
    input_tokens: null,
    output_tokens: null,
    total_tokens: null,
    history: join.history.map((p) => ({ ...p, total_tokens: null })),
  });
  await page.route("**/assets/data/results2.json", (route) =>
    route.fulfill({ json: extra }),
  );
  await page.click("#refresh");
  await page.locator('#model-filter input[value="browser-test"]').waitFor();
  await page.locator('#model-filter input[value="browser-test"]').check();
  assert.equal(await page.locator("#matrix .task-name").count(), 20);
  assert.equal(await page.locator("#models .model-card").count(), 2);
  await page.selectOption("#category", "Query Optimization");
  assert.equal(await page.locator("#matrix .task-name").count(), 2);
  assert.equal(await page.locator("#matrix .task-label").count(), 4);
  assert.ok(
    (await page.locator("#summary").innerText()).includes(
      "1 shared scored tasks",
    ),
  );
  assert.equal(await page.locator("#chart-time .series").count(), 2);
  assert.equal(await page.locator("#chart-tokens .series").count(), 1);
  await page.locator('#model-filter input[value="kimi_k2_7"]').uncheck();
  assert.equal(await page.locator("#matrix .task-name").count(), 1);
  assert.equal(
    await page.locator("#matrix tbody tr td").nth(5).innerText(),
    "—",
  );
  assert.equal(await page.locator("#chart-tokens .chart-empty").count(), 1);
  assert.equal(
    await page.locator("#matrix tbody tr td").nth(2).innerText(),
    "0",
  );
  await page.locator('#model-filter input[value="kimi_k2_7"]').check();
  await page.selectOption("#category", "");
  const dirty = structuredClone(extra);
  dirty.results.push({
    ...join,
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
    .getByText("Could not refresh. Previous verified snapshot retained.")
    .waitFor();
  assert.equal(await page.locator("#matrix .task-name").count(), 20);
  await page.route("**/assets/data/results2.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.reload();
  await page
    .getByText("Results could not be loaded. Refresh to try again.")
    .waitFor();
  assert.equal(await page.locator("#download").isDisabled(), true);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "Dashboard browser checks passed: density, labels, sort, columns, zero, row selection, three linked charts, expanded chart, exact data, CSV, mobile, multiple models, missing tokens, publication rejection.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
