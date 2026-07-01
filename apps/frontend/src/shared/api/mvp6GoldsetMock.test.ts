import { describe, expect, it } from "vitest";
import { apiClient, GoldAuthoringError } from "./client";
import {
  MVP6_GOLDSET_ACTIVE_REVISION_ID,
  MVP6_GOLDSET_DATASET_ID,
  MVP6_GOLDSET_FROZEN_REVISION_ID,
  MVP6_GOLDSET_IMPORT_INCOMPATIBLE_ID,
  MVP6_GOLDSET_OWNER_ID,
  MVP6_GOLDSET_PINNED_RUN_ID,
  MVP6_GOLDSET_PROJECT_ID,
} from "../mocks/mvp6GoldsetFixtures";
import type { GoldAuthoringMutationGuard } from "./types";

const ALL_FALSE_GUARD: GoldAuthoringMutationGuard = {
  published_graph_mutated: false,
  candidate_graph_mutated: false,
  prompt_version_mutated: false,
  ontology_definition_mutated: false,
  extraction_job_started: false,
  evaluation_run_started: false,
  prior_run_pin_rewritten: false,
};

describe("MVP6.4 Gold Set authoring mock contract", () => {
  it("opens a dataset for authoring with owner capabilities, an ACTIVE revision, and an all-false mutation guard", async () => {
    const overview = await apiClient.getDatasetAuthoringOverview(
      MVP6_GOLDSET_PROJECT_ID,
      MVP6_GOLDSET_DATASET_ID,
    );
    expect(overview.dataset.id).toBe(MVP6_GOLDSET_DATASET_ID);
    expect(overview.capabilities.can_edit_gold_item).toBe(true);
    expect(overview.capabilities.can_cut_revision).toBe(true);
    expect(overview.active_revision?.status).toBe("ACTIVE");
    expect(overview.active_revision?.is_immutable).toBe(false);
    expect(overview.mutation_guard).toEqual(ALL_FALSE_GUARD);
  });

  it("makes reproducibility visible: a run pins the FROZEN revision and the pin is immutable", async () => {
    const overview = await apiClient.getDatasetAuthoringOverview(
      MVP6_GOLDSET_PROJECT_ID,
      MVP6_GOLDSET_DATASET_ID,
    );
    const pin = overview.pinned_runs.find((p) => p.run_id === MVP6_GOLDSET_PINNED_RUN_ID);
    expect(pin?.dataset_version_id).toBe(MVP6_GOLDSET_FROZEN_REVISION_ID);
    expect(pin?.revision_status).toBe("FROZEN");
    expect(pin?.pin_immutable).toBe(true);
  });

  it("edits a gold entity without mutating published/candidate/run state", async () => {
    const result = await apiClient.editGoldEntity(MVP6_GOLDSET_DATASET_ID, "gold-entity-policy", {
      normalized_value: "information security policy (reviewed)",
      reason: "expert re-review",
    });
    expect(result.gold_entity.normalized_value).toBe("information security policy (reviewed)");
    expect(result.audit_entry.action).toBe("EDIT");
    expect(result.mutation_guard).toEqual(ALL_FALSE_GUARD);
    expect(result.mutation_guard.prior_run_pin_rewritten).toBe(false);
  });

  it("archives a gold entity softly (status ARCHIVED, never deleted)", async () => {
    const result = await apiClient.archiveGoldEntity(MVP6_GOLDSET_DATASET_ID, "gold-entity-policy", {
      reason: "stale gold item retired",
    });
    expect(result.gold_entity.status).toBe("ARCHIVED");
    expect(result.gold_entity.archived_at).toBeTruthy();
    expect(result.audit_entry.action).toBe("ARCHIVE");
  });

  it("404s editing an unknown gold entity", async () => {
    await expect(
      apiClient.editGoldEntity(MVP6_GOLDSET_DATASET_ID, "gold-entity-does-not-exist", {
        reason: "x",
      }),
    ).rejects.toMatchObject({ code: "GOLD_ITEM_NOT_FOUND" });
  });

  it("enforces XOR target on standalone gold-evidence attach", async () => {
    await expect(
      apiClient.attachGoldEvidence(MVP6_GOLDSET_DATASET_ID, {
        gold_entity_id: "gold-entity-policy",
        gold_relation_id: "gold-relation-policy-owner",
        sample_id: "gold-sample-policy",
        locator: "p.1",
      }),
    ).rejects.toMatchObject({ code: "GOLD_EVIDENCE_TARGET_INVALID" });

    const attached = await apiClient.attachGoldEvidence(MVP6_GOLDSET_DATASET_ID, {
      gold_entity_id: "gold-entity-policy",
      sample_id: "gold-sample-policy",
      locator: "p.4/para.1",
      quote: "owner clause",
      reason: "additional standalone evidence",
    });
    expect(attached.gold_evidence.gold_entity_id).toBe("gold-entity-policy");
    expect(attached.gold_evidence.gold_relation_id).toBeNull();
    expect(attached.audit_entry.action).toBe("EVIDENCE_ATTACH");
    expect(attached.mutation_guard).toEqual(ALL_FALSE_GUARD);
  });

  it("cuts a DRAFT revision and freezes the prior ACTIVE only on activate (run-pin never rewritten)", async () => {
    const draft = await apiClient.cutDatasetRevision(MVP6_GOLDSET_DATASET_ID, {
      note: "Q3 snapshot",
      activate: false,
    });
    expect(draft.revision.status).toBe("DRAFT");
    expect(draft.frozen_revision_id).toBeNull();
    expect(draft.mutation_guard.prior_run_pin_rewritten).toBe(false);

    const activated = await apiClient.cutDatasetRevision(MVP6_GOLDSET_DATASET_ID, {
      note: "Q3 activated",
      activate: true,
    });
    expect(activated.revision.status).toBe("ACTIVE");
    expect(activated.frozen_revision_id).toBe(MVP6_GOLDSET_ACTIVE_REVISION_ID);
  });

  it("blocks activating a non-DRAFT (FROZEN) revision with 409 REVISION_NOT_DRAFT", async () => {
    await expect(
      apiClient.activateDatasetRevision(MVP6_GOLDSET_FROZEN_REVISION_ID),
    ).rejects.toBeInstanceOf(GoldAuthoringError);
    await expect(
      apiClient.activateDatasetRevision(MVP6_GOLDSET_FROZEN_REVISION_ID),
    ).rejects.toMatchObject({ code: "REVISION_NOT_DRAFT" });
  });

  it("exports a read-only bundle for a revision with an all-false guard and no published/candidate fields", async () => {
    const bundle = await apiClient.exportDatasetRevision(MVP6_GOLDSET_ACTIVE_REVISION_ID);
    expect(bundle.bundle_version).toBe("gold-set-bundle/1.0");
    expect(bundle.source_revision_id).toBe(MVP6_GOLDSET_ACTIVE_REVISION_ID);
    expect(bundle.mutation_guard).toEqual(ALL_FALSE_GUARD);
    expect(bundle).not.toHaveProperty("candidates");
    expect(bundle).not.toHaveProperty("published_entities");
  });

  it("dry-run import yields all four compatibility states; INCOMPATIBLE is blocking with no strategies", async () => {
    const states = ["COMPATIBLE", "WARNING", "CONFLICT", "INCOMPATIBLE"] as const;
    for (const state of states) {
      const exported = await apiClient.exportDatasetRevision(MVP6_GOLDSET_ACTIVE_REVISION_ID);
      // The mock derives compatibility from the bundle's revision_status hint so
      // every state can be exercised (same mechanism the UI uses).
      const report = await apiClient.dryRunGoldSetImport(MVP6_GOLDSET_PROJECT_ID, {
        bundle: { ...exported, revision_status: state as unknown as typeof exported.revision_status },
      });
      expect(report.compatibility).toBe(state);
      expect(report.mutation_guard).toEqual(ALL_FALSE_GUARD);
      if (state === "INCOMPATIBLE") {
        expect(report.blocking).toBe(true);
        expect(report.allowed_strategies).toHaveLength(0);
      } else {
        expect(report.blocking).toBe(false);
        expect(report.allowed_strategies.length).toBeGreaterThan(0);
      }
    }
  });

  it("confirm always creates a NEW revision (never edits FROZEN) and blocks INCOMPATIBLE", async () => {
    const confirmed = await apiClient.confirmGoldSetImport(
      MVP6_GOLDSET_PROJECT_ID,
      "gold-set-import-compatible-001",
      { strategy: "CREATE_NEW_DATASET", activate: false },
    );
    expect(confirmed.created_revision_id).toBeTruthy();
    expect(confirmed.created_revision_status).toBe("DRAFT");
    expect(confirmed.mutation_guard).toEqual(ALL_FALSE_GUARD);

    await expect(
      apiClient.confirmGoldSetImport(MVP6_GOLDSET_PROJECT_ID, MVP6_GOLDSET_IMPORT_INCOMPATIBLE_ID, {
        strategy: "CREATE_NEW_DATASET",
      }),
    ).rejects.toMatchObject({ code: "IMPORT_INCOMPATIBLE" });
  });

  it("lists revisions, standalone evidence, and an authoring audit trail", async () => {
    const revisions = await apiClient.listDatasetRevisions(MVP6_GOLDSET_DATASET_ID);
    expect(revisions.items.some((r) => r.status === "FROZEN")).toBe(true);
    expect(revisions.items.some((r) => r.status === "ACTIVE")).toBe(true);

    const evidence = await apiClient.listGoldEvidence(MVP6_GOLDSET_DATASET_ID);
    expect(evidence.items.length).toBeGreaterThan(0);

    const audit = await apiClient.listGoldAuthoringAudit(MVP6_GOLDSET_DATASET_ID);
    expect(audit.items.length).toBeGreaterThan(0);
    expect(audit.items[0].actor_id).toBe(MVP6_GOLDSET_OWNER_ID);
  });
});
