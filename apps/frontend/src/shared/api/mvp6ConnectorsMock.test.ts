import { describe, expect, it } from "vitest";
import { apiClient, ConnectorError } from "./client";
import { MVP6_CONNECTORS_PROJECT_ID } from "../mocks/mvp6ConnectorsFixtures";
import type { ConnectorImportPreviewResponse, ConnectorKind, ConnectorMutationGuard } from "./types";

// MVP6.9 Connectors mock contract. READ-ONLY catalog + deterministic DRY-RUN
// import preview. Connects to NOTHING, imports NOTHING, writes NOTHING. Every
// response carries an ALL-FALSE 9-flag ConnectorMutationGuard; raw_secret_present
// is always false. The preview is deterministic (byte-stable excluding
// generated_at) + secret-independent + bounded. Field/enum shapes match
// docs/api/openapi-mvp6-9-draft.json.

const P = MVP6_CONNECTORS_PROJECT_ID;

const GUARD_KEYS = [
  "external_system_read",
  "external_system_write",
  "real_network_call_made",
  "credential_persisted",
  "connector_instance_persisted",
  "source_created",
  "candidate_graph_mutated",
  "published_graph_mutated",
  "extraction_job_started",
] as const;

function expectGuardAllFalse(guard: ConnectorMutationGuard) {
  expect(Object.keys(guard)).toHaveLength(9);
  for (const key of GUARD_KEYS) {
    expect(guard[key]).toBe(false);
  }
}

/** Strip the only fields allowed to vary between two identical previews (G7/G1). */
function stableClone(preview: ConnectorImportPreviewResponse) {
  const { generated_at: _g, preview_id: _p, ...rest } = preview;
  void _g;
  void _p;
  return rest;
}

describe("MVP6.9 Connectors mock contract", () => {
  it("lists exactly the 3 frozen mock kinds with an all-false guard", async () => {
    const catalog = await apiClient.getConnectorCatalog(P);
    expect(catalog.project_id).toBe(P);
    expect(catalog.total_count).toBe(3);
    expect(catalog.items).toHaveLength(3);
    const kinds = catalog.items.map((i) => i.connector_kind);
    expect(kinds).toEqual(["FILE_SOURCE", "REST_SOURCE", "KNOWLEDGE_BASE_SOURCE"]);
    for (const item of catalog.items) {
      expect(item.mock).toBe(true);
      expect(item.target_layer).toBe("CANDIDATE");
      expect(item.config_field_count).toBeGreaterThan(0);
    }
    expectGuardAllFalse(catalog.mutation_guard);
  });

  it("returns an ordered masked config schema (raw_secret_present=false)", async () => {
    const schema = await apiClient.getConnectorConfigSchema(P, "REST_SOURCE");
    expect(schema.connector_kind).toBe("REST_SOURCE");
    expect(schema.raw_secret_present).toBe(false);
    expect(schema.fields.length).toBeGreaterThan(0);
    const secretField = schema.fields.find((f) => f.field_kind === "SECRET");
    expect(secretField).toBeDefined();
    // SECRET field carries a NON-SECRET placeholder only; secret=true.
    expect(secretField?.secret).toBe(true);
    expect(secretField?.placeholder).toBe("SECRET_PLACEHOLDER_NOT_A_REAL_SECRET");
    expectGuardAllFalse(schema.mutation_guard);
  });

  it("404s an unknown connector kind", async () => {
    await expect(
      apiClient.getConnectorConfigSchema(P, "NOT_A_KIND" as ConnectorKind),
    ).rejects.toMatchObject({ code: "CONNECTOR_KIND_NOT_FOUND", status: 404 });
    await expect(
      apiClient.runConnectorImportPreview(P, "NOT_A_KIND" as ConnectorKind, { config: {} }),
    ).rejects.toBeInstanceOf(ConnectorError);
  });

  it("runs a deterministic, byte-stable (excl. generated_at) READY preview", async () => {
    const config = { file_path: "/data/records.csv", format: "CSV", has_header: true };
    const first = await apiClient.runConnectorImportPreview(P, "FILE_SOURCE", { config });
    const second = await apiClient.runConnectorImportPreview(P, "FILE_SOURCE", { config });
    expect(first.status).toBe("READY");
    expect(first.compatibility).toBe("COMPATIBLE");
    expect(first.preview_only).toBe(true);
    expect(first.preview_id).toBeNull();
    expect(first.target_layer).toBe("CANDIDATE");
    expect(first.raw_secret_present).toBe(false);
    expect(first.summary.source_record_count).toBe(6);
    expect(first.total_item_count).toBe(6);
    expect(first.sample_items).toHaveLength(6);
    expect(first.blocked_reasons).toHaveLength(0);
    // Byte-stable excluding generated_at + preview_id.
    expect(JSON.stringify(stableClone(first))).toBe(JSON.stringify(stableClone(second)));
    expectGuardAllFalse(first.mutation_guard);
    // Every item is a WOULD-BE candidate; preview_ref is opaque (not a candidate id).
    for (const item of first.sample_items) {
      expect(item.target_layer).toBe("CANDIDATE");
      expect(item.preview_ref).toMatch(/^prev_/);
    }
  });

  it("is secret-independent: the api_key value never changes the result", async () => {
    const base = { base_url: "https://example.invalid/api", resource_path: "/v1/items" };
    const withoutSecret = await apiClient.runConnectorImportPreview(P, "REST_SOURCE", { config: { ...base } });
    const withSecret = await apiClient.runConnectorImportPreview(P, "REST_SOURCE", {
      config: { ...base, api_key: "DIFFERENT_PLACEHOLDER" },
    });
    expect(JSON.stringify(stableClone(withoutSecret))).toBe(JSON.stringify(stableClone(withSecret)));
  });

  it("REST_SOURCE returns WARNING with >=1 unmapped item + a notice", async () => {
    const preview = await apiClient.runConnectorImportPreview(P, "REST_SOURCE", {
      config: { base_url: "https://example.invalid/api", resource_path: "/v1/items" },
    });
    expect(preview.status).toBe("READY");
    expect(preview.compatibility).toBe("WARNING");
    expect(preview.summary.source_record_count).toBe(5);
    expect(preview.summary.unmapped_record_count).toBeGreaterThanOrEqual(1);
    expect(preview.warnings.length).toBeGreaterThanOrEqual(1);
    expect(preview.warnings[0].code).toBe("UNMAPPED_FIELDS");
    const unmapped = preview.sample_items.find((i) => i.mapped_ontology_class_ref == null);
    expect(unmapped).toBeDefined();
  });

  it("caps sample_items but keeps counts exact when item_cap < total", async () => {
    const preview = await apiClient.runConnectorImportPreview(P, "FILE_SOURCE", {
      config: { file_path: "/data/records.csv", format: "CSV" },
      item_cap: 2,
    });
    expect(preview.item_cap).toBe(2);
    expect(preview.truncated).toBe(true);
    expect(preview.sample_items).toHaveLength(2);
    // Counts stay exact regardless of the cap.
    expect(preview.total_item_count).toBe(6);
    expect(preview.summary.source_record_count).toBe(6);
  });

  it("BLOCKED (not crash) for a missing required non-secret field; zero fabricated items", async () => {
    const preview = await apiClient.runConnectorImportPreview(P, "REST_SOURCE", {
      config: { base_url: "" }, // required base_url + resource_path missing
    });
    expect(preview.status).toBe("BLOCKED");
    expect(preview.compatibility).toBe("INCOMPATIBLE");
    expect(preview.sample_items).toHaveLength(0);
    expect(preview.total_item_count).toBe(0);
    expect(preview.blocked_reasons.length).toBeGreaterThanOrEqual(1);
    expect(preview.blocked_reasons[0].code).toBe("MISSING_REQUIRED_FIELD");
    // BLOCKED still mutated nothing.
    expectGuardAllFalse(preview.mutation_guard);
    expect(preview.preview_only).toBe(true);
    expect(preview.raw_secret_present).toBe(false);
  });

  it("BLOCKED for an invalid URL config value", async () => {
    const preview = await apiClient.runConnectorImportPreview(P, "REST_SOURCE", {
      config: { base_url: "not-a-url", resource_path: "/v1/items" },
    });
    expect(preview.status).toBe("BLOCKED");
    expect(preview.blocked_reasons.some((b) => b.code === "INVALID_CONFIG_VALUE")).toBe(true);
  });

  it("carries the constant routing_note on every preview", async () => {
    const preview = await apiClient.runConnectorImportPreview(P, "KNOWLEDGE_BASE_SOURCE", {
      config: { workspace_url: "https://example.invalid/kb", space_key: "KB" },
    });
    expect(preview.routing_note).toContain("preview only");
    expect(preview.routing_note).toContain("extraction -> candidate -> review -> publish");
    expect(preview.compatibility).toBe("COMPATIBLE");
    expect(preview.summary.source_record_count).toBe(4);
  });
});
