import { describe, expect, it } from "vitest";
import { apiClient, OntologyPackError } from "./client";
import { PACK_NO_DRAFT_PROJECT_ID } from "../mocks/mvp6OntologyPacksFixtures";
import type { OntologyPackMutationGuard, PackApplyPreviewResponse } from "./types";

// MVP6.11 Ontology Packs mock contract. READ-ONLY catalog + deterministic DRY-RUN
// apply-preview. Installs NOTHING, applies NOTHING, writes NOTHING. Every response
// carries an ALL-FALSE 8-flag OntologyPackMutationGuard. The apply-preview is
// deterministic (byte-stable excluding generated_at + preview_id) + bounded and
// creates nothing. Field/enum shapes match docs/api/openapi-mvp6-11-draft.json.

const PROJECT = "proj-packs-demo";

const GUARD_KEYS = [
  "pack_installed",
  "ontology_draft_mutated",
  "ontology_class_created",
  "ontology_property_created",
  "ontology_relation_created",
  "candidate_graph_mutated",
  "published_graph_mutated",
  "change_request_created",
] as const;

function expectGuardAllFalse(guard: OntologyPackMutationGuard) {
  expect(Object.keys(guard)).toHaveLength(8);
  for (const key of GUARD_KEYS) {
    expect(guard[key]).toBe(false);
  }
}

/** Strip the only fields allowed to vary between two identical previews (G7/G1). */
function stableClone(preview: PackApplyPreviewResponse) {
  const { generated_at: _g, preview_id: _p, ...rest } = preview;
  void _g;
  void _p;
  return rest;
}

describe("MVP6.11 Ontology Packs mock contract", () => {
  it("lists exactly the 3 frozen mock packs with an all-false guard", async () => {
    const catalog = await apiClient.getOntologyPackCatalog();
    expect(catalog.total_count).toBe(3);
    expect(catalog.items).toHaveLength(3);
    const ids = catalog.items.map((i) => i.pack_id);
    expect(ids).toEqual(["pack-insurance-core", "pack-manufacturing-equipment", "pack-legal-compliance"]);
    for (const item of catalog.items) {
      expect(item.mock).toBe(true);
      const c = item.element_counts;
      expect(c.element_count).toBe(c.class_count + c.property_count + c.relation_count);
    }
    // Frozen counts (PM6-036 matrix).
    expect(catalog.items[0].element_counts).toMatchObject({ class_count: 4, property_count: 3, relation_count: 2, element_count: 9 });
    expect(catalog.items[1].element_counts).toMatchObject({ class_count: 4, property_count: 3, relation_count: 2, element_count: 9 });
    expect(catalog.items[2].element_counts).toMatchObject({ class_count: 4, property_count: 2, relation_count: 2, element_count: 8 });
    expectGuardAllFalse(catalog.mutation_guard);
  });

  it("returns pack detail with ordered bundled elements + all-false guard", async () => {
    const detail = await apiClient.getOntologyPackDetail("pack-manufacturing-equipment");
    expect(detail.pack_id).toBe("pack-manufacturing-equipment");
    expect(detail.elements).toHaveLength(9);
    const kinds = detail.elements.map((e) => e.element_kind);
    // Ordered CLASS -> PROPERTY -> RELATION.
    expect(kinds).toEqual(["CLASS", "CLASS", "CLASS", "CLASS", "PROPERTY", "PROPERTY", "PROPERTY", "RELATION", "RELATION"]);
    expectGuardAllFalse(detail.mutation_guard);
  });

  it("404s an unknown pack (detail + apply-preview)", async () => {
    await expect(apiClient.getOntologyPackDetail("pack-nope")).rejects.toMatchObject({
      code: "ONTOLOGY_PACK_NOT_FOUND",
      status: 404,
    });
    await expect(apiClient.runOntologyPackApplyPreview(PROJECT, "pack-nope")).rejects.toBeInstanceOf(OntologyPackError);
  });

  it("COMPATIBLE (all NEW) for the insurance pack, byte-stable excl. generated_at", async () => {
    const first = await apiClient.runOntologyPackApplyPreview(PROJECT, "pack-insurance-core");
    const second = await apiClient.runOntologyPackApplyPreview(PROJECT, "pack-insurance-core");
    expect(first.status).toBe("READY");
    expect(first.compatibility).toBe("COMPATIBLE");
    expect(first.preview_only).toBe(true);
    expect(first.preview_id).toBeNull();
    expect(first.target_layer).toBe("DRAFT");
    expect(first.summary).toMatchObject({ would_add_count: 9, would_modify_count: 0, conflict_count: 0, duplicate_count: 0, total_element_count: 9 });
    expect(first.warnings).toHaveLength(0);
    expect(first.blocked_reasons).toHaveLength(0);
    // Every NEW item: mapped_ontology_ref null, target_layer DRAFT, preview_ref opaque.
    for (const item of first.items) {
      expect(item.disposition).toBe("NEW");
      expect(item.target_layer).toBe("DRAFT");
      expect(item.mapped_ontology_ref ?? null).toBeNull();
      expect(item.preview_ref).toMatch(/^prev_/);
    }
    expect(JSON.stringify(stableClone(first))).toBe(JSON.stringify(stableClone(second)));
    expectGuardAllFalse(first.mutation_guard);
  });

  it("WARNING with all 3 dispositions for the manufacturing pack", async () => {
    const preview = await apiClient.runOntologyPackApplyPreview(PROJECT, "pack-manufacturing-equipment");
    expect(preview.status).toBe("READY");
    expect(preview.compatibility).toBe("WARNING");
    // 6 NEW + 1 CONFLICT (mfg.sensor) + 2 DUPLICATE (mfg.equipment, serial_no).
    expect(preview.summary).toMatchObject({ would_add_count: 6, would_modify_count: 1, conflict_count: 1, duplicate_count: 2, total_element_count: 9 });
    const dispositions = preview.items.map((i) => i.disposition).sort();
    expect(dispositions.filter((d) => d === "NEW")).toHaveLength(6);
    expect(dispositions.filter((d) => d === "CONFLICT")).toHaveLength(1);
    expect(dispositions.filter((d) => d === "DUPLICATE")).toHaveLength(2);
    // Warnings carry the frozen codes.
    const codes = preview.warnings.map((w) => w.code);
    expect(codes).toContain("NAME_CONFLICT_DIFFERENT_DEFINITION");
    expect(codes).toContain("EXISTING_DUPLICATE_ELEMENT");
    // CONFLICT / DUPLICATE items carry a non-null mapped_ontology_ref + existing label.
    const conflict = preview.items.find((i) => i.disposition === "CONFLICT");
    expect(conflict?.mapped_ontology_ref?.ontology_version_id).toBeTruthy();
    expect(conflict?.mapped_ontology_ref?.status).toBe("DRAFT");
    expect(conflict?.existing_element_label).toBeTruthy();
    expectGuardAllFalse(preview.mutation_guard);
  });

  it("BLOCKED / INCOMPATIBLE (not crash) for a project with no DRAFT ontology; zero fabricated items", async () => {
    const preview = await apiClient.runOntologyPackApplyPreview(PACK_NO_DRAFT_PROJECT_ID, "pack-insurance-core");
    expect(preview.status).toBe("BLOCKED");
    expect(preview.compatibility).toBe("INCOMPATIBLE");
    expect(preview.items).toHaveLength(0);
    expect(preview.total_item_count).toBe(0);
    expect(preview.summary.total_element_count).toBe(0);
    expect(preview.blocked_reasons.map((b) => b.code)).toContain("NO_DRAFT_ONTOLOGY");
    expect(preview.warnings).toHaveLength(0);
    // BLOCKED still applied / mutated nothing.
    expect(preview.preview_only).toBe(true);
    expectGuardAllFalse(preview.mutation_guard);
  });

  it("caps items but keeps counts exact when item_cap < total", async () => {
    const preview = await apiClient.runOntologyPackApplyPreview(PROJECT, "pack-insurance-core", { item_cap: 3 });
    expect(preview.item_cap).toBe(3);
    expect(preview.truncated).toBe(true);
    expect(preview.items).toHaveLength(3);
    // Counts stay exact regardless of the cap.
    expect(preview.total_item_count).toBe(9);
    expect(preview.summary.total_element_count).toBe(9);
  });

  it("carries the constant routing_note on every preview", async () => {
    const preview = await apiClient.runOntologyPackApplyPreview(PROJECT, "pack-legal-compliance");
    expect(preview.routing_note).toContain("preview only");
    expect(preview.routing_note).toContain("MVP1 ontology-edit / MVP6.6 governance-application");
    expect(preview.compatibility).toBe("COMPATIBLE");
    expect(preview.summary.total_element_count).toBe(8);
  });
});
