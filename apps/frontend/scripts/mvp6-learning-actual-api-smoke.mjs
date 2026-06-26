import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const apiBaseUrl = process.env.MVP6_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const frontendBaseUrl = process.env.MVP6_FRONTEND_BASE_URL ?? "http://127.0.0.1:5173";
const artifactDir = resolve(process.env.MVP6_LEARNING_SMOKE_ARTIFACT_DIR ?? "/tmp/ontology-mvp6-learning-actual-smoke");
const runId = new Date().toISOString().replace(/[:.]/g, "-");

await mkdir(artifactDir, { recursive: true });

const result = { apiBaseUrl, frontendBaseUrl, artifactDir, apiChecks: [], routes: [], screenshots: [], ids: {} };

async function requestJson(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { response, data, text };
}

async function ok(path, options) {
  const { response, data, text } = await requestJson(path, options);
  if (!response.ok) {
    throw new Error(`${options?.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return data;
}

function unwrapItems(payload) {
  return Array.isArray(payload) ? payload : payload?.items ?? [];
}

function errorCode(data) {
  return data?.error?.code ?? data?.code;
}

async function screenshot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  result.screenshots.push(path);
  return path;
}

// ---- 1. Seed an actual project; backend learning service auto-seeds signals. ----
const project = await ok("/api/v1/projects", {
  method: "POST",
  body: JSON.stringify({ name: `MVP6.2 Learning Actual Smoke ${runId}`, description: "Wave32 learning insights actual smoke" }),
});
result.ids.project_id = project.id;

const summary = await ok(`/api/v1/projects/${project.id}/learning-signals/summary`);
if (summary.project_id !== project.id || !Array.isArray(summary.signal_counts) || summary.signal_counts.length !== 7) {
  throw new Error("Summary missing project scope or frozen signal taxonomy.");
}
result.apiChecks.push({ name: "summary", total_signal_count: summary.total_signal_count, signal_types: summary.signal_counts.length });

const patterns = unwrapItems(await ok(`/api/v1/projects/${project.id}/learning-signals/correction-patterns`));
const firstPattern = patterns[0];
if (patterns.length === 0 || !firstPattern.source_artifacts?.length) {
  throw new Error("Correction patterns missing or lacking source artifacts.");
}
// Verify the renamed nested fields exist on the backend payload (frozen contract).
const affectedClass = firstPattern.affected_classes?.[0];
const affectedRelation = firstPattern.affected_relations?.[0];
if (!affectedClass || typeof affectedClass.ontology_class_id !== "string" || typeof affectedClass.label !== "string") {
  throw new Error(`affected_classes[0] must expose ontology_class_id + label, got ${JSON.stringify(affectedClass)}`);
}
if (!affectedRelation || typeof affectedRelation.ontology_relation_id !== "string" || typeof affectedRelation.label !== "string") {
  throw new Error(`affected_relations[0] must expose ontology_relation_id + label, got ${JSON.stringify(affectedRelation)}`);
}
result.apiChecks.push({
  name: "correction-patterns",
  count: patterns.length,
  affected_class_id: affectedClass.ontology_class_id,
  affected_class_label: affectedClass.label,
  affected_relation_id: affectedRelation.ontology_relation_id,
});

const suggestions = unwrapItems(await ok(`/api/v1/projects/${project.id}/learning-signals/prompt-suggestions`));
const open = suggestions.find((item) => item.state === "SUGGESTED");
const superseded = suggestions.find((item) => item.state === "SUPERSEDED");
if (!open) {
  throw new Error("Expected at least one SUGGESTED prompt suggestion.");
}
result.apiChecks.push({ name: "prompt-suggestions", count: suggestions.length, open_id: open.id });

const autoApproval = unwrapItems(await ok(`/api/v1/projects/${project.id}/learning-signals/auto-approval-candidates`));
if (autoApproval.length === 0 || autoApproval[0].recommendation_only !== true || autoApproval[0].not_enforced !== true) {
  throw new Error("Auto-approval previews missing or not recommendation-only.");
}
const firstOutcome = autoApproval[0].historical_match_preview?.outcomes?.[0];
if (!firstOutcome || typeof firstOutcome.reason !== "string" || typeof firstOutcome.outcome !== "string") {
  throw new Error(`historical_match_preview.outcomes[0] must expose outcome + reason, got ${JSON.stringify(firstOutcome)}`);
}
result.apiChecks.push({ name: "auto-approval", count: autoApproval.length, outcome_reason: firstOutcome.reason });

// ---- 2. DISMISS requires reason; conflict on re-decide. ----
const missingReason = await requestJson(`/api/v1/learning-signal-suggestions/${open.id}/decisions`, {
  method: "POST",
  body: JSON.stringify({ decision: "DISMISS" }),
});
if (missingReason.response.status !== 400 || errorCode(missingReason.data) !== "DISMISS_REASON_REQUIRED") {
  throw new Error(`Expected 400 DISMISS_REASON_REQUIRED, got ${missingReason.response.status} ${missingReason.text}`);
}

const decision = await ok(`/api/v1/learning-signal-suggestions/${open.id}/decisions`, {
  method: "POST",
  body: JSON.stringify({ decision: "ACCEPT", intended_next_action: "USE_IN_NEXT_PROMPT_DRAFT" }),
});
if (decision.previous_state !== "SUGGESTED" || decision.new_state !== "ACCEPTED") {
  throw new Error(`Expected SUGGESTED -> ACCEPTED, got ${decision.previous_state} -> ${decision.new_state}`);
}
const guard = decision.decision_audit_note.mutation_guard;
if (Object.values(guard).some((flag) => flag !== false)) {
  throw new Error("Mutation guard must have all flags false.");
}
result.apiChecks.push({ name: "accept-decision", new_state: decision.new_state, mutation_guard: guard });

const conflict = await requestJson(`/api/v1/learning-signal-suggestions/${open.id}/decisions`, {
  method: "POST",
  body: JSON.stringify({ decision: "ACCEPT" }),
});
if (conflict.response.status !== 409 || errorCode(conflict.data) !== "PROMPT_SUGGESTION_DECISION_CONFLICT") {
  throw new Error(`Expected 409 PROMPT_SUGGESTION_DECISION_CONFLICT, got ${conflict.response.status} ${conflict.text}`);
}
result.apiChecks.push({ name: "conflict", status: conflict.response.status, code: errorCode(conflict.data) });

if (superseded) {
  const supersededConflict = await requestJson(`/api/v1/learning-signal-suggestions/${superseded.id}/decisions`, {
    method: "POST",
    body: JSON.stringify({ decision: "ACCEPT" }),
  });
  if (supersededConflict.response.status !== 409) {
    throw new Error("Superseded suggestion must conflict on decision command.");
  }
}

// ---- 3. Drive the actual UI against this project. ----
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  const path = `/projects/${project.id}/learning-insights`;
  const response = await page.goto(`${frontendBaseUrl}${path}`, { waitUntil: "networkidle" });
  if (!response?.ok()) {
    throw new Error(`Route ${path} failed: ${response?.status() ?? "no response"}`);
  }
  await page.getByRole("heading", { name: "Learning Insights" }).waitFor();
  await page.getByText("MVP6.2", { exact: true }).waitFor();
  await page.getByText("RELATION_DIRECTION_CORRECTION", { exact: true }).first().waitFor();
  await screenshot(page, "learning-insights-actual-summary");

  // Correction-pattern render: the affected class/relation labels only display if the renamed
  // nested fields (ontology_class_id / ontology_relation_id) deserialize from the backend.
  await page.getByRole("tab", { name: "Correction Patterns" }).click();
  await page.getByText(firstPattern.title, { exact: true }).first().waitFor();
  await page.getByText("Affected classes", { exact: true }).first().waitFor();
  await page.getByText("Affected relations", { exact: true }).first().waitFor();
  await page.getByText(affectedClass.label, { exact: false }).first().waitFor();
  await page.getByText(affectedRelation.label, { exact: false }).first().waitFor();
  await screenshot(page, "learning-insights-actual-patterns");
  result.apiChecks.push({ name: "patterns-render", affected_class_label: affectedClass.label, affected_relation_label: affectedRelation.label });

  await page.getByRole("tab", { name: "Prompt Improvements" }).click();
  // The accepted suggestion should now show its result state ACCEPTED.
  await page.getByText("ACCEPTED", { exact: true }).first().waitFor();
  await screenshot(page, "learning-insights-actual-suggestions");

  await page.getByRole("tab", { name: "Decision History" }).click();
  await screenshot(page, "learning-insights-actual-history");

  result.routes.push({ name: "learning-insights-actual", path, status: response.status() });
} finally {
  await browser.close();
}

const artifactPath = join(artifactDir, "mvp6-learning-actual-api-smoke.json");
await writeFile(artifactPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ status: "PASS", artifactPath, apiCheckCount: result.apiChecks.length, routeCount: result.routes.length, ids: result.ids }, null, 2));
