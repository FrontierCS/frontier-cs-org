/* Public data is an allowlisted snapshot; no browser request reaches the eval platform. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const colors = [
    "#7a1a1a",
    "#276554",
    "#346285",
    "#9a6b23",
    "#73536b",
    "#407d80",
  ];
  const fmt = (n, digits = 1) =>
    Number.isFinite(n)
      ? n.toLocaleString("en-US", { maximumFractionDigits: digits })
      : "—";
  const compact = (n) =>
    Number.isFinite(n)
      ? Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(n)
      : "—";
  const time = (n) =>
    !Number.isFinite(n)
      ? "—"
      : n < 60
        ? `${fmt(n, 0)}s`
        : n < 3600
          ? `${fmt(n / 60)}m`
          : `${fmt(n / 3600, 2)}h`;
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  let data, selectedTask;
  let selectedModels = new Set();
  const models = () => data.models.filter((m) => selectedModels.has(m.id));
  const resultFor = (task, model) =>
    data.results.find((r) => r.task_id === task && r.model_id === model);
  const badge = (r) =>
    el("span", r.verdict, `badge ${r.verdict.toLowerCase()}`);
  function summary() {
    const scored = data.results.filter((r) => Number.isFinite(r.score));
    $("summary").replaceChildren();
    [
      [data.tasks.length, "Research tasks"],
      [data.models.length, "Models evaluated"],
      [
        `${scored.length} / ${data.tasks.length * data.models.length}`,
        "Final scores available",
      ],
      [
        data.results.reduce((sum, r) => sum + (r.submissions || 0), 0),
        "Verified-run submissions",
      ],
    ].forEach(([value, title]) => {
      const node = el("div", undefined, "stat");
      node.append(
        el("span", String(value), "stat-value"),
        el("span", title, "stat-label"),
      );
      $("summary").append(node);
    });
    const common = data.tasks.filter((t) =>
      models().every((m) => Number.isFinite(resultFor(t.id, m.id)?.score)),
    );
    $("models").replaceChildren();
    models().forEach((model, i) => {
      const results = data.results.filter((r) => r.model_id === model.id),
        finals = results.filter((r) => Number.isFinite(r.score));
      const mean = common.length
        ? common.reduce((s, t) => s + resultFor(t.id, model.id).score, 0) /
          common.length
        : null;
      const card = el("article", undefined, "model-card");
      card.style.borderTopColor = colors[i % colors.length];
      card.append(el("h3", model.label));
      const score = el("div", fmt(mean, 2), "model-score");
      score.append(
        el(
          "small",
          `Comparable mean · ${common.length} shared scored task${common.length === 1 ? "" : "s"}`,
        ),
      );
      card.append(score);
      const stats = el("div", undefined, "card-stats");
      const knownTokens = results.filter((r) =>
        Number.isFinite(r.total_tokens),
      );
      [
        [`${finals.length}/${data.tasks.length}`, "scored"],
        [
          `${results.filter((r) => r.verdict === "PASS").length}/${results.filter((r) => r.verdict).length}`,
          "passed / judged",
        ],
        [
          knownTokens.length
            ? compact(knownTokens.reduce((s, r) => s + r.total_tokens, 0))
            : "—",
          `tokens (${knownTokens.length}/${results.length} measured)`,
        ],
      ].forEach(([v, l]) => {
        const n = el("span", v);
        n.append(el("small", l));
        stats.append(n);
      });
      card.append(stats);
      const bar = el("div", undefined, "coverage"),
        fill = el("span");
      fill.style.width = `${(100 * finals.length) / Math.max(1, data.tasks.length)}%`;
      bar.append(fill);
      card.append(bar);
      $("models").append(card);
    });
  }
  function matrix() {
    const query = $("search").value.trim().toLowerCase(),
      category = $("category").value,
      status = $("status").value;
    let tasks = data.tasks.filter(
      (t) =>
        t.label.toLowerCase().includes(query) &&
        (!category || t.labels.includes(category)) &&
        (!status ||
          (status === "unpublished" &&
            models().some((m) => !resultFor(t.id, m.id))) ||
          data.results.some(
            (r) =>
              selectedModels.has(r.model_id) &&
              r.task_id === t.id &&
              r.verdict === status,
          )),
    );
    const max = (t) => {
      const scores = data.results
        .filter(
          (r) =>
            selectedModels.has(r.model_id) &&
            r.task_id === t.id &&
            Number.isFinite(r.score),
        )
        .map((r) => r.score);
      return scores.length ? Math.max(...scores) : null;
    };
    tasks.sort((a, b) => {
      const order = $("sort").value;
      if (order === "name") return a.label.localeCompare(b.label);
      const x = max(a),
        y = max(b);
      if (x === null) return y === null ? 0 : 1;
      if (y === null) return -1;
      return order === "score-desc" ? y - x : x - y;
    });
    const header = el("tr");
    header.append(el("th", "Task"));
    models().forEach((m) => header.append(el("th", m.label)));
    $("matrix").tHead.replaceChildren(header);
    const body = $("matrix").tBodies[0];
    body.replaceChildren();
    tasks.forEach((task) => {
      const row = el("tr"),
        name = el("td"),
        button = el("button", task.label, "task-name");
      button.type = "button";
      button.addEventListener("click", () => {
        selectedTask = task.id;
        $("detail-task").value = task.id;
        chart();
        $("detail-heading").scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
          block: "start",
        });
      });
      const labels = el("span", undefined, "task-labels");
      task.labels.forEach((label) =>
        labels.append(el("span", label, "task-label")),
      );
      name.append(button, labels);
      row.append(name);
      models().forEach((model) => {
        const r = resultFor(task.id, model.id),
          cell = el("td");
        if (!r) {
          cell.append(el("span", "Not published", "muted"));
        } else {
          const main = el("div", undefined, "cell-main");
          main.append(el("span", fmt(r.score, 2), "score"), badge(r));
          cell.append(
            main,
            el(
              "div",
              `${compact(r.total_tokens)} tokens · ${fmt(r.submissions, 0)} submissions`,
              "cell-meta",
            ),
          );
        }
        row.append(cell);
      });
      body.append(row);
    });
    if (!tasks.length) {
      const row = el("tr"),
        cell = el("td", "No tasks match these filters.");
      cell.colSpan = models().length + 1;
      row.append(cell);
      body.append(row);
    }
    $("task-count").textContent =
      `${tasks.length} of ${data.tasks.length} tasks`;
  }
  function chart() {
    const task = data.tasks.find((t) => t.id === selectedTask);
    if (!task) return;
    const axis = $("axis").value,
      phase = $("phase").value;
    const series = models().map((m, i) => ({
      model: m,
      color: colors[i % colors.length],
      points: (resultFor(task.id, m.id)?.history || [])
        .filter(
          (p) =>
            p.phase === phase &&
            Number.isFinite(p.score) &&
            Number.isFinite(p[axis]),
        )
        .sort((a, b) => a[axis] - b[axis]),
    }));
    const all = series.flatMap((s) => s.points),
      history = $("history").tBodies[0];
    history.replaceChildren();
    $("legend").replaceChildren();
    models().forEach((m, i) => {
      const span = el("span", m.label);
      span.style.setProperty("--series", colors[i % colors.length]);
      $("legend").append(span);
      (resultFor(task.id, m.id)?.history || [])
        .filter((p) => p.phase === phase)
        .forEach((p) => {
          const row = el("tr");
          [
            m.label,
            fmt(p.submission, 0),
            fmt(p.score, 2),
            time(p.elapsed_seconds),
            fmt(p.total_tokens, 0),
          ].forEach((v) => row.append(el("td", v)));
          history.append(row);
        });
    });
    $("detail-description").textContent =
      `${task.label} · ${task.labels.join(" / ")}`;
    $("chart-note").textContent =
      "Points are observed submission outcomes, not a best-so-far envelope. Run elapsed time includes infrastructure and judging. Missing measurements are omitted from the selected axis.";
    const container = $("chart");
    container.replaceChildren();
    if (!all.length) {
      const empty = el("div", undefined, "chart-empty"),
        copy = el("div");
      copy.append(
        el("strong", "No published measurements."),
        el(
          "span",
          `No verified ${phase} score / ${axis === "total_tokens" ? "token" : axis === "elapsed_seconds" ? "time" : "submission"} measurements for this task yet. Try another axis or task.`,
        ),
      );
      empty.append(copy);
      container.append(empty);
      return;
    }
    const ns = "http://www.w3.org/2000/svg",
      svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 920 340");
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      `${phase} scores versus ${axis.replaceAll("_", " ")} for ${task.label}; same values in the chart data table.`,
    );
    const draw = (tag, attrs, text) => {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text !== undefined) n.textContent = text;
      svg.append(n);
      return n;
    };
    const xmin = 0,
      xmax = Math.max(1, ...all.map((p) => p[axis])) * 1.04,
      ymin = Math.min(0, ...all.map((p) => p.score)),
      ymax = Math.max(1, ...all.map((p) => p.score)) * 1.08;
    const x = (v) => 62 + (v / (xmax - xmin)) * 824,
      y = (v) => 290 - ((v - ymin) / (ymax - ymin)) * 260;
    for (let i = 0; i <= 4; i++) {
      const v = ymin + ((ymax - ymin) * i) / 4;
      draw("line", { x1: 62, x2: 886, y1: y(v), y2: y(v), class: "grid" });
      draw("text", { x: 48, y: y(v) + 4, "text-anchor": "end" }, fmt(v, 1));
      const xv = (xmax * i) / 4;
      draw(
        "text",
        { x: x(xv), y: 315, "text-anchor": "middle" },
        axis === "elapsed_seconds" ? time(xv) : compact(xv),
      );
    }
    draw("text", { x: 62, y: 15 }, "SCORE");
    draw(
      "text",
      { x: 886, y: 338, "text-anchor": "end" },
      axis === "elapsed_seconds"
        ? "RUN ELAPSED TIME"
        : axis === "total_tokens"
          ? "TOKENS CONSUMED"
          : "SUBMISSION",
    );
    const tooltip = el("div", undefined, "chart-tooltip");
    tooltip.hidden = true;
    series.forEach((s) => {
      if (!s.points.length) return;
      if (s.points.length > 1)
        draw("polyline", {
          points: s.points.map((p) => `${x(p[axis])},${y(p.score)}`).join(" "),
          class: "series",
          stroke: s.color,
        });
      s.points.forEach((p) => {
        const dot = draw("circle", {
          cx: x(p[axis]),
          cy: y(p.score),
          r: 5,
          fill: s.color,
          tabindex: 0,
        });
        const text = `${s.model.label} · #${p.submission}\nScore ${fmt(p.score, 2)}\n${time(p.elapsed_seconds)} · ${fmt(p.total_tokens, 0)} tokens`;
        const title = document.createElementNS(ns, "title");
        title.textContent = text;
        dot.append(title);
        dot.setAttribute("aria-label", text);
        const show = () => {
          tooltip.textContent = text;
          tooltip.style.whiteSpace = "pre-line";
          tooltip.hidden = false;
          tooltip.style.left = `${Math.min(container.clientWidth - 230, Math.max(0, (x(p[axis]) / 920) * container.clientWidth))}px`;
          tooltip.style.top = `${Math.max(0, (y(p.score) / 920) * container.clientWidth - 85)}px`;
        };
        dot.addEventListener("mouseenter", show);
        dot.addEventListener("focus", show);
        dot.addEventListener("mouseleave", () => (tooltip.hidden = true));
        dot.addEventListener("blur", () => (tooltip.hidden = true));
      });
    });
    container.append(svg, tooltip);
  }
  function csv() {
    const rows = [
      [
        "task",
        "labels",
        "model",
        "score",
        "pass_fail",
        "status",
        "input_tokens",
        "output_tokens",
        "total_tokens",
        "elapsed_seconds",
        "submissions",
      ],
    ];
    data.tasks.forEach((t) =>
      models().forEach((m) => {
        const r = resultFor(t.id, m.id);
        if (r)
          rows.push([
            t.label,
            t.labels.join("; "),
            m.label,
            r.score,
            r.verdict,
            r.status,
            r.input_tokens,
            r.output_tokens,
            r.total_tokens,
            r.elapsed_seconds,
            r.submissions,
          ]);
      }),
    );
    // Protect spreadsheet users from formula injection in labels imported by maintainers.
    const escape = (v) =>
      `"${String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map(escape).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = el("a");
    a.href = url;
    a.download = "frontier-cs-preview-results.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function load() {
    $("refresh").disabled = true;
    try {
      const response = await fetch($("results").dataset.source, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const fresh = await response.json();
      if (
        fresh.schema_version !== 1 ||
        !Array.isArray(fresh.tasks) ||
        !Array.isArray(fresh.models) ||
        !Array.isArray(fresh.results)
      )
        throw new Error("Unsupported results format");
      if (
        fresh.results.some(
          (r) =>
            r.status !== "completed" ||
            !Number.isFinite(r.score) ||
            !["PASS", "FAIL"].includes(r.verdict),
        )
      )
        throw new Error("Unverified public result");
      data = fresh;
      if (!selectedModels.size)
        selectedModels = new Set(data.models.map((m) => m.id));
      selectedModels = new Set(
        [...selectedModels].filter((id) =>
          data.models.some((m) => m.id === id),
        ),
      );
      if (!selectedModels.size && data.models.length)
        selectedModels.add(data.models[0].id);
      $("model-filter").replaceChildren(el("legend", "Models to compare"));
      data.models.forEach((m) => {
        const control = el("label"),
          input = el("input");
        input.type = "checkbox";
        input.value = m.id;
        input.checked = selectedModels.has(m.id);
        input.addEventListener("change", () => {
          if (input.checked) selectedModels.add(m.id);
          else selectedModels.delete(m.id);
          if (!selectedModels.size) {
            selectedModels.add(m.id);
            input.checked = true;
          }
          summary();
          matrix();
          chart();
        });
        control.append(input, el("span", m.label));
        $("model-filter").append(control);
      });
      const priorCategory = $("category").value;
      $("category").replaceChildren(new Option("All labels", ""));
      [...new Set(data.tasks.flatMap((t) => t.labels))]
        .sort()
        .forEach((c) => $("category").add(new Option(c, c)));
      $("category").value = priorCategory;
      $("detail-task").replaceChildren();
      data.tasks.forEach((t) =>
        $("detail-task").add(new Option(t.label, t.id)),
      );
      selectedTask = data.tasks.some((t) => t.id === selectedTask)
        ? selectedTask
        : data.tasks.find((t) =>
            data.results.some((r) => r.task_id === t.id && r.history?.length),
          )?.id || data.tasks[0]?.id;
      $("detail-task").value = selectedTask;
      const date = new Date(data.updated_at);
      $("updated").textContent =
        `Snapshot · ${Number.isNaN(date.getTime()) ? "date unavailable" : date.toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC"}`;
      $("notice").className = "notice";
      $("notice").textContent =
        "Verified research results only · Unpublished results are excluded from averages and failures.";
      summary();
      matrix();
      chart();
      $("download").disabled = false;
    } catch (error) {
      $("notice").className = "notice error";
      $("notice").textContent = data
        ? "Could not refresh. The previous snapshot is still shown. Try again shortly."
        : "Results could not be loaded. Please try Refresh snapshot again shortly.";
    } finally {
      $("refresh").disabled = false;
    }
  }
  ["search", "category", "status", "sort"].forEach((id) =>
    $(id).addEventListener(
      id === "search" ? "input" : "change",
      () => data && matrix(),
    ),
  );
  $("detail-task").addEventListener("change", () => {
    selectedTask = $("detail-task").value;
    chart();
  });
  ["axis", "phase"].forEach((id) =>
    $(id).addEventListener("change", () => data && chart()),
  );
  $("download").addEventListener("click", csv);
  $("refresh").addEventListener("click", load);
  load();
})();
