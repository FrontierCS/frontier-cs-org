/* Read-only public snapshots. Never connect the browser to evaluation infrastructure. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    colors = ["#087e8b", "#c57b19", "#6671cb", "#bb5967", "#39935b", "#526b7f"];
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const fmt = (n, d = 2) =>
    Number.isFinite(n)
      ? n.toLocaleString("en-US", { maximumFractionDigits: d })
      : "—";
  const compact = (n) =>
    Number.isFinite(n)
      ? Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 2,
        }).format(n)
      : "—";
  const time = (n) =>
    !Number.isFinite(n)
      ? "—"
      : n < 60
        ? `${fmt(n, 0)}s`
        : n < 3600
          ? `${fmt(n / 60, 1)}m`
          : `${fmt(n / 3600, 2)}h`;
  const badge = (r) =>
    el("span", r.verdict, `badge ${r.verdict.toLowerCase()}`);
  let data,
    selectedTask,
    expandedAxis,
    visibleRows = [],
    sortKey = "task",
    sortDirection = 1;
  let selectedModels = new Set();
  const modelColor = (id) =>
    colors[data.models.findIndex((m) => m.id === id) % colors.length];
  const models = () => data.models.filter((m) => selectedModels.has(m.id));
  const resultFor = (task, model) =>
    data.results.find((r) => r.task_id === task && r.model_id === model);
  const best = (r) => {
    const scores = (r?.history || [])
      .filter((p) => p.phase === "train" && Number.isFinite(p.score))
      .map((p) => p.score);
    return scores.length ? Math.max(...scores) : null;
  };
  const counts = (r) => {
    if (!r) return { train: null, final: null };
    const finals = r.history.filter((p) => p.phase === "final").length;
    return {
      train:
        finals && Number.isFinite(r.submissions) && r.submissions >= finals
          ? r.submissions - finals
          : null,
      final: finals || null,
    };
  };
  const columns = [
    { key: "task", label: "Task", get: (x) => x.task.label },
    { key: "model", label: "Model", get: (x) => x.model.label },
    { key: "score", label: "Final score", get: (x) => x.result?.score },
    { key: "best", label: "Best train", get: (x) => best(x.result) },
    { key: "verdict", label: "Result", get: (x) => x.result?.verdict },
    {
      key: "total_tokens",
      label: "Total tokens",
      get: (x) => x.result?.total_tokens,
    },
    {
      key: "input_tokens",
      label: "Input tokens",
      get: (x) => x.result?.input_tokens,
    },
    {
      key: "output_tokens",
      label: "Output tokens",
      get: (x) => x.result?.output_tokens,
    },
    {
      key: "elapsed_seconds",
      label: "Run elapsed",
      get: (x) => x.result?.elapsed_seconds,
    },
    {
      key: "train",
      label: "Train submits",
      get: (x) => counts(x.result).train,
    },
    {
      key: "final",
      label: "Final submits",
      get: (x) => counts(x.result).final,
    },
  ];
  const visibleColumns = new Set(columns.map((c) => c.key));
  try {
    const saved = JSON.parse(
      localStorage.getItem("frontier-results2-layout") || "null",
    );
    if (saved) {
      if (Array.isArray(saved.columns)) {
        visibleColumns.clear();
        visibleColumns.add("task");
        saved.columns
          .filter((key) => columns.some((c) => c.key === key))
          .forEach((key) => visibleColumns.add(key));
      }
      if (columns.some((c) => c.key === saved.sortKey)) sortKey = saved.sortKey;
      if (saved.sortDirection === 1 || saved.sortDirection === -1)
        sortDirection = saved.sortDirection;
    }
  } catch (_) {
    /* Storage can be unavailable in private browsing. */
  }
  function persistLayout() {
    try {
      localStorage.setItem(
        "frontier-results2-layout",
        JSON.stringify({
          columns: [...visibleColumns],
          sortKey,
          sortDirection,
        }),
      );
    } catch (_) {}
  }

  function metric(value, label, note, title) {
    const node = el("div", undefined, "stat");
    node.append(
      el("span", label, "stat-label"),
      el("span", value, "stat-value"),
      el("span", note, "stat-note"),
    );
    if (title) node.title = title;
    return node;
  }
  function summary() {
    const selected = data.results.filter((r) => selectedModels.has(r.model_id)),
      shared = data.tasks.filter((t) =>
        models().every((m) => Number.isFinite(resultFor(t.id, m.id)?.score)),
      );
    const tokenRows = selected.filter((r) => Number.isFinite(r.total_tokens)),
      knownSubmits = selected.filter((r) => Number.isFinite(counts(r).train));
    const mean = shared.length
      ? shared.reduce(
          (sum, t) =>
            sum + models().reduce((s, m) => s + resultFor(t.id, m.id).score, 0),
          0,
        ) /
        (shared.length * models().length)
      : null;
    $("summary").replaceChildren(
      metric(
        `${selected.length}/${data.tasks.length * models().length}`,
        "Published coverage",
        `${models().length} selected model${models().length === 1 ? "" : "s"} · ${data.tasks.length} tasks`,
      ),
      metric(
        fmt(mean),
        "Comparable mean",
        `${shared.length} shared scored tasks`,
        "Arithmetic mean only over tasks scored by every selected model; per-model means are in the sidebar.",
      ),
      metric(
        `${selected.filter((r) => r.verdict === "PASS").length} / ${selected.length}`,
        "Pass / evaluated",
        `${selected.filter((r) => r.verdict === "FAIL").length} scientific failures`,
      ),
      metric(
        tokenRows.length
          ? compact(tokenRows.reduce((s, r) => s + r.total_tokens, 0))
          : "—",
        "Total tokens",
        `${tokenRows.length}/${selected.length} measured`,
        "Provider-reported input + output, including cached input where reported; not unique context length.",
      ),
      metric(
        knownSubmits.length
          ? fmt(
              knownSubmits.reduce((s, r) => s + counts(r).train, 0),
              0,
            )
          : "—",
        "Train submissions",
        "Verification requests, incl. failures",
      ),
      metric(
        fmt(
          selected.reduce((s, r) => s + (counts(r).final || 0), 0),
          0,
        ),
        "Final evaluations",
        "Accepted scored submissions",
      ),
    );
    $("models").replaceChildren();
    models().forEach((m) => {
      const rows = selected.filter((r) => r.model_id === m.id),
        card = el("article", undefined, "model-card");
      card.style.setProperty("--series", modelColor(m.id));
      card.append(el("h3", m.label));
      const mean = shared.length
        ? shared.reduce((s, t) => s + resultFor(t.id, m.id).score, 0) /
          shared.length
        : null;
      [
        [`${rows.length}/${data.tasks.length}`, "Coverage"],
        [fmt(mean), "Shared mean"],
        [
          `${rows.filter((r) => r.verdict === "PASS").length}/${rows.length}`,
          "Pass / evaluated",
        ],
      ].forEach(([v, l]) => {
        const p = el("p", l);
        p.append(el("b", v));
        card.append(p);
      });
      card.title = `Mean uses ${shared.length} shared scored tasks`;
      $("models").append(card);
    });
  }
  function matrix() {
    const query = $("search").value.trim().toLowerCase(),
      label = $("category").value,
      status = $("status").value;
    visibleRows = data.tasks
      .flatMap((task) =>
        models().map((model) => ({
          task,
          model,
          result: resultFor(task.id, model.id),
        })),
      )
      .filter(
        (x) =>
          x.task.label.toLowerCase().includes(query) &&
          (!label || x.task.labels.includes(label)) &&
          (!status ||
            (status === "published" && x.result) ||
            (status === "unpublished" && !x.result) ||
            x.result?.verdict === status),
      );
    const column = columns.find((c) => c.key === sortKey);
    visibleRows.sort((a, b) => {
      const x = column.get(a),
        y = column.get(b);
      if (x === null || x === undefined)
        return y === null || y === undefined ? 0 : 1;
      if (y === null || y === undefined) return -1;
      return (
        (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) *
        sortDirection
      );
    });
    const active = columns.filter((c) => visibleColumns.has(c.key)),
      header = el("tr");
    active.forEach((c) => {
      const th = el("th");
      if (c.key === "task") th.className = "task-header";
      const b = el(
        "button",
        c.label +
          (sortKey === c.key ? (sortDirection === 1 ? " ↑" : " ↓") : ""),
      );
      b.type = "button";
      b.addEventListener("click", () => {
        sortDirection =
          sortKey === c.key
            ? -sortDirection
            : c.key === "task" || c.key === "model"
              ? 1
              : -1;
        sortKey = c.key;
        persistLayout();
        matrix();
      });
      th.setAttribute(
        "aria-sort",
        sortKey === c.key
          ? sortDirection === 1
            ? "ascending"
            : "descending"
          : "none",
      );
      th.append(b);
      header.append(th);
    });
    $("matrix").tHead.replaceChildren(header);
    const body = $("matrix").tBodies[0];
    body.replaceChildren();
    visibleRows.forEach((x) => {
      const row = el("tr");
      row.dataset.task = x.task.id;
      row.classList.toggle("selected", x.task.id === selectedTask);
      active.forEach((c) => {
        const td = el("td"),
          v = c.get(x);
        if (c.key === "task") {
          td.className = "task-cell";
          const b = el("button", x.task.label, "task-name");
          b.type = "button";
          b.addEventListener("click", () => selectTask(x.task.id));
          const labels = el("span", undefined, "task-labels");
          x.task.labels.forEach((l) =>
            labels.append(el("span", l, "task-label")),
          );
          td.append(b, labels);
        } else if (c.key === "model") {
          td.className = "model-cell";
          const dot = el("span", undefined, "model-dot");
          dot.style.setProperty("--series", modelColor(x.model.id));
          td.append(dot, document.createTextNode(x.model.label));
        } else if (c.key === "verdict") {
          td.append(
            x.result
              ? badge(x.result)
              : el("span", "Not published", "unpublished"),
          );
        } else {
          td.className = "numeric";
          td.textContent =
            c.key === "elapsed_seconds"
              ? time(v)
              : c.key.endsWith("_tokens")
                ? compact(v)
                : fmt(v, c.key === "train" || c.key === "final" ? 0 : 2);
          if (Number.isFinite(v))
            td.title = `${v}${c.key === "elapsed_seconds" ? " seconds (startup, judging and cleanup included)" : ""}`;
        }
        row.append(td);
      });
      row.addEventListener("click", (e) => {
        if (!e.target.closest("button")) selectTask(x.task.id);
      });
      body.append(row);
    });
    if (!visibleRows.length) {
      const row = el("tr"),
        cell = el("td", "No results match these filters.");
      cell.colSpan = active.length;
      row.append(cell);
      body.append(row);
    }
    $("task-count").textContent =
      `${visibleRows.length} rows · ${new Set(visibleRows.map((x) => x.task.id)).size} tasks`;
  }
  function selectTask(id) {
    selectedTask = id;
    $("detail-task").value = id;
    document
      .querySelectorAll("#matrix tbody tr")
      .forEach((row) =>
        row.classList.toggle("selected", row.dataset.task === id),
      );
    analysis();
  }
  function pointText(model, p) {
    return `${model.label} · ${p.phase} #${p.submission} · score ${fmt(p.score, 5)} · ${fmt(p.total_tokens, 0)} tokens · ${fmt(p.elapsed_seconds, 1)} s`;
  }
  function showPoint(model, p) {
    const key = `${model.id}:${p.phase}:${p.submission}`;
    document
      .querySelectorAll(".chart circle")
      .forEach((dot) =>
        dot.classList.toggle("highlight", dot.dataset.point === key),
      );
    $("point-inspector").textContent = pointText(model, p);
  }
  function renderChart(container, axis) {
    const task = data.tasks.find((t) => t.id === selectedTask),
      phase = $("phase").value;
    container.replaceChildren();
    if (!task) return;
    const series = models().map((m) => ({
      model: m,
      color: modelColor(m.id),
      points: (resultFor(task.id, m.id)?.history || [])
        .filter(
          (p) =>
            p.phase === phase &&
            Number.isFinite(p.score) &&
            Number.isFinite(p[axis]),
        )
        .sort((a, b) => a[axis] - b[axis]),
    }));
    const points = series.flatMap((s) => s.points);
    if (!points.length) {
      container.append(
        el(
          "div",
          `No verified ${phase} score / ${axis === "total_tokens" ? "token" : axis === "elapsed_seconds" ? "time" : "submission"} measurements`,
          "chart-empty",
        ),
      );
      return;
    }
    const width = Math.max(
        320,
        container.clientWidth - (container.id === "chart-expanded" ? 44 : 14),
      ),
      height =
        container.id === "chart-expanded"
          ? Math.min(480, window.innerHeight * 0.65)
          : 200,
      left = 43,
      right = width - 15,
      top = 17,
      bottom = height - 32;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      `${task.label}: ${phase} score versus ${axis}. Exact measurements in the submission data table.`,
    );
    svg.style.height = `${height}px`;
    const draw = (tag, attrs, text) => {
      const n = document.createElementNS(svg.namespaceURI, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text !== undefined) n.textContent = text;
      svg.append(n);
      return n;
    };
    const xmin = 0,
      xmax = Math.max(1, ...points.map((p) => p[axis])) * 1.03,
      ymin = Math.min(0, ...points.map((p) => p.score)),
      ymax = Math.max(1, ...points.map((p) => p.score)) * 1.08;
    const x = (v) => left + (v / (xmax - xmin)) * (right - left),
      y = (v) => bottom - ((v - ymin) / (ymax - ymin)) * (bottom - top);
    for (let i = 0; i <= 4; i++) {
      const v = ymin + ((ymax - ymin) * i) / 4;
      draw("line", { x1: left, x2: right, y1: y(v), y2: y(v), class: "grid" });
      draw(
        "text",
        { x: left - 7, y: y(v) + 3, "text-anchor": "end" },
        fmt(v, 1),
      );
      const xv = (xmax * i) / 4;
      draw(
        "text",
        {
          x: x(xv),
          y: bottom + 16,
          "text-anchor": i === 0 ? "start" : i === 4 ? "end" : "middle",
        },
        axis === "elapsed_seconds"
          ? time(xv)
          : axis === "submission"
            ? fmt(Math.round(xv), 0)
            : compact(xv),
      );
    }
    draw("text", { x: left, y: 10 }, "Score");
    draw(
      "text",
      { x: right, y: height - 2, "text-anchor": "end" },
      axis === "elapsed_seconds"
        ? "Run elapsed"
        : axis === "total_tokens"
          ? "Cumulative tokens"
          : "Submission",
    );
    const tooltip = el("div", undefined, "chart-tooltip");
    tooltip.hidden = true;
    series.forEach((s) => {
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
          r: 3.1,
          fill: s.color,
          tabindex: 0,
        });
        dot.dataset.point = `${s.model.id}:${p.phase}:${p.submission}`;
        dot.setAttribute("aria-label", pointText(s.model, p));
        const title = document.createElementNS(svg.namespaceURI, "title");
        title.textContent = pointText(s.model, p);
        dot.append(title);
        const show = () => {
          showPoint(s.model, p);
          tooltip.textContent = `${s.model.label} · ${phase} #${p.submission}\nScore: ${p.score}\nTokens: ${fmt(p.total_tokens, 0)}\nElapsed: ${fmt(p.elapsed_seconds, 2)} s`;
          tooltip.hidden = false;
          tooltip.style.left = `${Math.max(0, Math.min(container.clientWidth - 245, x(p[axis]) - 55))}px`;
          tooltip.style.top = `${Math.max(0, y(p.score) - 84)}px`;
        };
        dot.addEventListener("mouseenter", show);
        dot.addEventListener("focus", show);
        dot.addEventListener("mouseleave", () => (tooltip.hidden = true));
        dot.addEventListener("blur", () => (tooltip.hidden = true));
      });
    });
    container.append(svg, tooltip);
  }
  function analysis() {
    if (!selectedTask) return;
    const task = data.tasks.find((t) => t.id === selectedTask);
    $("detail-metrics").replaceChildren();
    $("legend").replaceChildren();
    models().forEach((m) => {
      const legend = el("span", m.label);
      legend.style.setProperty("--series", modelColor(m.id));
      $("legend").append(legend);
      const r = resultFor(task.id, m.id),
        detail = el("div", undefined, "detail-model");
      detail.style.setProperty("--series", modelColor(m.id));
      detail.append(el("strong", m.label));
      if (!r) {
        detail.append(el("span", "Not published"));
      } else {
        detail.append(badge(r));
        [
          ["Final", fmt(r.score)],
          ["Best train", fmt(best(r))],
          ["Tokens", compact(r.total_tokens)],
          ["Run elapsed", time(r.elapsed_seconds)],
          [
            "Train / final",
            `${fmt(counts(r).train, 0)} / ${fmt(counts(r).final, 0)}`,
          ],
        ].forEach(([l, v]) => {
          const item = el("span", l);
          item.append(el("b", v, "detail-value"));
          detail.append(item);
        });
      }
      $("detail-metrics").append(detail);
    });
    const body = $("history").tBodies[0];
    body.replaceChildren();
    let count = 0;
    models().forEach((m) =>
      (resultFor(task.id, m.id)?.history || [])
        .filter((p) => p.phase === $("phase").value)
        .forEach((p) => {
          const row = el("tr");
          [
            m.label,
            p.phase,
            p.submission,
            p.score,
            p.elapsed_seconds,
            p.total_tokens,
          ].forEach((v) => row.append(el("td", v === null ? "—" : String(v))));
          body.append(row);
          count++;
        }),
    );
    $("history-count").textContent = `${count} measured points`;
    [
      ["chart-time", "elapsed_seconds"],
      ["chart-tokens", "total_tokens"],
      ["chart-submissions", "submission"],
    ].forEach(([id, axis]) => renderChart($(id), axis));
    if ($("chart-dialog").open) renderChart($("chart-expanded"), expandedAxis);
    $("point-inspector").textContent =
      "Hover or focus a point to inspect its score, tokens and elapsed time across all charts.";
  }
  function download(rows, name) {
    const escape = (v) => {
      const value =
        typeof v === "number"
          ? String(v)
          : String(v ?? "").replace(/^[=+@-]/, "'$&");
      return `"${value.replaceAll('"', '""')}"`;
    };
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map(escape).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = el("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportResults() {
    const rows = [
      [
        "task",
        "labels",
        "model",
        "final_score",
        "best_train_score",
        "pass_fail",
        "input_tokens",
        "output_tokens",
        "total_tokens",
        "run_elapsed_seconds",
        "train_submissions",
        "final_submissions",
      ],
    ];
    visibleRows.forEach((x) => {
      const r = x.result;
      rows.push([
        x.task.label,
        x.task.labels.join("; "),
        x.model.label,
        r?.score,
        best(r),
        r?.verdict,
        r?.input_tokens,
        r?.output_tokens,
        r?.total_tokens,
        r?.elapsed_seconds,
        counts(r).train,
        counts(r).final,
      ]);
    });
    download(rows, "frontier-cs-preview-results.csv");
  }
  function exportHistory() {
    const task = data.tasks.find((t) => t.id === selectedTask),
      rows = [
        [
          "task",
          "model",
          "split",
          "submission",
          "score",
          "run_elapsed_seconds",
          "cumulative_tokens",
        ],
      ];
    models().forEach((m) =>
      (resultFor(task.id, m.id)?.history || [])
        .filter((p) => p.phase === $("phase").value)
        .forEach((p) =>
          rows.push([
            task.label,
            m.label,
            p.phase,
            p.submission,
            p.score,
            p.elapsed_seconds,
            p.total_tokens,
          ]),
        ),
    );
    download(rows, "frontier-cs-submissions.csv");
  }
  async function load() {
    $("refresh").disabled = true;
    try {
      const response = await fetch($("results").dataset.source, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Snapshot unavailable");
      const fresh = await response.json();
      if (
        fresh.schema_version !== 1 ||
        !Array.isArray(fresh.models) ||
        !Array.isArray(fresh.tasks) ||
        !Array.isArray(fresh.results) ||
        fresh.results.some(
          (r) =>
            r.status !== "completed" ||
            !Number.isFinite(r.score) ||
            !["PASS", "FAIL"].includes(r.verdict),
        ) ||
        fresh.tasks.some((t) => !t.label || !Array.isArray(t.labels))
      )
        throw new Error("Unverified public snapshot");
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
      $("model-filter").replaceChildren(el("legend", "MODELS"));
      data.models.forEach((m) => {
        const label = el("label"),
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
          analysis();
        });
        label.append(input, el("span", m.label));
        $("model-filter").append(label);
      });
      const category = $("category").value;
      $("category").replaceChildren(new Option("All labels", ""));
      [...new Set(data.tasks.flatMap((t) => t.labels))]
        .sort()
        .forEach((l) => $("category").add(new Option(l, l)));
      $("category").value = category;
      $("detail-task").replaceChildren();
      data.tasks.forEach((t) =>
        $("detail-task").add(new Option(t.label, t.id)),
      );
      selectedTask = data.tasks.some((t) => t.id === selectedTask)
        ? selectedTask
        : data.tasks.find((t) =>
            data.results.some(
              (r) => r.task_id === t.id && r.history.length > 1,
            ),
          )?.id || data.tasks[0]?.id;
      $("detail-task").value = selectedTask;
      const date = new Date(data.updated_at);
      $("updated").textContent =
        `Snapshot ${Number.isNaN(date.getTime()) ? "date unavailable" : date.toISOString().slice(0, 16).replace("T", " ") + " UTC"}`;
      $("notice").className = "notice";
      $("notice").textContent = "";
      summary();
      matrix();
      analysis();
      $("download").disabled = false;
    } catch (error) {
      $("notice").className = "notice error";
      $("notice").textContent = data
        ? "Could not refresh. Previous verified snapshot retained."
        : "Results could not be loaded. Refresh to try again.";
    } finally {
      $("refresh").disabled = false;
    }
  }
  columns
    .filter((c) => c.key !== "task")
    .forEach((c) => {
      const label = el("label"),
        input = el("input");
      input.type = "checkbox";
      input.checked = visibleColumns.has(c.key);
      input.value = c.key;
      input.addEventListener("change", () => {
        if (input.checked) visibleColumns.add(c.key);
        else visibleColumns.delete(c.key);
        persistLayout();
        if (data) matrix();
      });
      label.append(input, el("span", c.label));
      $("column-filter").append(label);
    });
  ["search", "category", "status"].forEach((id) =>
    $(id).addEventListener(
      id === "search" ? "input" : "change",
      () => data && matrix(),
    ),
  );
  $("detail-task").addEventListener("change", () =>
    selectTask($("detail-task").value),
  );
  $("phase").addEventListener("change", () => data && analysis());
  $("download").addEventListener("click", exportResults);
  $("download-history").addEventListener("click", exportHistory);
  $("refresh").addEventListener("click", load);
  document.querySelectorAll(".expand-chart").forEach((b) =>
    b.addEventListener("click", () => {
      expandedAxis = b.dataset.axis;
      $("expanded-title").textContent =
        `${data.tasks.find((t) => t.id === selectedTask).label} · ${$("phase").value} scores`;
      $("chart-dialog").showModal();
      renderChart($("chart-expanded"), expandedAxis);
    }),
  );
  $("close-chart").addEventListener("click", () => $("chart-dialog").close());
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => data && analysis(), 100);
  });
  load();
})();
