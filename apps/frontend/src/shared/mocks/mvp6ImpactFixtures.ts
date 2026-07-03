import {
  ImpactSimulationMutationGuard,
  ImpactSimulationReport,
  OntologyElementRef,
} from "../api/types";
import {
  MVP6_GOVERNANCE_APPROVED_ID,
  MVP6_GOVERNANCE_IN_REVIEW_ID,
  MVP6_GOVERNANCE_OPEN_ID,
  MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
  MVP6_GOVERNANCE_PROJECT_ID,
} from "./mvp6GovernanceFixtures";

// Deterministic MVP6.7 Impact Simulation fixtures. Read-only impact reports keyed
// by change-request id. Field/enum names match docs/api/openapi-mvp6-7-draft.json
// EXACTLY. Every report carries an ALL-FALSE ImpactSimulationMutationGuard (no flag
// ever true). Reports are byte-stable and mutate NOTHING. The fixtures exercise the
// full severity ladder + truncation + empty(NONE) cases:
//   - APPROVED (MODIFY on a property with published dependents) -> BREAKING + truncation
//   - IN_REVIEW (DEPRECATE on a class with candidate dependents) -> HIGH
//   - OPEN (ADD of a new property, no dependents) -> NONE (benign empty)

/** The default per-dimension ref cap (PM6-028 G2 froze default 50 -> 20). */
export const MVP6_IMPACT_REF_CAP = 20;

export const allFalseImpactGuard: ImpactSimulationMutationGuard = {
  ontology_draft_mutated: false,
  published_graph_mutated: false,
  candidate_graph_mutated: false,
  prompt_version_mutated: false,
  governance_state_mutated: false,
  publish_job_started: false,
  extraction_job_started: false,
  evaluation_run_started: false,
};

const V = MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID;

function classRef(id: string, status: OntologyElementRef["status"] = "ACTIVE"): OntologyElementRef {
  return { target_kind: "CLASS", ontology_class_id: id, ontology_version_id: V, status };
}
function propRef(id: string, status: OntologyElementRef["status"] = "ACTIVE"): OntologyElementRef {
  return { target_kind: "PROPERTY", ontology_property_id: id, ontology_version_id: V, status };
}
function relRef(id: string, status: OntologyElementRef["status"] = "ACTIVE"): OntologyElementRef {
  return { target_kind: "RELATION", ontology_relation_id: id, ontology_version_id: V, status };
}

/** Build a capped bucket from an exact count + a full ref list (caps at MVP6_IMPACT_REF_CAP). */
function bucket(count: number, allRefs: OntologyElementRef[], refCap = MVP6_IMPACT_REF_CAP) {
  const refs = allRefs.slice(0, refCap);
  return { count, refs, truncated: count > refs.length };
}

/** A deterministic list of N synthetic candidate refs against a class (for the truncation demo). */
function syntheticClassRefs(prefix: string, n: number): OntologyElementRef[] {
  return Array.from({ length: n }, (_, i) => classRef(`${prefix}-${String(i + 1).padStart(3, "0")}`));
}

// --- APPROVED: MODIFY a property that has DEPENDENT PUBLISHED elements -> BREAKING + truncation ---
const approvedReport: ImpactSimulationReport = {
  impact_report_id: null,
  change_request_id: MVP6_GOVERNANCE_APPROVED_ID,
  project_id: MVP6_GOVERNANCE_PROJECT_ID,
  change_request_status: "APPROVED",
  analyzed_ontology_version_id: V,
  analyzed_ontology_version_status: "DRAFT",
  items: [
    {
      change_item_id: "item-approved-1",
      target_kind: "PROPERTY",
      change_type: "MODIFY",
      target_ref: propRef("property-address"),
      affected_ontology_elements: [
        { element_ref: propRef("property-address"), relation_to_target: "DIRECT_TARGET", depth: 0, display_name: "주소 (Address)" },
        { element_ref: classRef("class-customer"), relation_to_target: "PROPERTY_OF_CLASS", depth: 1, display_name: "고객 (Customer)" },
        { element_ref: classRef("class-branch"), relation_to_target: "PROPERTY_OF_CLASS", depth: 1, display_name: "지점 (Branch)" },
      ],
      // 128 dependent candidate rows referencing the affected class -> truncated to 20.
      dependent_candidates: bucket(128, syntheticClassRefs("cand-customer", 40)),
      // 4 published elements -> BREAKING driver, not truncated.
      dependent_published: bucket(4, [
        classRef("pub-class-customer"),
        classRef("pub-class-branch"),
        propRef("pub-prop-address-norm"),
        relRef("pub-rel-customer-branch"),
      ]),
      affected_validations: [
        { rule_code: "REQUIRED_PROPERTY", severity: "FAILED" },
        { rule_code: "DATATYPE", severity: "WARNING" },
      ],
      affected_quality_groups: ["CONSISTENCY", "COMPLETENESS"],
      severity: "BREAKING",
      severity_reason: "DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS",
    },
  ],
  summary: {
    max_severity: "BREAKING",
    severity_counts: { NONE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, BREAKING: 1 },
    total_change_items: 1,
    total_affected_ontology_elements: 3,
    total_dependent_candidates: 128,
    total_dependent_published: 4,
    affected_validation_rule_codes: ["REQUIRED_PROPERTY", "DATATYPE"],
    affected_quality_groups: ["CONSISTENCY", "COMPLETENESS"],
  },
  bounding: { max_dependent_depth: 2, ref_cap: MVP6_IMPACT_REF_CAP, any_dimension_truncated: true },
  capabilities: { can_view: true, can_apply: true, actor_role: "ONTOLOGY_MANAGER" },
  mutation_guard: { ...allFalseImpactGuard },
  computed_at: "2026-07-03T02:00:00.000Z",
};

// --- IN_REVIEW: DEPRECATE a class with DEPENDENT CANDIDATE elements (no published) -> HIGH ---
const inReviewReport: ImpactSimulationReport = {
  impact_report_id: null,
  change_request_id: MVP6_GOVERNANCE_IN_REVIEW_ID,
  project_id: MVP6_GOVERNANCE_PROJECT_ID,
  change_request_status: "IN_REVIEW",
  analyzed_ontology_version_id: V,
  analyzed_ontology_version_status: "DRAFT",
  items: [
    {
      change_item_id: "item-inreview-1",
      target_kind: "CLASS",
      change_type: "DEPRECATE",
      target_ref: classRef("class-legacy-account"),
      affected_ontology_elements: [
        { element_ref: classRef("class-legacy-account"), relation_to_target: "DIRECT_TARGET", depth: 0, display_name: "레거시 계정 (LegacyAccount)" },
        { element_ref: propRef("property-legacy-code"), relation_to_target: "PROPERTY_OF_CLASS", depth: 1, display_name: "레거시 코드" },
        { element_ref: relRef("relation-legacy-owner"), relation_to_target: "RELATION_DOMAIN", depth: 1, display_name: "소유 관계" },
      ],
      dependent_candidates: bucket(12, syntheticClassRefs("cand-legacy", 12)),
      dependent_published: bucket(0, []),
      affected_validations: [{ rule_code: "ORPHAN_NODE", severity: "WARNING" }],
      affected_quality_groups: ["TRACEABILITY"],
      severity: "HIGH",
      severity_reason: "DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS",
    },
  ],
  summary: {
    max_severity: "HIGH",
    severity_counts: { NONE: 0, LOW: 0, MEDIUM: 0, HIGH: 1, BREAKING: 0 },
    total_change_items: 1,
    total_affected_ontology_elements: 3,
    total_dependent_candidates: 12,
    total_dependent_published: 0,
    affected_validation_rule_codes: ["ORPHAN_NODE"],
    affected_quality_groups: ["TRACEABILITY"],
  },
  bounding: { max_dependent_depth: 2, ref_cap: MVP6_IMPACT_REF_CAP, any_dimension_truncated: false },
  capabilities: { can_view: true, can_apply: false, actor_role: "REVIEWER" },
  mutation_guard: { ...allFalseImpactGuard },
  computed_at: "2026-07-03T02:00:00.000Z",
};

// --- OPEN: ADD of a new property with NO existing dependents -> NONE (benign empty) ---
const openReport: ImpactSimulationReport = {
  impact_report_id: null,
  change_request_id: MVP6_GOVERNANCE_OPEN_ID,
  project_id: MVP6_GOVERNANCE_PROJECT_ID,
  change_request_status: "OPEN",
  analyzed_ontology_version_id: V,
  analyzed_ontology_version_status: "DRAFT",
  items: [
    {
      change_item_id: "item-open-1",
      target_kind: "PROPERTY",
      change_type: "ADD",
      target_ref: propRef("property-risk-tier", "DRAFT"),
      affected_ontology_elements: [
        { element_ref: propRef("property-risk-tier", "DRAFT"), relation_to_target: "DIRECT_TARGET", depth: 0, display_name: "위험등급 (risk_tier)" },
      ],
      dependent_candidates: bucket(0, []),
      dependent_published: bucket(0, []),
      affected_validations: [],
      affected_quality_groups: [],
      severity: "NONE",
      severity_reason: "ADD_NEW_ELEMENT_NO_DEPENDENTS",
    },
    {
      change_item_id: "item-open-2",
      target_kind: "CLASS",
      change_type: "MODIFY",
      target_ref: classRef("class-customer"),
      affected_ontology_elements: [
        { element_ref: classRef("class-customer"), relation_to_target: "DIRECT_TARGET", depth: 0, display_name: "고객 (Customer)" },
      ],
      dependent_candidates: bucket(0, []),
      dependent_published: bucket(0, []),
      affected_validations: [],
      affected_quality_groups: [],
      severity: "LOW",
      severity_reason: "DIRECT_ELEMENT_ONLY",
    },
  ],
  summary: {
    max_severity: "LOW",
    severity_counts: { NONE: 1, LOW: 1, MEDIUM: 0, HIGH: 0, BREAKING: 0 },
    total_change_items: 2,
    total_affected_ontology_elements: 2,
    total_dependent_candidates: 0,
    total_dependent_published: 0,
    affected_validation_rule_codes: [],
    affected_quality_groups: [],
  },
  bounding: { max_dependent_depth: 2, ref_cap: MVP6_IMPACT_REF_CAP, any_dimension_truncated: false },
  capabilities: { can_view: true, can_apply: false, actor_role: "ONTOLOGY_MANAGER" },
  mutation_guard: { ...allFalseImpactGuard },
  computed_at: "2026-07-03T02:00:00.000Z",
};

/** Impact reports keyed by change-request id. A missing id falls back to a benign NONE report. */
export const mockImpactReports: Record<string, ImpactSimulationReport> = {
  [MVP6_GOVERNANCE_APPROVED_ID]: approvedReport,
  [MVP6_GOVERNANCE_IN_REVIEW_ID]: inReviewReport,
  [MVP6_GOVERNANCE_OPEN_ID]: openReport,
};

/** A benign NONE report for any change request without a bespoke fixture (empty items). */
export function buildEmptyImpactReport(
  changeRequestId: string,
  projectId: string,
  status?: string | null,
): ImpactSimulationReport {
  return {
    impact_report_id: null,
    change_request_id: changeRequestId,
    project_id: projectId,
    change_request_status: status ?? null,
    analyzed_ontology_version_id: V,
    analyzed_ontology_version_status: "DRAFT",
    items: [],
    summary: {
      max_severity: "NONE",
      severity_counts: { NONE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, BREAKING: 0 },
      total_change_items: 0,
      total_affected_ontology_elements: 0,
      total_dependent_candidates: 0,
      total_dependent_published: 0,
      affected_validation_rule_codes: [],
      affected_quality_groups: [],
    },
    bounding: { max_dependent_depth: 2, ref_cap: MVP6_IMPACT_REF_CAP, any_dimension_truncated: false },
    capabilities: { can_view: true, can_apply: false, actor_role: "VIEWER" },
    mutation_guard: { ...allFalseImpactGuard },
    computed_at: "2026-07-03T02:00:00.000Z",
  };
}
