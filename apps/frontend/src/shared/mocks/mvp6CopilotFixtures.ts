import {
  CopilotMutationGuard,
  CopilotSuggestion,
  CopilotSummaryResponse,
} from "../api/types";
import {
  MVP6_GOVERNANCE_APPROVED_ID,
  MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
  MVP6_GOVERNANCE_PROJECT_ID,
} from "./mvp6GovernanceFixtures";

// Deterministic MVP6.8 Copilot fixtures. ADVISORY-ONLY: the copilot SUGGESTS and
// (on accept) ROUTES the human into an existing gated flow — it EXECUTES NOTHING
// and calls NO real model. Field/enum names match docs/api/openapi-mvp6-8-draft.json
// EXACTLY. Every response carries an ALL-FALSE 14-flag CopilotMutationGuard.
//
// The suggestions cover the four frozen CopilotSuggestionKind and exercise every
// CopilotSuggestionState (SUGGESTED x3 + ACCEPTED + DISMISSED + SUPERSEDED) so the
// list/summary/detail + decision loop + D6 badge + conflict states are all
// exercisable. Governance draft pre-fill uses the REAL ChangeRequestTargetKind
// literal `CLASS` (NOT `ONTOLOGY_CLASS`, per PM6-030 example correction).

export const MVP6_COPILOT_PROJECT_ID = MVP6_GOVERNANCE_PROJECT_ID;
export const MVP6_COPILOT_GENERATED_AT = "2026-07-08T09:00:00.000Z";

const V = MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID;

/** ALL 14 FLAGS FALSE, on every response. MVP6.8 turns NO flag true, ever. */
export const allFalseCopilotGuard: CopilotMutationGuard = {
  ontology_draft_mutated: false,
  ontology_published_mutated: false,
  candidate_graph_mutated: false,
  published_graph_mutated: false,
  prompt_version_mutated: false,
  governance_state_mutated: false,
  change_request_created: false,
  change_request_applied: false,
  candidate_approved_or_published: false,
  extraction_job_started: false,
  evaluation_run_started: false,
  auto_approval_policy_mutated: false,
  copilot_executed_action: false,
  real_model_invoked: false,
};

const P = MVP6_COPILOT_PROJECT_ID;

// --- 1. DRAFT_GOVERNANCE_CHANGE_REQUEST (SUGGESTED) -> governance draft pre-fill ---
const suggestionGovernance: CopilotSuggestion = {
  id: "copilot-suggestion-001",
  project_id: P,
  kind: "DRAFT_GOVERNANCE_CHANGE_REQUEST",
  state: "SUGGESTED",
  title: "InsuranceProduct와 Rider의 경계를 명확히 하세요",
  rationale:
    "최근 12건의 검토 정정과 2건의 평가 오류 케이스에서 InsuranceProduct와 Rider 클래스가 반복적으로 혼동되고 있습니다.",
  expected_next_step:
    "거버넌스 변경요청 생성 화면을 (미리 채워진 상태로) 열어 클래스 경계 정리를 제안하세요. 이후에도 제안 → 검토 → 승인 → 적용 단계를 사람이 모두 거칩니다.",
  routing_target: {
    kind: "GOVERNANCE_CHANGE_REQUEST_DRAFT",
    deep_link: `/projects/${P}/governance/new`,
    target_ref: { ontology_version_id: V },
    governance_change_request_draft_prefill: {
      target_kind: "CLASS",
      change_type: "MODIFY",
      ontology_version_id: V,
      element_refs: [
        { element_kind: "CLASS", element_id: "class-insurance-product", label: "InsuranceProduct" },
        { element_kind: "CLASS", element_id: "class-rider", label: "Rider" },
      ],
      proposed_title: "InsuranceProduct vs Rider 경계 정리",
      proposed_rationale: "반복된 검토 정정이 클래스 경계의 모호함을 시사합니다.",
    },
    executes_nothing: true,
    human_gate_note:
      "이 작업은 미리 채워진 초안을 열 뿐입니다. 코파일럿은 아무것도 생성하지 않으며, 제안 → 검토 → 승인 → 적용 단계를 사람이 모두 거칩니다.",
  },
  source_artifacts: [
    {
      artifact_type: "REVIEW_CORRECTION",
      artifact_id: "review-correction-441",
      project_id: P,
      candidate_id: "candidate-entity-201",
      candidate_kind: "ENTITY",
      review_task_id: "review-task-88",
      review_decision_id: "review-decision-777",
      learning_signal_id: "signal-class-confusion-003",
      ontology_version_id: V,
      prompt_version_id: "prompt-v12",
      model_run_id: "model-run-982",
      evidence_refs: [
        {
          source_id: "source-policy-001",
          source_segment_id: "segment-42",
          locator: "page=3:paragraph=8",
          quote: "The rider is an optional add-on to the base product.",
        },
      ],
      observed_at: "2026-07-01T15:10:00.000Z",
    },
    {
      artifact_type: "EVALUATION_ERROR_CASE",
      artifact_id: "error-case-090",
      project_id: P,
      candidate_kind: "ENTITY",
      evaluation_run_id: "eval-run-20260701-001",
      evaluation_error_case_id: "error-case-090",
      ontology_version_id: V,
      evidence_refs: [],
      observed_at: "2026-07-01T16:00:00.000Z",
    },
  ],
  confidence_label: "MEDIUM",
  risk_label: "MEDIUM",
  created_at: MVP6_COPILOT_GENERATED_AT,
  updated_at: MVP6_COPILOT_GENERATED_AT,
  decision_audit_note: null,
  safety_note:
    "제안 전용입니다. 채택하면 사용자의 의도를 기록하고 미리 채워진 거버넌스 초안을 열 뿐, 코파일럿은 생성/변경/적용을 하지 않습니다.",
};

// --- 2. REVIEW_THESE_CANDIDATES (SUGGESTED, HIGH risk) -> candidate review deep-link ---
const suggestionReview: CopilotSuggestion = {
  id: "copilot-suggestion-002",
  project_id: P,
  kind: "REVIEW_THESE_CANDIDATES",
  state: "SUGGESTED",
  title: "고위험 관계 후보 6건을 검수하세요",
  rationale: "관계 후보 6건이 동일한 평가 오류 클러스터와 낮은 근거 일치율을 공유합니다.",
  expected_next_step:
    "이 6건의 후보로 딥링크된 후보 검수 인박스를 여세요. 이후에도 검토 → 정정 → 결정 단계를 사람이 모두 거칩니다.",
  routing_target: {
    kind: "CANDIDATE_REVIEW_LOCATION",
    deep_link: `/projects/${P}/review?candidate_ids=candidate-relation-778,candidate-relation-779`,
    target_ref: { candidate_ids: ["candidate-relation-778", "candidate-relation-779"] },
    governance_change_request_draft_prefill: null,
    executes_nothing: true,
    human_gate_note:
      "이 작업은 검수 인박스로 딥링크할 뿐입니다. 코파일럿은 승인/정정을 하지 않으며, 검토와 결정은 사람이 합니다.",
  },
  source_artifacts: [
    {
      artifact_type: "EVALUATION_ERROR_CASE",
      artifact_id: "error-case-101",
      project_id: P,
      candidate_id: "candidate-relation-778",
      candidate_kind: "RELATION",
      evaluation_run_id: "eval-run-20260701-001",
      evaluation_error_case_id: "error-case-101",
      ontology_version_id: V,
      prompt_version_id: "prompt-v12",
      model_run_id: "model-run-982",
      evidence_refs: [],
      observed_at: "2026-07-01T15:10:00.000Z",
    },
    {
      artifact_type: "QUALITY_DRILLDOWN",
      artifact_id: "quality-drilldown-consistency-01",
      project_id: P,
      quality_metric_id: "quality-metric-consistency",
      ontology_version_id: V,
      evidence_refs: [],
      observed_at: "2026-07-02T10:00:00.000Z",
    },
  ],
  confidence_label: "HIGH",
  risk_label: "HIGH",
  created_at: MVP6_COPILOT_GENERATED_AT,
  updated_at: MVP6_COPILOT_GENERATED_AT,
  decision_audit_note: null,
  safety_note: "제안 전용입니다. 채택하면 검수 화면으로 딥링크할 뿐, 코파일럿은 아무 결정도 하지 않습니다.",
};

// --- 3. INSPECT_QUALITY_OR_VALIDATION_SIGNAL (SUGGESTED) -> quality dashboard deep-link ---
const suggestionQuality: CopilotSuggestion = {
  id: "copilot-suggestion-003",
  project_id: P,
  kind: "INSPECT_QUALITY_OR_VALIDATION_SIGNAL",
  state: "SUGGESTED",
  title: "일관성(Consistency) 품질 그룹의 낮은 점수를 점검하세요",
  rationale: "CONSISTENCY 품질 그룹의 지표가 0.8 미만으로 하락했고 관련 검증 규칙에 경고가 누적되었습니다.",
  expected_next_step:
    "품질 대시보드의 해당 지표 그룹으로 딥링크됩니다. 읽기 전용 목적지이며 후속 조치는 사람이 결정합니다.",
  routing_target: {
    kind: "QUALITY_OR_VALIDATION_LOCATION",
    deep_link: `/projects/${P}/quality?group=CONSISTENCY`,
    target_ref: { quality_metric_group: "CONSISTENCY" },
    governance_change_request_draft_prefill: null,
    executes_nothing: true,
    human_gate_note: "이 작업은 품질 대시보드로 딥링크할 뿐입니다. 코파일럿은 아무것도 변경하지 않습니다.",
  },
  source_artifacts: [
    {
      artifact_type: "QUALITY_METRIC",
      artifact_id: "quality-metric-consistency",
      project_id: P,
      quality_metric_id: "quality-metric-consistency",
      ontology_version_id: V,
      evidence_refs: [],
      observed_at: "2026-07-02T10:00:00.000Z",
    },
    {
      artifact_type: "VALIDATION_RESULT",
      artifact_id: "validation-result-datatype-11",
      project_id: P,
      validation_result_id: "validation-result-datatype-11",
      ontology_version_id: V,
      evidence_refs: [],
      observed_at: "2026-07-02T10:05:00.000Z",
    },
  ],
  confidence_label: "MEDIUM",
  risk_label: "LOW",
  created_at: MVP6_COPILOT_GENERATED_AT,
  updated_at: MVP6_COPILOT_GENERATED_AT,
  decision_audit_note: null,
  safety_note: "제안 전용입니다. 채택하면 읽기 전용 품질 대시보드로 딥링크할 뿐입니다.",
};

// --- 4. RUN_IMPACT_SIMULATION (ACCEPTED, already decided) -> impact report deep-link ---
const suggestionImpact: CopilotSuggestion = {
  id: "copilot-suggestion-004",
  project_id: P,
  kind: "RUN_IMPACT_SIMULATION",
  state: "ACCEPTED",
  title: "승인된 변경 요청의 영향도를 분석하세요",
  rationale: "승인(APPROVED)되었고 적용 대기(QUEUED) 상태인 변경 요청이 있습니다. 적용 전 영향도 검토를 권장합니다.",
  expected_next_step:
    "거버넌스 변경 요청 상세의 영향도 리포트 패널로 딥링크됩니다. 읽기 전용 분석이며, 적용/게시 여부는 사람이 결정합니다.",
  routing_target: {
    kind: "IMPACT_REPORT_LOCATION",
    deep_link: `/projects/${P}/governance/${MVP6_GOVERNANCE_APPROVED_ID}`,
    target_ref: { change_request_id: MVP6_GOVERNANCE_APPROVED_ID },
    governance_change_request_draft_prefill: null,
    executes_nothing: true,
    human_gate_note: "이 작업은 읽기 전용 영향도 리포트로 딥링크할 뿐입니다. 적용/게시는 사람이 별도로 결정합니다.",
  },
  source_artifacts: [
    {
      artifact_type: "GOVERNANCE_CHANGE_REQUEST",
      artifact_id: MVP6_GOVERNANCE_APPROVED_ID,
      project_id: P,
      governance_change_request_id: MVP6_GOVERNANCE_APPROVED_ID,
      ontology_version_id: V,
      evidence_refs: [],
      observed_at: "2026-07-03T02:00:00.000Z",
    },
  ],
  confidence_label: "HIGH",
  risk_label: "MEDIUM",
  created_at: MVP6_COPILOT_GENERATED_AT,
  updated_at: "2026-07-08T09:30:00.000Z",
  decision_audit_note: {
    id: "copilot-decision-seed-001",
    suggestion_id: "copilot-suggestion-004",
    project_id: P,
    actor_id: "dev-user",
    actor_role: "PROJECT_MEMBER",
    decision: "ACCEPT",
    dismiss_reason_code: null,
    note: "적용 전에 영향도를 확인하겠습니다.",
    decided_at: "2026-07-08T09:30:00.000Z",
    suggestion_snapshot: {
      kind: "RUN_IMPACT_SIMULATION",
      title: "승인된 변경 요청의 영향도를 분석하세요",
      rationale: "승인(APPROVED)되었고 적용 대기(QUEUED) 상태인 변경 요청이 있습니다. 적용 전 영향도 검토를 권장합니다.",
      confidence_label: "HIGH",
      risk_label: "MEDIUM",
    },
    source_artifact_ids: [MVP6_GOVERNANCE_APPROVED_ID],
    routing_target: {
      kind: "IMPACT_REPORT_LOCATION",
      deep_link: `/projects/${P}/governance/${MVP6_GOVERNANCE_APPROVED_ID}`,
      target_ref: { change_request_id: MVP6_GOVERNANCE_APPROVED_ID },
      governance_change_request_draft_prefill: null,
      executes_nothing: true,
      human_gate_note: "이 작업은 읽기 전용 영향도 리포트로 딥링크할 뿐입니다. 적용/게시는 사람이 별도로 결정합니다.",
    },
    mutation_guard: { ...allFalseCopilotGuard },
  },
  safety_note: "제안 전용입니다. 채택은 읽기 전용 영향도 리포트로 딥링크할 뿐입니다.",
};

// --- 5. DISMISSED (already decided, historical) ---
const suggestionDismissed: CopilotSuggestion = {
  id: "copilot-suggestion-005",
  project_id: P,
  kind: "INSPECT_QUALITY_OR_VALIDATION_SIGNAL",
  state: "DISMISSED",
  title: "추적성(Traceability) 검증 경고를 점검하세요",
  rationale: "TRACEABILITY 그룹에서 ORPHAN_NODE 경고가 관찰되었습니다.",
  expected_next_step: "검증 드릴다운으로 딥링크됩니다. 읽기 전용 목적지입니다.",
  routing_target: {
    kind: "QUALITY_OR_VALIDATION_LOCATION",
    deep_link: `/projects/${P}/quality?group=TRACEABILITY`,
    target_ref: { quality_metric_group: "TRACEABILITY" },
    governance_change_request_draft_prefill: null,
    executes_nothing: true,
    human_gate_note: "이 작업은 검증 드릴다운으로 딥링크할 뿐입니다. 코파일럿은 아무것도 변경하지 않습니다.",
  },
  source_artifacts: [
    {
      artifact_type: "VALIDATION_RESULT",
      artifact_id: "validation-result-orphan-05",
      project_id: P,
      validation_result_id: "validation-result-orphan-05",
      ontology_version_id: V,
      evidence_refs: [],
      observed_at: "2026-07-02T11:00:00.000Z",
    },
  ],
  confidence_label: "LOW",
  risk_label: "LOW",
  created_at: MVP6_COPILOT_GENERATED_AT,
  updated_at: "2026-07-08T09:40:00.000Z",
  decision_audit_note: {
    id: "copilot-decision-seed-002",
    suggestion_id: "copilot-suggestion-005",
    project_id: P,
    actor_id: "dev-user",
    actor_role: "PROJECT_MEMBER",
    decision: "DISMISS",
    dismiss_reason_code: "INSUFFICIENT_EVIDENCE",
    note: "근거가 더 쌓이면 다시 검토하겠습니다.",
    decided_at: "2026-07-08T09:40:00.000Z",
    suggestion_snapshot: {
      kind: "INSPECT_QUALITY_OR_VALIDATION_SIGNAL",
      title: "추적성(Traceability) 검증 경고를 점검하세요",
      rationale: "TRACEABILITY 그룹에서 ORPHAN_NODE 경고가 관찰되었습니다.",
      confidence_label: "LOW",
      risk_label: "LOW",
    },
    source_artifact_ids: ["validation-result-orphan-05"],
    routing_target: null,
    mutation_guard: { ...allFalseCopilotGuard },
  },
  safety_note: "제안 전용입니다. 이 제안은 기각되어 이력으로만 남습니다.",
};

// --- 6. SUPERSEDED (read-side only, de-prioritized, never decidable) ---
const suggestionSuperseded: CopilotSuggestion = {
  id: "copilot-suggestion-006",
  project_id: P,
  kind: "REVIEW_THESE_CANDIDATES",
  state: "SUPERSEDED",
  title: "이전 후보 검수 제안 (대체됨)",
  rationale: "이 제안은 더 최신의 후보 클러스터 제안으로 대체되었습니다.",
  expected_next_step: "대체된 제안이므로 별도 조치가 필요하지 않습니다.",
  routing_target: {
    kind: "CANDIDATE_REVIEW_LOCATION",
    deep_link: `/projects/${P}/review?candidate_ids=candidate-relation-700`,
    target_ref: { candidate_ids: ["candidate-relation-700"] },
    governance_change_request_draft_prefill: null,
    executes_nothing: true,
    human_gate_note: "이 작업은 검수 인박스로 딥링크할 뿐입니다.",
  },
  source_artifacts: [
    {
      artifact_type: "CANDIDATE",
      artifact_id: "candidate-relation-700",
      project_id: P,
      candidate_id: "candidate-relation-700",
      candidate_kind: "RELATION",
      ontology_version_id: V,
      evidence_refs: [],
      observed_at: "2026-06-30T10:00:00.000Z",
    },
  ],
  confidence_label: "LOW",
  risk_label: "LOW",
  created_at: "2026-07-05T09:00:00.000Z",
  updated_at: "2026-07-08T09:00:00.000Z",
  decision_audit_note: null,
  safety_note: "제안 전용입니다. 이 제안은 대체되어 읽기 전용 이력으로만 표시됩니다.",
};

/**
 * Deterministic, byte-stable suggestion list. Ordered by (kind ordinal, id asc)
 * per PM6-030 G1. SUGGESTED first is a display concern handled by the UI filter,
 * not the fixture order (the fixture is the canonical deterministic set).
 */
export const mockCopilotSuggestions: CopilotSuggestion[] = [
  suggestionGovernance,
  suggestionReview,
  suggestionQuality,
  suggestionImpact,
  suggestionDismissed,
  suggestionSuperseded,
];

/** Source-artifact scope: the distinct artifact types that fed the suggestions. */
export const mockCopilotSourceArtifactScope: CopilotSummaryResponse["source_artifact_scope"] = [
  "REVIEW_CORRECTION",
  "EVALUATION_ERROR_CASE",
  "QUALITY_DRILLDOWN",
  "QUALITY_METRIC",
  "VALIDATION_RESULT",
  "GOVERNANCE_CHANGE_REQUEST",
  "CANDIDATE",
];

export const mockCopilotAdvisoryNotes: string[] = [
  "코파일럿은 제안 전용입니다. 아무것도 실행하지 않고, 실제 모델을 호출하지 않으며, 온톨로지/후보/게시/거버넌스 상태를 변경하지 않습니다.",
  "제안을 채택하면 사용자의 의도를 기록하고 미리 채워진 기존의 사람 검토 단계로 이동할 뿐입니다. 이후에도 모든 게이트를 사람이 거칩니다.",
];
