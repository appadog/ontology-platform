import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  History,
  Info,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import styled from "styled-components";
import { CopilotDecisionError } from "../shared/api/client";
import {
  useCopilotSuggestion,
  useCopilotSuggestions,
  useCopilotSummary,
  useDecideCopilotSuggestion,
  useProject,
} from "../shared/api/queries";
import {
  CopilotDecisionCommand,
  CopilotDismissReasonCode,
  CopilotMutationGuard,
  CopilotRoutingTarget,
  CopilotRoutingTargetKind,
  CopilotSourceArtifactRef,
  CopilotSuggestion,
  CopilotSuggestionKind,
} from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CardBody, KeyValue, Muted, Stack } from "./mvp3Shared";
import { PageActions } from "./mvp4Shared";

type Section = "summary" | "suggestions" | "history";

const sections: { id: Section; label: string; icon: typeof Sparkles }[] = [
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "suggestions", label: "Suggestions", icon: Lightbulb },
  { id: "history", label: "Decision History", icon: History },
];

const kindKo: Record<CopilotSuggestionKind, string> = {
  DRAFT_GOVERNANCE_CHANGE_REQUEST: "거버넌스 변경요청 초안",
  REVIEW_THESE_CANDIDATES: "후보 검수 대상",
  INSPECT_QUALITY_OR_VALIDATION_SIGNAL: "품질·검증 신호 점검",
  RUN_IMPACT_SIMULATION: "영향 시뮬레이션 실행",
};

const kindOrder: CopilotSuggestionKind[] = [
  "DRAFT_GOVERNANCE_CHANGE_REQUEST",
  "REVIEW_THESE_CANDIDATES",
  "INSPECT_QUALITY_OR_VALIDATION_SIGNAL",
  "RUN_IMPACT_SIMULATION",
];

const routingKindKo: Record<CopilotRoutingTargetKind, string> = {
  GOVERNANCE_CHANGE_REQUEST_DRAFT: "거버넌스 변경요청 생성 화면 (미리 채워짐)",
  CANDIDATE_REVIEW_LOCATION: "후보 검수 인박스",
  QUALITY_OR_VALIDATION_LOCATION: "품질 대시보드 / 검증 드릴다운",
  IMPACT_REPORT_LOCATION: "영향도 리포트 패널",
};

const routingGate: Record<CopilotRoutingTargetKind, string> = {
  GOVERNANCE_CHANGE_REQUEST_DRAFT: "제안 → 검토 → 승인 → 적용",
  CANDIDATE_REVIEW_LOCATION: "검토 → 정정 → 결정",
  QUALITY_OR_VALIDATION_LOCATION: "읽기 전용 · 후속 조치는 사람이 결정",
  IMPACT_REPORT_LOCATION: "읽기 전용 분석 · 적용/게시는 사람이 결정",
};

const artifactTypeKo: Record<CopilotSourceArtifactRef["artifact_type"], string> = {
  REVIEW_DECISION: "검토 결정",
  REVIEW_CORRECTION: "검토 정정",
  VALIDATION_RESULT: "검증 결과",
  QUALITY_METRIC: "품질 지표",
  QUALITY_DRILLDOWN: "품질 드릴다운",
  EVALUATION_RUN: "평가 실행",
  EVALUATION_METRIC: "평가 지표",
  EVALUATION_ERROR_CASE: "평가 오류 케이스",
  LEARNING_SIGNAL: "학습 신호",
  CANDIDATE: "후보",
  GOVERNANCE_CHANGE_REQUEST: "거버넌스 변경요청",
  IMPACT_REPORT: "영향도 리포트",
};

const dismissReasonCodes: CopilotDismissReasonCode[] = [
  "NOT_RELEVANT",
  "INSUFFICIENT_EVIDENCE",
  "DUPLICATE",
  "OUT_OF_SCOPE",
  "RISK_TOO_HIGH",
  "OTHER",
];

const dismissReasonKo: Record<CopilotDismissReasonCode, string> = {
  NOT_RELEVANT: "관련 없음",
  INSUFFICIENT_EVIDENCE: "근거 부족",
  DUPLICATE: "중복",
  OUT_OF_SCOPE: "범위 밖",
  RISK_TOO_HIGH: "위험 과다",
  OTHER: "기타",
};

const GUARD_FLAGS: (keyof CopilotMutationGuard)[] = [
  "ontology_draft_mutated",
  "ontology_published_mutated",
  "candidate_graph_mutated",
  "published_graph_mutated",
  "prompt_version_mutated",
  "governance_state_mutated",
  "change_request_created",
  "change_request_applied",
  "candidate_approved_or_published",
  "extraction_job_started",
  "evaluation_run_started",
  "auto_approval_policy_mutated",
  "copilot_executed_action",
  "real_model_invoked",
];

/** All-false invariant: MVP6.8 turns NO flag true, ever. */
function guardAllFalse(guard: CopilotMutationGuard): boolean {
  return GUARD_FLAGS.every((flag) => guard[flag] === false);
}

function confidenceTone(label: "LOW" | "MEDIUM" | "HIGH") {
  return label === "HIGH" ? ("success" as const) : label === "MEDIUM" ? ("progress" as const) : ("muted" as const);
}
function riskTone(label: "LOW" | "MEDIUM" | "HIGH") {
  return label === "HIGH" ? ("danger" as const) : label === "MEDIUM" ? ("warning" as const) : ("muted" as const);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function CopilotPage() {
  const { projectId = "", suggestionId } = useParams();
  const projectQuery = useProject(projectId);
  const summaryQuery = useCopilotSummary(projectId);
  const suggestionsQuery = useCopilotSuggestions(projectId);
  const decideMutation = useDecideCopilotSuggestion(projectId);

  const [section, setSection] = useState<Section>("summary");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ suggestion: CopilotSuggestion; decision: CopilotDecisionCommand } | null>(null);
  const [dismissReason, setDismissReason] = useState<CopilotDismissReasonCode>("INSUFFICIENT_EVIDENCE");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);

  useEffect(() => {
    if (suggestionId) {
      setSection("suggestions");
      setSelectedId(suggestionId);
    }
  }, [suggestionId]);

  const summary = summaryQuery.data;
  const suggestions = useMemo(() => suggestionsQuery.data?.items ?? [], [suggestionsQuery.data]);
  // Deterministic display order: SUGGESTED first, then by (kind ordinal, id asc).
  const orderedSuggestions = useMemo(() => {
    const rank = (s: CopilotSuggestion) => (s.state === "SUGGESTED" ? 0 : 1);
    return [...suggestions].sort((a, b) => {
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const ka = kindOrder.indexOf(a.kind);
      const kb = kindOrder.indexOf(b.kind);
      if (ka !== kb) return ka - kb;
      return a.id.localeCompare(b.id);
    });
  }, [suggestions]);

  const selectedSuggestion = useMemo(
    () => suggestions.find((s) => s.id === selectedId) ?? orderedSuggestions[0] ?? null,
    [suggestions, selectedId, orderedSuggestions],
  );

  const decided = useMemo(() => suggestions.filter((s) => s.decision_audit_note), [suggestions]);

  // The live guard is read FROM the response (never hardcoded). Any true flag ->
  // guard-violation state that disables all decision actions.
  const liveGuard = summary?.mutation_guard ?? suggestionsQuery.data?.mutation_guard ?? null;
  const guardViolation = liveGuard ? !guardAllFalse(liveGuard) : false;

  if (projectQuery.isLoading || summaryQuery.isLoading) {
    return <PageState kind="loading" title="코파일럿을 불러오는 중" description="프로젝트의 제안을 준비하고 있습니다." />;
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="프로젝트 컨텍스트를 사용할 수 없음" description="코파일럿은 선택된 유효한 프로젝트가 필요합니다." />;
  }

  const permissionLimited =
    (summaryQuery.isError && summaryQuery.error instanceof CopilotDecisionError && summaryQuery.error.status === 403) ||
    (suggestionsQuery.isError && suggestionsQuery.error instanceof CopilotDecisionError && suggestionsQuery.error.status === 403);
  if (permissionLimited) {
    return (
      <PageState
        kind="permission"
        title="권한이 제한되어 있습니다"
        description="이 프로젝트를 볼 수 있는 구성원만 코파일럿 제안을 볼 수 있습니다."
      />
    );
  }
  if (summaryQuery.isError || suggestionsQuery.isError) {
    return (
      <PageState
        kind="error"
        title="코파일럿 제안을 불러오지 못했습니다"
        description="원천 아티팩트를 사용할 수 없거나 서비스에서 오류가 반환되었습니다. 이 화면은 아무것도 변경하지 않으므로 안전하게 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => {
          void summaryQuery.refetch();
          void suggestionsQuery.refetch();
        }}
      />
    );
  }

  const openDecision = (suggestion: CopilotSuggestion, decision: CopilotDecisionCommand) => {
    setDecisionModal({ suggestion, decision });
    setDismissReason("INSUFFICIENT_EVIDENCE");
    setDecisionNote("");
    setDecisionError(null);
  };

  const confirmDecision = () => {
    if (!decisionModal) return;
    const { suggestion, decision } = decisionModal;
    setDecisionError(null);
    decideMutation.mutate(
      {
        suggestionId: suggestion.id,
        payload: {
          decision,
          dismiss_reason_code: decision === "DISMISS" ? dismissReason : null,
          note: decisionNote.trim() ? decisionNote.trim() : null,
        },
      },
      {
        onSuccess: (response) => {
          setDecisionModal(null);
          setSelectedId(response.suggestion_id);
        },
        onError: (error) => {
          if (error instanceof CopilotDecisionError) {
            setDecisionError(
              error.code === "COPILOT_SUGGESTION_DECISION_CONFLICT"
                ? `이 제안은 이미 ${error.state ?? "결정"} 상태입니다. 더 이상 채택/기각할 수 없습니다 (409).`
                : error.message,
            );
          } else {
            setDecisionError("결정을 기록하지 못했습니다. 다시 시도해 주세요.");
          }
        },
      },
    );
  };

  return (
    <>
      <Breadcrumbs items={[{ label: projectQuery.data.name, to: `/projects/${projectId}` }, { label: "Copilot" }]} />
      <PageHeader
        title="코파일럿"
        description={`${projectQuery.data.name} · 제안 전용 · 실행하지 않는 어드바이저리 루프`}
        eyebrow="COPILOT · 제안 전용 (실행 없음)"
      >
        <PageActions>
          <HanaBadge tone="neutral">MVP6.8</HanaBadge>
          <HanaBadge tone="warning">Advisory-only · 감사 전용</HanaBadge>
        </PageActions>
      </PageHeader>

      {/* Safety spine: persistent advisory banner + live all-false guard proof. */}
      <AdvisoryBanner role="note">
        <Info aria-hidden="true" size={18} />
        <div>
          <strong>코파일럿은 제안만 합니다. 아무것도 실행하지 않습니다.</strong>
          <p>
            제안을 채택(ACCEPT)하면 기존의 사람 검토 단계로 이동할 뿐, 코파일럿이 변경/승인/게시/적용을 직접 수행하지
            않습니다. 실제 LLM 호출도 없습니다(결정적 mock).
          </p>
          <ChipRow>
            <HanaBadge tone="progress">NO_AUTO_APPLY · 자동 적용 없음</HanaBadge>
            <HanaBadge tone="progress">NO_AUTO_PUBLISH · 자동 게시 없음</HanaBadge>
            <HanaBadge tone="progress">NO_AUTO_APPROVE · 자동 승인 없음</HanaBadge>
            <HanaBadge tone="progress">NO_REAL_LLM · 실제 모델 호출 없음</HanaBadge>
          </ChipRow>
        </div>
      </AdvisoryBanner>

      {liveGuard ? (
        guardViolation ? (
          <ErrorRow role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>예상치 못한 상태: mutation 플래그가 감지되었습니다. 이는 결함이며 모든 결정 동작이 비활성화됩니다.</span>
          </ErrorRow>
        ) : (
          <GuardProof guard={liveGuard} />
        )
      ) : null}

      <SectionBar role="tablist" aria-label="Copilot sections">
        {sections.map((item) => {
          const Icon = item.icon;
          const count =
            item.id === "summary"
              ? null
              : item.id === "suggestions"
                ? suggestions.length
                : decided.length;
          return (
            <SectionTab
              key={item.id}
              type="button"
              role="tab"
              aria-selected={section === item.id}
              data-active={section === item.id}
              onClick={() => setSection(item.id)}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
              {count !== null && <em>{count}</em>}
            </SectionTab>
          );
        })}
      </SectionBar>

      {section === "summary" && summary && <SummaryView summary={summary} />}

      {section === "suggestions" && (
        <SuggestionsView
          suggestions={orderedSuggestions}
          selected={selectedSuggestion}
          onSelect={(id) => setSelectedId(id)}
          onDecide={openDecision}
          decisionDisabled={guardViolation || decideMutation.isPending}
          projectId={projectId}
        />
      )}

      {section === "history" && <HistoryView suggestions={decided} />}

      {decisionModal && (
        <DecisionModal
          suggestion={decisionModal.suggestion}
          decision={decisionModal.decision}
          dismissReason={dismissReason}
          setDismissReason={setDismissReason}
          note={decisionNote}
          setNote={setDecisionNote}
          error={decisionError}
          pending={decideMutation.isPending}
          onCancel={() => setDecisionModal(null)}
          onConfirm={confirmDecision}
        />
      )}
    </>
  );
}

// ---- Summary view ----

function SummaryView({ summary }: { summary: import("../shared/api/types").CopilotSummaryResponse }) {
  return (
    <Stack>
      <StrongSummary>
        <div>
          <span>열린 제안 (SUGGESTED)</span>
          <h2>{summary.suggested_count}건</h2>
          <p>지금 검토·결정을 기다리는 제안입니다. 채택은 실행이 아니라 기존 게이트로의 이동입니다.</p>
        </div>
        <HanaBadge tone="neutral">DETERMINISTIC_MOCK · 실제 모델 아님</HanaBadge>
      </StrongSummary>

      <KpiGrid>
        <MetricCard label="전체 제안" value={String(summary.total_suggestion_count)} />
        <MetricCard label="채택됨" value={String(summary.accepted_count)} />
        <MetricCard label="기각됨" value={String(summary.dismissed_count)} />
        <MetricCard label="대체됨" value={String(summary.superseded_count)} />
        <MetricCard label="고위험" value={String(summary.high_risk_count)} />
        <MetricCard label="생성 시각" value={formatDate(summary.generated_at)} />
      </KpiGrid>

      <HanaCard title="종류별 제안 수" eyebrow="BY KIND" emphasis="default">
        <CardBody>
          <BadgeGrid>
            {summary.counts_by_kind.map((c) => (
              <KindCountRow key={c.kind}>
                <HanaBadge tone="neutral">
                  {c.kind} · {kindKo[c.kind]}
                </HanaBadge>
                <strong>{c.count}건</strong>
                {c.high_risk_count > 0 ? <StatusBadge token="HIGH" tone="danger" koLabel={`고위험 ${c.high_risk_count}`} /> : null}
              </KindCountRow>
            ))}
          </BadgeGrid>
        </CardBody>
      </HanaCard>

      <HanaCard title="원천 근거 범위" description="이 제안들이 근거로 삼은 닫힌 MVP 아티팩트 유형" eyebrow="GROUNDING" emphasis="default">
        <CardBody>
          <ChipRow>
            {summary.source_artifact_scope.map((t) => (
              <HanaBadge key={t} tone="neutral">
                {t} · {artifactTypeKo[t]}
              </HanaBadge>
            ))}
          </ChipRow>
        </CardBody>
      </HanaCard>

      <HanaCard title="어드바이저리 안내" eyebrow="ADVISORY" emphasis="default">
        <CardBody>
          <NoteList>
            {summary.advisory_notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </NoteList>
        </CardBody>
      </HanaCard>
    </Stack>
  );
}

// ---- Suggestions view (queue + contextual detail) ----

function SuggestionsView({
  suggestions,
  selected,
  onSelect,
  onDecide,
  decisionDisabled,
  projectId,
}: {
  suggestions: CopilotSuggestion[];
  selected: CopilotSuggestion | null;
  onSelect: (id: string) => void;
  onDecide: (s: CopilotSuggestion, d: CopilotDecisionCommand) => void;
  decisionDisabled: boolean;
  projectId: string;
}) {
  if (suggestions.length === 0) {
    return (
      <PageState
        kind="empty"
        title="지금은 제안할 다음 작업이 없습니다"
        description="현재 프로젝트 상태 기준으로 코파일럿이 근거 있는 다음 작업을 제안하지 않았습니다. 검수·품질·평가·거버넌스 화면을 직접 확인해 보세요. 코파일럿은 아무 작업도 수행하지 않았습니다."
      />
    );
  }
  return (
    <SplitLayout>
      <Queue>
        {suggestions.map((s) => {
          const grounded = s.source_artifacts.length > 0;
          return (
            <QueueCard
              key={s.id}
              type="button"
              data-selected={selected?.id === s.id}
              onClick={() => onSelect(s.id)}
            >
              <QueueHead>
                <StatusBadge token={s.state} />
                <StatusBadge token={s.confidence_label} tone={confidenceTone(s.confidence_label)} koLabel={`신뢰도 ${s.confidence_label === "HIGH" ? "높음" : s.confidence_label === "MEDIUM" ? "중간" : "낮음"}`} />
                <StatusBadge token={s.risk_label} tone={riskTone(s.risk_label)} koLabel={`위험 ${s.risk_label === "HIGH" ? "높음" : s.risk_label === "MEDIUM" ? "중간" : "낮음"}`} />
              </QueueHead>
              <QueueKind>
                <HanaBadge tone="neutral">{kindKo[s.kind]}</HanaBadge>
                <Muted as="span">→ {routingKindKo[s.routing_target.kind]}</Muted>
              </QueueKind>
              <QueueTitle>{s.title}</QueueTitle>
              {grounded ? (
                <GroundingChip>
                  <ShieldCheck aria-hidden="true" size={12} /> 근거 {s.source_artifacts.length}건 ·{" "}
                  {s.source_artifacts[0].artifact_type}
                </GroundingChip>
              ) : (
                <ErrorRow role="alert">
                  <AlertTriangle aria-hidden="true" size={14} />
                  <span>근거 없는 제안 — 표시할 수 없습니다.</span>
                </ErrorRow>
              )}
            </QueueCard>
          );
        })}
      </Queue>

      <DetailPanel>
        {selected ? (
          <SuggestionDetail suggestion={selected} onDecide={onDecide} decisionDisabled={decisionDisabled} projectId={projectId} />
        ) : (
          <Muted>제안을 선택하면 상세가 여기에 표시됩니다.</Muted>
        )}
      </DetailPanel>
    </SplitLayout>
  );
}

function SuggestionDetail({
  suggestion,
  onDecide,
  decisionDisabled,
  projectId,
}: {
  suggestion: CopilotSuggestion;
  onDecide: (s: CopilotSuggestion, d: CopilotDecisionCommand) => void;
  decisionDisabled: boolean;
  projectId: string;
}) {
  // Always fetch the fresh detail by id (list -> detail round-trip). Falls back
  // to the list row while loading so the panel never blanks.
  const detailQuery = useCopilotSuggestion(suggestion.id);
  const s = detailQuery.data?.suggestion ?? suggestion;
  const isSuggested = s.state === "SUGGESTED";

  return (
    <HanaCard
      title={s.title}
      eyebrow={`${s.kind} · ${kindKo[s.kind]}`}
      emphasis="default"
    >
      <CardBody>
        <BadgeRow>
          <StatusBadge token={s.state} />
          <StatusBadge token={s.confidence_label} tone={confidenceTone(s.confidence_label)} />
          <StatusBadge token={s.risk_label} tone={riskTone(s.risk_label)} />
        </BadgeRow>

        <DimTitle>제안 이유 (Why)</DimTitle>
        <Muted>{s.rationale}</Muted>

        <DimTitle>예상 다음 단계</DimTitle>
        <Muted>{s.expected_next_step}</Muted>

        <RoutingCard>
          <DimTitle>
            <ArrowRight aria-hidden="true" size={14} /> 이동 대상 (실행 아님 · 게이트 미통과)
          </DimTitle>
          <KeyValue>
            <dt>목적지</dt>
            <dd>{routingKindKo[s.routing_target.kind]}</dd>
            <dt>사람이 거치는 게이트</dt>
            <dd>{routingGate[s.routing_target.kind]}</dd>
          </KeyValue>
          <RoutingNote>{s.routing_target.human_gate_note}</RoutingNote>
          {s.routing_target.governance_change_request_draft_prefill ? (
            <PrefillBlock target={s.routing_target} />
          ) : null}
        </RoutingCard>

        <DimTitle>원천 근거 (Grounding)</DimTitle>
        {s.source_artifacts.length === 0 ? (
          <ErrorRow role="alert">
            <AlertTriangle aria-hidden="true" size={14} />
            <span>근거 없는 제안은 표시할 수 없습니다.</span>
          </ErrorRow>
        ) : (
          <SourceList>
            {s.source_artifacts.map((a) => (
              <li key={a.artifact_id}>
                <HanaBadge tone="neutral">
                  {a.artifact_type} · {artifactTypeKo[a.artifact_type]}
                </HanaBadge>{" "}
                <code>{a.artifact_id}</code>
                {a.evidence_refs && a.evidence_refs.length > 0 && a.evidence_refs[0].quote ? (
                  <Quote>“{a.evidence_refs[0].quote}”</Quote>
                ) : null}
              </li>
            ))}
          </SourceList>
        )}

        {isSuggested ? (
          <DecisionBar>
            <HanaButton type="button" onClick={() => onDecide(s, "ACCEPT")} disabled={decisionDisabled}>
              채택 (ACCEPT) — 게이트로 이동
            </HanaButton>
            <HanaButton type="button" variant="ghost" onClick={() => onDecide(s, "DISMISS")} disabled={decisionDisabled}>
              기각 (DISMISS)
            </HanaButton>
          </DecisionBar>
        ) : s.decision_audit_note ? (
          <DecidedNote>
            <StatusBadge token={s.state} />
            <div>
              <strong>이미 결정된 제안입니다 (이력).</strong>
              <p>
                {s.decision_audit_note.decision} · {formatDate(s.decision_audit_note.decided_at)}
                {s.decision_audit_note.dismiss_reason_code
                  ? ` · 사유: ${dismissReasonKo[s.decision_audit_note.dismiss_reason_code]}`
                  : ""}
              </p>
              {s.decision_audit_note.routing_target ? (
                <Link to={s.decision_audit_note.routing_target.deep_link}>이동 대상으로 가기 →</Link>
              ) : null}
              <p>
                <Link to={`/projects/${projectId}/copilot`}>결정 이력에서 보기</Link>
              </p>
            </div>
          </DecidedNote>
        ) : (
          <DecidedNote>
            <StatusBadge token={s.state} />
            <div>
              <strong>대체된 제안입니다.</strong>
              <p>이 제안은 더 최신 제안으로 대체되어 읽기 전용 이력으로만 표시됩니다. 채택/기각할 수 없습니다.</p>
            </div>
          </DecidedNote>
        )}
      </CardBody>
    </HanaCard>
  );
}

function PrefillBlock({ target }: { target: CopilotRoutingTarget }) {
  const prefill = target.governance_change_request_draft_prefill;
  if (!prefill) return null;
  return (
    <PrefillCard>
      <DimTitle>미리 채워진 초안 (사용자가 생성 화면에서 수정 후 제출)</DimTitle>
      <KeyValue>
        <dt>대상 종류</dt>
        <dd>
          <HanaBadge tone="neutral">{prefill.target_kind}</HanaBadge>
        </dd>
        <dt>변경 유형</dt>
        <dd>
          <HanaBadge tone="neutral">{prefill.change_type}</HanaBadge>
        </dd>
        <dt>제안 제목</dt>
        <dd>{prefill.proposed_title ?? "—"}</dd>
        <dt>대상 요소</dt>
        <dd>{prefill.element_refs.map((e) => e.label ?? e.element_id).join(", ") || "—"}</dd>
      </KeyValue>
      <Muted>코파일럿은 이 변경요청을 생성하지 않습니다. 초안을 열 뿐입니다.</Muted>
    </PrefillCard>
  );
}

// ---- Decision History view ----

function HistoryView({ suggestions }: { suggestions: CopilotSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <PageState
        kind="empty"
        title="아직 결정 이력이 없습니다"
        description="채택(ACCEPT) 또는 기각(DISMISS) 결정을 아직 기록하지 않았습니다."
      />
    );
  }
  return (
    <Stack>
      {suggestions.map((s) => {
        const note = s.decision_audit_note!;
        return (
          <HanaCard key={note.id} title={s.title} eyebrow={`${s.kind} · ${kindKo[s.kind]}`} emphasis="default">
            <CardBody>
              <BadgeRow>
                <StatusBadge token={note.decision === "ACCEPT" ? "ACCEPTED" : "DISMISSED"} />
                <Muted as="span">{formatDate(note.decided_at)}</Muted>
              </BadgeRow>
              <KeyValue>
                <dt>결정</dt>
                <dd>{note.decision}</dd>
                <dt>행위자</dt>
                <dd>
                  {note.actor_id} · {note.actor_role}
                </dd>
                {note.dismiss_reason_code ? (
                  <>
                    <dt>기각 사유</dt>
                    <dd>{dismissReasonKo[note.dismiss_reason_code]}</dd>
                  </>
                ) : null}
                {note.note ? (
                  <>
                    <dt>메모</dt>
                    <dd>{note.note}</dd>
                  </>
                ) : null}
                <dt>근거 아티팩트</dt>
                <dd>{note.source_artifact_ids.join(", ") || "—"}</dd>
              </KeyValue>
              {note.routing_target ? (
                <RoutingNote>
                  이동 대상: {routingKindKo[note.routing_target.kind]} —{" "}
                  <Link to={note.routing_target.deep_link}>이동하기 →</Link> (코파일럿은 아무것도 실행하지 않았습니다)
                </RoutingNote>
              ) : null}
              <GuardProof guard={note.mutation_guard} compact />
            </CardBody>
          </HanaCard>
        );
      })}
    </Stack>
  );
}

// ---- Decision modal (Accept routes / Dismiss requires reason) ----

function DecisionModal({
  suggestion,
  decision,
  dismissReason,
  setDismissReason,
  note,
  setNote,
  error,
  pending,
  onCancel,
  onConfirm,
}: {
  suggestion: CopilotSuggestion;
  decision: CopilotDecisionCommand;
  dismissReason: CopilotDismissReasonCode;
  setDismissReason: (r: CopilotDismissReasonCode) => void;
  note: string;
  setNote: (n: string) => void;
  error: string | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isAccept = decision === "ACCEPT";
  return (
    <Overlay role="dialog" aria-modal="true" aria-label={isAccept ? "제안 채택" : "제안 기각"}>
      <Modal>
        <ModalHead>
          <h3>{isAccept ? "제안 채택 (ACCEPT)" : "제안 기각 (DISMISS)"}</h3>
          <IconButton type="button" onClick={onCancel} aria-label="닫기">
            <X aria-hidden="true" size={18} />
          </IconButton>
        </ModalHead>
        <ModalBody>
          <Muted>{suggestion.title}</Muted>
          {isAccept ? (
            <AcceptCopy>
              채택은 사용자의 의도를 <strong>기록</strong>하고 기존 게이트 흐름으로 <strong>이동</strong>할 뿐입니다.
              코파일럿은 생성·승인·적용·게시·실행을 하지 않습니다. 이동 후에도 <strong>{routingGate[suggestion.routing_target.kind]}</strong>{" "}
              단계를 사람이 모두 거칩니다.
            </AcceptCopy>
          ) : (
            <>
              <DimTitle>기각 사유 (필수)</DimTitle>
              <ReasonGrid>
                {dismissReasonCodes.map((code) => (
                  <ReasonOption key={code} data-active={dismissReason === code}>
                    <input
                      type="radio"
                      name="dismiss-reason"
                      value={code}
                      checked={dismissReason === code}
                      onChange={() => setDismissReason(code)}
                    />
                    <span>
                      {code} · {dismissReasonKo[code]}
                    </span>
                  </ReasonOption>
                ))}
              </ReasonGrid>
            </>
          )}
          <DimTitle>메모 {(!isAccept && dismissReason === "OTHER") ? "(기타 사유 시 필수)" : "(선택)"}</DimTitle>
          <NoteInput
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="결정에 대한 메모 (감사 기록에 저장됩니다)"
            rows={3}
          />
          <BoundaryNote>
            이 결정은 감사 기록만 남깁니다. 후보·게시 그래프·프롬프트·온톨로지·거버넌스·정책·추출·평가·모델 실행 상태는
            변경되지 않습니다{isAccept ? " (채택 시 이동 대상 설명만 반환됩니다)" : ""}.
          </BoundaryNote>
          {error ? (
            <ErrorRow role="alert">
              <AlertTriangle aria-hidden="true" size={16} />
              <span>{error}</span>
            </ErrorRow>
          ) : null}
        </ModalBody>
        <ModalFoot>
          <HanaButton type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            취소
          </HanaButton>
          <HanaButton type="button" onClick={onConfirm} disabled={pending}>
            {pending ? "기록 중…" : isAccept ? "채택하고 이동" : "기각"}
          </HanaButton>
        </ModalFoot>
      </Modal>
    </Overlay>
  );
}

// ---- Guard proof line (reads flags FROM the response, never hardcoded) ----

function GuardProof({ guard, compact }: { guard: CopilotMutationGuard; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <ProofBlock data-compact={compact ? "true" : "false"}>
      <ProofHead type="button" onClick={() => setOpen((v) => !v)}>
        <ShieldCheck aria-hidden="true" size={14} />
        <span>이 응답은 아무것도 실행/변경하지 않았습니다 — 14개 mutation 플래그 모두 false</span>
        <em>{open ? "접기" : "증거 보기"}</em>
      </ProofHead>
      {open ? (
        <ProofGrid>
          {GUARD_FLAGS.map((flag) => {
            const emphasized = flag === "copilot_executed_action" || flag === "real_model_invoked";
            return (
              <ProofFlag key={flag} data-emphasized={emphasized ? "true" : "false"}>
                <code>{flag}</code>
                <b>{String(guard[flag])}</b>
              </ProofFlag>
            );
          })}
        </ProofGrid>
      ) : null}
    </ProofBlock>
  );
}

// ---- styled ----

const AdvisoryBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.primary};
    margin-top: 2px;
  }

  strong {
    display: block;
  }

  p {
    margin: ${({ theme }) => theme.spacing.xs} 0 ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    overflow-wrap: anywhere;
  }

  > div {
    min-width: 0;
  }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ProofBlock = styled.div`
  margin: ${({ theme }) => theme.spacing.sm} 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  &[data-compact="true"] {
    margin: ${({ theme }) => theme.spacing.sm} 0 0;
    background: transparent;
  }
`;

const ProofHead = styled.button`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: left;
  cursor: pointer;

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  em {
    font-style: normal;
    color: ${({ theme }) => theme.color.primary};
  }

  svg {
    flex-shrink: 0;
  }
`;

const ProofGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const ProofFlag = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  code {
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.color.textMuted};
  }

  b {
    color: ${({ theme }) => theme.color.positive};
  }

  &[data-emphasized="true"] {
    background: ${({ theme }) => theme.color.positiveSoft};

    code {
      color: ${({ theme }) => theme.color.text};
      font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    }
  }
`;

const SectionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SectionTab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  em {
    padding: 0 8px;
    border-radius: 999px;
    background: ${({ theme }) => theme.color.surfaceMuted};
    font-style: normal;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }

  &[data-active="true"] {
    border-color: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }
`;

const StrongSummary = styled.section`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceStrong};
  color: ${({ theme }) => theme.color.textOnStrong};

  span {
    color: #94a3b8;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  h2 {
    margin: ${({ theme }) => theme.spacing.sm} 0;
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  p {
    margin: 0;
    max-width: 520px;
    color: #cbd5e1;
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }

  > div {
    min-width: 0;
  }

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const BadgeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const KindCountRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  strong {
    font-variant-numeric: tabular-nums;
  }
`;

const NoteList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};

  li {
    overflow-wrap: anywhere;
  }
`;

const SplitLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Queue = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

const QueueCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  text-align: left;
  cursor: pointer;

  &[data-selected="true"] {
    border-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }
`;

const QueueHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const QueueKind = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;

  span {
    overflow-wrap: anywhere;
  }
`;

const QueueTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  overflow-wrap: anywhere;
`;

const GroundingChip = styled.span`
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  overflow-wrap: anywhere;
`;

const DetailPanel = styled.div`
  min-width: 0;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const DimTitle = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const RoutingCard = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const RoutingNote = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;
`;

const PrefillCard = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px dashed ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const SourceList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  li {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    overflow-wrap: anywhere;
  }

  code {
    overflow-wrap: anywhere;
  }
`;

const Quote = styled.div`
  margin-top: 2px;
  font-style: italic;
  overflow-wrap: anywhere;
`;

const DecisionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const DecidedNote = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  p {
    margin: ${({ theme }) => theme.spacing.xs} 0 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    overflow-wrap: anywhere;
  }

  > div {
    min-width: 0;
  }
`;

const ErrorRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.danger};
  border-radius: ${({ theme }) => theme.radius.sm};

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.danger};
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: rgba(15, 23, 42, 0.5);
`;

const Modal = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: auto;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  padding: 4px;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.textMuted};
  cursor: pointer;
`;

const ModalBody = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const AcceptCopy = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0;
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;
`;

const ReasonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.xs};

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const ReasonOption = styled.label`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;

  span {
    overflow-wrap: anywhere;
  }

  &[data-active="true"] {
    border-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }
`;

const NoteInput = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font: inherit;
  resize: vertical;
`;

const BoundaryNote = styled.p`
  margin: ${({ theme }) => theme.spacing.md} 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;
`;

const ModalFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;
