import {
  ApplicationCapabilities,
  ApplicationItemPreview,
  GovernanceApplicationAuditEntry,
  GovernanceApplicationBanner,
  GovernanceApplicationMutationGuard,
  GovernanceApplicationState,
  GovernanceAuditEntry,
  GovernanceCapabilities,
  GovernanceMutationGuard,
  GovernanceReviewDecision,
  OntologyChangeItem,
  OntologyChangeRequest,
} from "../api/types";
import { MVP6_PROJECT_ID } from "./mvp6Fixtures";

// Deterministic MVP6.5 Governance fixtures. Additive decision-record surface in
// the candidate/analysis layer. Field/enum names match
// docs/api/openapi-mvp6-5-draft.json EXACTLY. Approval sets application_state=
// QUEUED and applies NOTHING (change_auto_applied=false). APPLIED/SUPERSEDED are
// reserved and are never produced here.

export const MVP6_GOVERNANCE_PROJECT_ID = MVP6_PROJECT_ID;
export const MVP6_GOVERNANCE_PROPOSER_ID = "gov-proposer";
export const MVP6_GOVERNANCE_APPROVER_ID = "gov-approver";
export const MVP6_GOVERNANCE_REVIEWER_ID = "gov-reviewer";
export const MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID = "onto-v6-gov";

// Fixture change-request ids, one per lifecycle state for board grouping.
export const MVP6_GOVERNANCE_OPEN_ID = "ocr-open-001";
export const MVP6_GOVERNANCE_DRAFT_ID = "ocr-draft-002";
export const MVP6_GOVERNANCE_IN_REVIEW_ID = "ocr-in-review-003";
export const MVP6_GOVERNANCE_APPROVED_ID = "ocr-approved-004";
/** MVP6.6: an approved+queued request whose target draft changed since approval (stale-hint fixture). */
export const MVP6_GOVERNANCE_STALE_APPROVED_ID = "ocr-approved-stale-007";
export const MVP6_GOVERNANCE_REJECTED_ID = "ocr-rejected-005";
export const MVP6_GOVERNANCE_WITHDRAWN_ID = "ocr-withdrawn-006";

const NOW = "2026-07-02T09:00:00.000Z";

export const allFalseGovernanceGuard: GovernanceMutationGuard = {
  ontology_definition_mutated: false,
  published_graph_mutated: false,
  candidate_graph_mutated: false,
  prompt_version_mutated: false,
  publish_job_started: false,
  extraction_job_started: false,
  change_auto_applied: false,
};

// Approver (not the proposer): full decision authority + review actions.
export const approverCapabilities: GovernanceCapabilities = {
  can_view: true,
  can_edit_request: false,
  can_submit: false,
  can_withdraw: false,
  can_comment: true,
  can_request_changes: true,
  can_approve: true,
  can_reject: true,
};

// Reviewer (REVIEWER, non-approver role): comment + request changes only.
export const reviewerCapabilities: GovernanceCapabilities = {
  can_view: true,
  can_edit_request: false,
  can_submit: false,
  can_withdraw: false,
  can_comment: true,
  can_request_changes: true,
  can_approve: false,
  can_reject: false,
};

// Non-permitted actor (VIEWER etc.): read-only surface.
export const readOnlyCapabilities: GovernanceCapabilities = {
  can_view: true,
  can_edit_request: false,
  can_submit: false,
  can_withdraw: false,
  can_comment: false,
  can_request_changes: false,
  can_approve: false,
  can_reject: false,
};

function buildRequest(
  overrides: Partial<OntologyChangeRequest> &
    Pick<OntologyChangeRequest, "id" | "title" | "status" | "application_state">,
): OntologyChangeRequest {
  return {
    project_id: MVP6_GOVERNANCE_PROJECT_ID,
    summary: null,
    proposer_id: MVP6_GOVERNANCE_PROPOSER_ID,
    item_count: 1,
    ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
    created_at: NOW,
    updated_at: NOW,
    submitted_at: null,
    decided_at: null,
    decided_by: null,
    decision_reason: null,
    ...overrides,
  };
}

export const mockGovernanceRequests: OntologyChangeRequest[] = [
  buildRequest({
    id: MVP6_GOVERNANCE_OPEN_ID,
    title: "고객 클래스에 위험등급 속성 추가",
    summary: "리스크 스코어링을 위해 Customer 클래스에 risk_tier 속성을 추가하는 제안.",
    status: "OPEN",
    application_state: "NOT_APPLICABLE",
    item_count: 2,
    submitted_at: "2026-07-01T10:00:00.000Z",
  }),
  buildRequest({
    id: MVP6_GOVERNANCE_DRAFT_ID,
    title: "계약 관계 정의 초안",
    summary: "Contract 관계 후보 정의 초안 (아직 제출 전).",
    status: "DRAFT",
    application_state: "NOT_APPLICABLE",
    item_count: 1,
  }),
  buildRequest({
    id: MVP6_GOVERNANCE_IN_REVIEW_ID,
    title: "폐기 예정 Legacy 클래스 정리",
    summary: "사용되지 않는 LegacyAccount 클래스 폐기 제안.",
    status: "IN_REVIEW",
    application_state: "NOT_APPLICABLE",
    item_count: 1,
    submitted_at: "2026-06-30T08:00:00.000Z",
  }),
  buildRequest({
    id: MVP6_GOVERNANCE_APPROVED_ID,
    title: "주소 속성 정규화 규칙 반영",
    summary: "Address 속성 정규화 규칙을 반영하는 변경 요청 (승인·큐잉됨).",
    status: "APPROVED",
    application_state: "QUEUED",
    item_count: 1,
    submitted_at: "2026-06-28T08:00:00.000Z",
    decided_at: "2026-06-29T09:00:00.000Z",
    decided_by: MVP6_GOVERNANCE_APPROVER_ID,
    decision_reason: "정규화 규칙 검토 완료, 큐잉 승인",
  }),
  buildRequest({
    id: MVP6_GOVERNANCE_STALE_APPROVED_ID,
    title: "폐기 대상 관계 정리 (승인·큐잉, 대상 초안 변경됨)",
    summary: "승인 이후 대상 초안이 변경되어 적용 시 대체(SUPERSEDED)될 수 있는 요청.",
    status: "APPROVED",
    application_state: "QUEUED",
    item_count: 1,
    submitted_at: "2026-06-28T08:00:00.000Z",
    decided_at: "2026-06-29T09:00:00.000Z",
    decided_by: MVP6_GOVERNANCE_APPROVER_ID,
    decision_reason: "폐기 정리 검토 완료, 큐잉 승인",
  }),
  buildRequest({
    id: MVP6_GOVERNANCE_REJECTED_ID,
    title: "중복 Organization 관계 제거",
    summary: "중복으로 판단된 관계 제거 제안 (반려됨).",
    status: "REJECTED",
    application_state: "NOT_APPLICABLE",
    item_count: 1,
    submitted_at: "2026-06-27T08:00:00.000Z",
    decided_at: "2026-06-27T15:00:00.000Z",
    decided_by: MVP6_GOVERNANCE_APPROVER_ID,
    decision_reason: "실사용 관계로 확인되어 반려",
  }),
  buildRequest({
    id: MVP6_GOVERNANCE_WITHDRAWN_ID,
    title: "임시 실험용 클래스 추가",
    summary: "실험 목적 제안, 제안자가 철회함.",
    status: "WITHDRAWN",
    application_state: "NOT_APPLICABLE",
    item_count: 1,
    submitted_at: "2026-06-26T08:00:00.000Z",
  }),
];

export const mockGovernanceItems: Record<string, OntologyChangeItem[]> = {
  [MVP6_GOVERNANCE_OPEN_ID]: [
    {
      id: "item-open-1",
      change_request_id: MVP6_GOVERNANCE_OPEN_ID,
      target_kind: "PROPERTY",
      change_type: "ADD",
      ontology_class_id: null,
      ontology_property_id: null,
      ontology_relation_id: null,
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { name: "risk_tier", datatype: "string", note: "위험등급 (LOW/MID/HIGH)" },
      created_at: NOW,
      updated_at: null,
    },
    {
      id: "item-open-2",
      change_request_id: MVP6_GOVERNANCE_OPEN_ID,
      target_kind: "CLASS",
      change_type: "MODIFY",
      ontology_class_id: "class-customer",
      ontology_property_id: null,
      ontology_relation_id: null,
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { note: "Customer 클래스 설명에 위험등급 관리 목적 추가" },
      created_at: NOW,
      updated_at: null,
    },
  ],
  [MVP6_GOVERNANCE_DRAFT_ID]: [
    {
      id: "item-draft-1",
      change_request_id: MVP6_GOVERNANCE_DRAFT_ID,
      target_kind: "RELATION",
      change_type: "ADD",
      ontology_class_id: null,
      ontology_property_id: null,
      ontology_relation_id: null,
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { name: "has_contract", note: "Customer -> Contract 관계 초안" },
      created_at: NOW,
      updated_at: null,
    },
  ],
  [MVP6_GOVERNANCE_IN_REVIEW_ID]: [
    {
      id: "item-inreview-1",
      change_request_id: MVP6_GOVERNANCE_IN_REVIEW_ID,
      target_kind: "CLASS",
      change_type: "DEPRECATE",
      ontology_class_id: "class-legacy-account",
      ontology_property_id: null,
      ontology_relation_id: null,
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { note: "LegacyAccount 클래스 폐기 제안 (실제 폐기는 별도 단계)" },
      created_at: NOW,
      updated_at: null,
    },
  ],
  [MVP6_GOVERNANCE_APPROVED_ID]: [
    {
      id: "item-approved-1",
      change_request_id: MVP6_GOVERNANCE_APPROVED_ID,
      target_kind: "PROPERTY",
      change_type: "MODIFY",
      ontology_class_id: null,
      ontology_property_id: "property-address",
      ontology_relation_id: null,
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { note: "Address 정규화 규칙: 시/도 표준 코드 매핑" },
      created_at: NOW,
      updated_at: null,
    },
  ],
  [MVP6_GOVERNANCE_STALE_APPROVED_ID]: [
    {
      id: "item-stale-1",
      change_request_id: MVP6_GOVERNANCE_STALE_APPROVED_ID,
      target_kind: "RELATION",
      change_type: "DEPRECATE",
      ontology_class_id: null,
      ontology_property_id: null,
      ontology_relation_id: "relation-legacy-link",
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { note: "Legacy 관계 폐기 (승인 이후 대상 초안이 변경됨)" },
      created_at: NOW,
      updated_at: null,
    },
  ],
  [MVP6_GOVERNANCE_REJECTED_ID]: [
    {
      id: "item-rejected-1",
      change_request_id: MVP6_GOVERNANCE_REJECTED_ID,
      target_kind: "RELATION",
      change_type: "DEPRECATE",
      ontology_class_id: null,
      ontology_property_id: null,
      ontology_relation_id: "relation-belongs-to",
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { note: "중복으로 의심된 관계 폐기 제안" },
      created_at: NOW,
      updated_at: null,
    },
  ],
  [MVP6_GOVERNANCE_WITHDRAWN_ID]: [
    {
      id: "item-withdrawn-1",
      change_request_id: MVP6_GOVERNANCE_WITHDRAWN_ID,
      target_kind: "CLASS",
      change_type: "ADD",
      ontology_class_id: null,
      ontology_property_id: null,
      ontology_relation_id: null,
      ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
      proposed_change: { name: "ExperimentEntity", note: "실험용, 철회함" },
      created_at: NOW,
      updated_at: null,
    },
  ],
};

export const mockGovernanceReviews: Record<string, GovernanceReviewDecision[]> = {
  [MVP6_GOVERNANCE_OPEN_ID]: [],
  [MVP6_GOVERNANCE_DRAFT_ID]: [],
  [MVP6_GOVERNANCE_IN_REVIEW_ID]: [
    {
      id: "rev-inreview-1",
      change_request_id: MVP6_GOVERNANCE_IN_REVIEW_ID,
      action: "COMMENT",
      actor_id: MVP6_GOVERNANCE_REVIEWER_ID,
      actor_role: "REVIEWER",
      reason: "폐기 대상 클래스의 참조 여부를 먼저 확인 부탁드립니다.",
      resulting_status: "IN_REVIEW",
      resulting_application_state: "NOT_APPLICABLE",
      created_at: "2026-06-30T09:00:00.000Z",
    },
  ],
  [MVP6_GOVERNANCE_APPROVED_ID]: [
    {
      id: "rev-approved-1",
      change_request_id: MVP6_GOVERNANCE_APPROVED_ID,
      action: "APPROVE",
      actor_id: MVP6_GOVERNANCE_APPROVER_ID,
      actor_role: "ONTOLOGY_MANAGER",
      reason: "정규화 규칙 검토 완료, 큐잉 승인",
      resulting_status: "APPROVED",
      resulting_application_state: "QUEUED",
      created_at: "2026-06-29T09:00:00.000Z",
    },
  ],
  [MVP6_GOVERNANCE_STALE_APPROVED_ID]: [
    {
      id: "rev-stale-1",
      change_request_id: MVP6_GOVERNANCE_STALE_APPROVED_ID,
      action: "APPROVE",
      actor_id: MVP6_GOVERNANCE_APPROVER_ID,
      actor_role: "ONTOLOGY_MANAGER",
      reason: "폐기 정리 검토 완료, 큐잉 승인",
      resulting_status: "APPROVED",
      resulting_application_state: "QUEUED",
      created_at: "2026-06-29T09:00:00.000Z",
    },
  ],
  [MVP6_GOVERNANCE_REJECTED_ID]: [
    {
      id: "rev-rejected-1",
      change_request_id: MVP6_GOVERNANCE_REJECTED_ID,
      action: "REJECT",
      actor_id: MVP6_GOVERNANCE_APPROVER_ID,
      actor_role: "ONTOLOGY_MANAGER",
      reason: "실사용 관계로 확인되어 반려",
      resulting_status: "REJECTED",
      resulting_application_state: "NOT_APPLICABLE",
      created_at: "2026-06-27T15:00:00.000Z",
    },
  ],
  [MVP6_GOVERNANCE_WITHDRAWN_ID]: [],
};

// Audit entries per request, stored in chronological ASCENDING order (G4 wire
// order). The UI may reverse for newest-first display.
export const mockGovernanceAudit: Record<string, GovernanceAuditEntry[]> = {
  [MVP6_GOVERNANCE_OPEN_ID]: [
    buildAudit(MVP6_GOVERNANCE_OPEN_ID, "CHANGE_REQUEST_CREATED", MVP6_GOVERNANCE_PROPOSER_ID, {
      after_status: "DRAFT",
      created_at: "2026-07-01T09:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_OPEN_ID, "CHANGE_REQUEST_SUBMITTED", MVP6_GOVERNANCE_PROPOSER_ID, {
      before_status: "DRAFT",
      after_status: "OPEN",
      created_at: "2026-07-01T10:00:00.000Z",
    }),
  ],
  [MVP6_GOVERNANCE_DRAFT_ID]: [
    buildAudit(MVP6_GOVERNANCE_DRAFT_ID, "CHANGE_REQUEST_CREATED", MVP6_GOVERNANCE_PROPOSER_ID, {
      after_status: "DRAFT",
      created_at: NOW,
    }),
  ],
  [MVP6_GOVERNANCE_IN_REVIEW_ID]: [
    buildAudit(MVP6_GOVERNANCE_IN_REVIEW_ID, "CHANGE_REQUEST_CREATED", MVP6_GOVERNANCE_PROPOSER_ID, {
      after_status: "DRAFT",
      created_at: "2026-06-30T07:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_IN_REVIEW_ID, "CHANGE_REQUEST_SUBMITTED", MVP6_GOVERNANCE_PROPOSER_ID, {
      before_status: "DRAFT",
      after_status: "OPEN",
      created_at: "2026-06-30T08:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_IN_REVIEW_ID, "REVIEW_STARTED", MVP6_GOVERNANCE_REVIEWER_ID, {
      before_status: "OPEN",
      after_status: "IN_REVIEW",
      created_at: "2026-06-30T09:00:00.000Z",
      actor_role: "REVIEWER",
    }),
    buildAudit(MVP6_GOVERNANCE_IN_REVIEW_ID, "COMMENT_ADDED", MVP6_GOVERNANCE_REVIEWER_ID, {
      before_status: "IN_REVIEW",
      after_status: "IN_REVIEW",
      reason: "폐기 대상 클래스의 참조 여부를 먼저 확인 부탁드립니다.",
      created_at: "2026-06-30T09:00:01.000Z",
      actor_role: "REVIEWER",
    }),
  ],
  [MVP6_GOVERNANCE_APPROVED_ID]: [
    buildAudit(MVP6_GOVERNANCE_APPROVED_ID, "CHANGE_REQUEST_CREATED", MVP6_GOVERNANCE_PROPOSER_ID, {
      after_status: "DRAFT",
      created_at: "2026-06-28T07:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_APPROVED_ID, "CHANGE_REQUEST_SUBMITTED", MVP6_GOVERNANCE_PROPOSER_ID, {
      before_status: "DRAFT",
      after_status: "OPEN",
      created_at: "2026-06-28T08:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_APPROVED_ID, "CHANGE_REQUEST_APPROVED", MVP6_GOVERNANCE_APPROVER_ID, {
      before_status: "OPEN",
      after_status: "APPROVED",
      reason: "정규화 규칙 검토 완료, 큐잉 승인",
      created_at: "2026-06-29T09:00:00.000Z",
      actor_role: "ONTOLOGY_MANAGER",
    }),
  ],
  [MVP6_GOVERNANCE_STALE_APPROVED_ID]: [
    buildAudit(MVP6_GOVERNANCE_STALE_APPROVED_ID, "CHANGE_REQUEST_CREATED", MVP6_GOVERNANCE_PROPOSER_ID, {
      after_status: "DRAFT",
      created_at: "2026-06-28T07:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_STALE_APPROVED_ID, "CHANGE_REQUEST_SUBMITTED", MVP6_GOVERNANCE_PROPOSER_ID, {
      before_status: "DRAFT",
      after_status: "OPEN",
      created_at: "2026-06-28T08:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_STALE_APPROVED_ID, "CHANGE_REQUEST_APPROVED", MVP6_GOVERNANCE_APPROVER_ID, {
      before_status: "OPEN",
      after_status: "APPROVED",
      reason: "폐기 정리 검토 완료, 큐잉 승인",
      created_at: "2026-06-29T09:00:00.000Z",
      actor_role: "ONTOLOGY_MANAGER",
    }),
  ],
  [MVP6_GOVERNANCE_REJECTED_ID]: [
    buildAudit(MVP6_GOVERNANCE_REJECTED_ID, "CHANGE_REQUEST_CREATED", MVP6_GOVERNANCE_PROPOSER_ID, {
      after_status: "DRAFT",
      created_at: "2026-06-27T07:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_REJECTED_ID, "CHANGE_REQUEST_SUBMITTED", MVP6_GOVERNANCE_PROPOSER_ID, {
      before_status: "DRAFT",
      after_status: "OPEN",
      created_at: "2026-06-27T08:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_REJECTED_ID, "CHANGE_REQUEST_REJECTED", MVP6_GOVERNANCE_APPROVER_ID, {
      before_status: "OPEN",
      after_status: "REJECTED",
      reason: "실사용 관계로 확인되어 반려",
      created_at: "2026-06-27T15:00:00.000Z",
      actor_role: "ONTOLOGY_MANAGER",
    }),
  ],
  [MVP6_GOVERNANCE_WITHDRAWN_ID]: [
    buildAudit(MVP6_GOVERNANCE_WITHDRAWN_ID, "CHANGE_REQUEST_CREATED", MVP6_GOVERNANCE_PROPOSER_ID, {
      after_status: "DRAFT",
      created_at: "2026-06-26T07:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_WITHDRAWN_ID, "CHANGE_REQUEST_SUBMITTED", MVP6_GOVERNANCE_PROPOSER_ID, {
      before_status: "DRAFT",
      after_status: "OPEN",
      created_at: "2026-06-26T08:00:00.000Z",
    }),
    buildAudit(MVP6_GOVERNANCE_WITHDRAWN_ID, "CHANGE_REQUEST_WITHDRAWN", MVP6_GOVERNANCE_PROPOSER_ID, {
      before_status: "OPEN",
      after_status: "WITHDRAWN",
      reason: "실험 종료, 철회함",
      created_at: "2026-06-26T12:00:00.000Z",
    }),
  ],
};

function buildAudit(
  changeRequestId: string,
  action: GovernanceAuditEntry["action"],
  actorId: string,
  overrides: Partial<GovernanceAuditEntry>,
): GovernanceAuditEntry {
  return {
    id: `audit-${changeRequestId}-${action}-${overrides.created_at ?? NOW}`,
    project_id: MVP6_GOVERNANCE_PROJECT_ID,
    change_request_id: changeRequestId,
    action,
    actor_id: actorId,
    target_item_ids: [],
    target_ontology_element_ids: [],
    ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
    before_status: null,
    after_status: null,
    reason: null,
    created_at: NOW,
    ...overrides,
  };
}

export function bannerFor(applicationState: GovernanceApplicationState): GovernanceApplicationBanner {
  return {
    application_state: applicationState,
    message:
      applicationState === "QUEUED"
        ? "승인된 변경 요청은 감사 가능한 결정 기록으로 큐잉(QUEUED)됩니다. 온톨로지 정의와 게시 그래프는 변경되지 않으며, 실제 적용은 이후 별도의 사람이 개시하는 단계에서 감사와 함께 이뤄집니다."
        : "승인은 큐잉된 의도이며, 온톨로지·게시 그래프에 자동 적용되지 않습니다.",
  };
}

// ---- MVP6.6 Governance change application (APPROVED+QUEUED -> APPLIED into a DRAFT) ----
// Additive. The resolved target is a DRAFT ontology version distinct from the
// change request's own ontology_version_id — apply writes ONLY to this DRAFT.

/** The project's current DRAFT ontology version apply resolves to (G1 default). */
export const MVP6_GOVERNANCE_TARGET_DRAFT_VERSION_ID = "onto-v7-draft";

/** The one-true-flag guard for a successful apply (distinct from the all-false MVP6.5 guard). */
export const applyMutationGuard: GovernanceApplicationMutationGuard = {
  ontology_draft_mutated: true,
  published_graph_mutated: false,
  candidate_graph_mutated: false,
  prompt_version_mutated: false,
  publish_job_started: false,
  extraction_job_started: false,
  evaluation_run_started: false,
};

export const applyCapabilitiesApplied: ApplicationCapabilities = { can_view: true, can_apply: false };
export const applyCapabilitiesQueued: ApplicationCapabilities = { can_view: true, can_apply: true };
export const applyCapabilitiesReadOnly: ApplicationCapabilities = { can_view: true, can_apply: false };

/**
 * Build the per-item application previews for a change request from its change
 * items. ADD -> before null / after DRAFT (create). MODIFY -> before ACTIVE /
 * after DRAFT (update). DEPRECATE -> before ACTIVE / after ARCHIVED.
 */
export function buildItemPreviews(
  items: OntologyChangeItem[],
  targetVersionId: string,
  stale = false,
): ApplicationItemPreview[] {
  return items.map((item) => {
    const refBase = {
      target_kind: item.target_kind,
      ontology_class_id: item.ontology_class_id ?? null,
      ontology_property_id: item.ontology_property_id ?? null,
      ontology_relation_id: item.ontology_relation_id ?? null,
      ontology_version_id: targetVersionId,
    };
    if (item.change_type === "ADD") {
      return {
        change_item_id: item.id,
        target_kind: item.target_kind,
        change_type: item.change_type,
        before_ref: null,
        after_ref: { ...refBase, status: "DRAFT" as const },
        stale,
        stale_reason: stale ? "VERSION_CONTEXT_DIVERGED" : null,
      };
    }
    if (item.change_type === "DEPRECATE") {
      return {
        change_item_id: item.id,
        target_kind: item.target_kind,
        change_type: item.change_type,
        before_ref: { ...refBase, status: "ACTIVE" as const },
        after_ref: { ...refBase, status: "ARCHIVED" as const },
        stale,
        stale_reason: stale ? "TARGET_ELEMENT_ARCHIVED" : null,
      };
    }
    // MODIFY
    return {
      change_item_id: item.id,
      target_kind: item.target_kind,
      change_type: item.change_type,
      before_ref: { ...refBase, status: "ACTIVE" as const },
      after_ref: { ...refBase, status: "DRAFT" as const },
      stale,
      stale_reason: stale ? "TARGET_ELEMENT_MODIFIED" : null,
    };
  });
}

let mockApplicationAuditCounter = 0;

export function buildApplicationAudit(
  changeRequestId: string,
  projectId: string,
  action: GovernanceApplicationAuditEntry["action"],
  overrides: Partial<GovernanceApplicationAuditEntry>,
): GovernanceApplicationAuditEntry {
  mockApplicationAuditCounter += 1;
  return {
    id: `app-audit-mock-${mockApplicationAuditCounter}`,
    project_id: projectId,
    change_request_id: changeRequestId,
    action,
    actor_id: MVP6_GOVERNANCE_APPROVER_ID,
    actor_role: "ONTOLOGY_MANAGER",
    target_ontology_version_id: MVP6_GOVERNANCE_TARGET_DRAFT_VERSION_ID,
    applied_item_ids: [],
    before_after_refs: [],
    before_application_state: "QUEUED",
    after_application_state: action === "CHANGE_REQUEST_APPLIED" ? "APPLIED" : "SUPERSEDED",
    note: null,
    stale_detail: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
