import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Info, Lock, MessageSquare, ShieldCheck } from "lucide-react";
import styled from "styled-components";
import {
  useApplyOntologyChangeRequest,
  useChangeRequestApplicationAudit,
  useChangeRequestApplicationStatus,
  useChangeRequestAudit,
  useOntologyChangeRequestDetail,
  useProject,
  useRecordGovernanceReviewDecision,
  useWithdrawOntologyChangeRequest,
} from "../shared/api/queries";
import { GovernanceError } from "../shared/api/client";
import {
  ApplicationItemPreview,
  GovernanceApplicationAuditEntry,
  GovernanceApplicationStatusResponse,
  GovernanceAuditEntry,
  GovernanceCapabilities,
  GovernanceReviewAction,
  GovernanceReviewDecision,
  OntologyChangeItem,
  OntologyChangeRequest,
  OntologyElementRef,
} from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { CardBody, Muted, SectionStack } from "../shared/ui/platform/Section";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CompactTable, KeyValue } from "./mvp3Shared";
import { PageActions } from "./mvp4Shared";
import {
  ApplicationStateBadge,
  ApprovalIntentBanner,
  ChangeRequestStatusBadge,
  applicationAuditActionKo,
  applyChangeTypeEffectKo,
  auditActionKo,
  changeTypeKo,
  formatGovernanceDate,
  reviewActionKo,
  targetKindKo,
} from "./governanceShared";
import { ImpactSimulationSection } from "./governanceImpact";

// MVP6.5 Change-request detail — the single working surface for review + decision.
// Summary + permission band + change items + review thread + decision panel +
// audit trail (disclosure-collapsed). NO 적용/게시 CTA. The persistent
// approval-is-intent banner is rendered here as on the board.

function elementRef(item: OntologyChangeItem): string {
  return item.ontology_class_id ?? item.ontology_property_id ?? item.ontology_relation_id ?? "";
}

export function GovernanceDetailPage() {
  const { projectId = "", changeRequestId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const detailQuery = useOntologyChangeRequestDetail(changeRequestId);
  const auditQuery = useChangeRequestAudit(changeRequestId);
  const recordDecision = useRecordGovernanceReviewDecision(changeRequestId);
  const withdraw = useWithdrawOntologyChangeRequest(changeRequestId);

  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const detail = detailQuery.data;
  const capabilities = detail?.capabilities;
  const changeRequest = detail?.change_request;

  // Audit is delivered chronological ascending (G4); reverse for newest-first.
  const auditEntries = useMemo(
    () => [...(auditQuery.data?.items ?? [])].reverse(),
    [auditQuery.data],
  );

  if (!changeRequestId) {
    return <PageState kind="error" title="변경 요청을 찾을 수 없습니다" description="유효한 변경 요청 컨텍스트가 필요합니다." />;
  }
  if (projectQuery.isLoading || detailQuery.isLoading) {
    return (
      <PageState kind="loading" title="변경 요청을 불러오는 중입니다" description="요약, 변경 항목, 검토 스레드, 감사 기록을 준비하고 있습니다." />
    );
  }
  if (detailQuery.isError || !detail || !changeRequest) {
    return (
      <PageState
        kind="error"
        title="변경 요청을 불러오지 못했습니다"
        description="이 변경 요청을 사용할 수 없습니다. 다시 시도하세요."
        actionLabel="다시 시도"
        onAction={() => detailQuery.refetch()}
      />
    );
  }

  const handleDecision = (action: GovernanceReviewAction) => {
    setConflict(null);
    setNotice(null);
    recordDecision.mutate(
      { action, reason: reason.trim() || null },
      {
        onSuccess: (response) => {
          setReason("");
          if (action === "APPROVE") {
            setNotice(
              "승인되어 큐잉(QUEUED)되었습니다. 온톨로지·후보·게시 그래프·프롬프트는 변경되지 않았습니다. 실제 적용은 이후 별도 단계에서 이뤄집니다.",
            );
          } else {
            setNotice(`결정을 기록했습니다 (${reviewActionKo[action]}). 온톨로지·게시 그래프는 변경되지 않았습니다.`);
          }
          void response;
        },
        onError: (err) => {
          if (err instanceof GovernanceError && err.status === 409) {
            setConflict("이 요청의 상태가 변경되어 결정을 기록할 수 없습니다. 새로고침 후 다시 시도하세요.");
          } else if (err instanceof GovernanceError && err.code === "SELF_APPROVAL_FORBIDDEN") {
            setConflict("본인이 제안한 요청은 승인할 수 없습니다 (직무 분리).");
          } else if (err instanceof GovernanceError && err.code === "REASON_REQUIRED") {
            setConflict("이 결정에는 사유가 필요합니다.");
          } else {
            setConflict("결정을 기록하지 못했습니다.");
          }
        },
      },
    );
  };

  const handleWithdraw = () => {
    setConflict(null);
    withdraw.mutate(
      { reason: reason.trim() || null },
      {
        onSuccess: () => setNotice("요청을 철회했습니다."),
        onError: () => setConflict("요청을 철회하지 못했습니다."),
      },
    );
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` },
          { label: "Governance", to: `/projects/${projectId}/governance` },
          { label: `변경 요청 #${changeRequest.id}` },
        ]}
      />
      <PageHeader title={changeRequest.title} description={changeRequest.summary ?? "요약 없음"} eyebrow="GOVERNANCE · 변경 요청">
        <PageActions>
          <ChangeRequestStatusBadge status={changeRequest.status} />
          <ApplicationStateBadge state={changeRequest.application_state} />
        </PageActions>
      </PageHeader>

      <ApprovalIntentBanner />

      {notice ? (
        <NoticeBand role="status">
          <ShieldCheck aria-hidden="true" size={16} />
          <span>{notice}</span>
        </NoticeBand>
      ) : null}
      {conflict ? (
        <ConflictBand role="alert">
          <Info aria-hidden="true" size={16} />
          <span>{conflict}</span>
          <HanaButton type="button" onClick={() => detailQuery.refetch()}>
            새로고침
          </HanaButton>
        </ConflictBand>
      ) : null}

      <PermissionBand capabilities={capabilities} />

      <SectionStack>
        <HanaCard title="요청 요약" emphasis="summary" eyebrow="SUMMARY">
          <CardBody>
            <KeyValue>
              <dt>ID</dt>
              <dd>{changeRequest.id}</dd>
              <dt>상태</dt>
              <dd><ChangeRequestStatusBadge status={changeRequest.status} /></dd>
              <dt>적용 상태</dt>
              <dd><ApplicationStateBadge state={changeRequest.application_state} /></dd>
              <dt>제안자</dt>
              <dd>{changeRequest.proposer_id}</dd>
              <dt>변경 항목 수</dt>
              <dd>{changeRequest.item_count}</dd>
              <dt>온톨로지 버전</dt>
              <dd>{changeRequest.ontology_version_id ?? "미지정"}</dd>
              <dt>생성</dt>
              <dd>{formatGovernanceDate(changeRequest.created_at)}</dd>
              {changeRequest.decided_by ? (
                <>
                  <dt>결정자</dt>
                  <dd>{changeRequest.decided_by}</dd>
                  <dt>결정 사유</dt>
                  <dd>{changeRequest.decision_reason ?? "—"}</dd>
                </>
              ) : null}
            </KeyValue>
          </CardBody>
        </HanaCard>

        <ChangeItemsSection items={detail.items} />

        <ImpactSimulationSection changeRequestId={changeRequestId} />

        {changeRequest.status === "APPROVED" ? (
          <ApplicationBlock changeRequestId={changeRequestId} changeRequest={changeRequest} />
        ) : null}

        <ReviewThreadSection reviews={detail.reviews} />

        <DecisionPanel
          changeRequest={changeRequest}
          capabilities={capabilities}
          reason={reason}
          onReasonChange={setReason}
          onDecision={handleDecision}
          onWithdraw={handleWithdraw}
          busy={recordDecision.isPending || withdraw.isPending}
        />

        <AuditTrailSection entries={auditEntries} isLoading={auditQuery.isLoading} />
      </SectionStack>
    </>
  );
}

function PermissionBand({ capabilities }: { capabilities?: GovernanceCapabilities }) {
  const canDecide = Boolean(capabilities?.can_approve || capabilities?.can_reject);
  const canReview = Boolean(capabilities?.can_comment || capabilities?.can_request_changes);
  if (canDecide) {
    return (
      <PermissionRow data-tone="approver">
        <ShieldCheck aria-hidden="true" size={16} />
        <span>승인자 권한 — 승인 · 반려 · 검토 의견을 기록할 수 있습니다. 본인이 제안한 요청은 승인할 수 없습니다 (직무 분리).</span>
      </PermissionRow>
    );
  }
  if (canReview) {
    return (
      <PermissionRow data-tone="reviewer">
        <MessageSquare aria-hidden="true" size={16} />
        <span>검토자 권한 — 의견 추가 · 변경 요청이 가능합니다. 승인 · 반려는 온톨로지 관리자 · 프로젝트 관리자 · 시스템 관리자만 가능합니다.</span>
      </PermissionRow>
    );
  }
  return (
    <PermissionRow data-tone="limited">
      <StatusBadge token="PERMISSION_LIMITED" />
      <span>승인 · 반려는 온톨로지 관리자 · 프로젝트 관리자 · 시스템 관리자만 가능합니다. 읽기 전용으로 표시됩니다.</span>
    </PermissionRow>
  );
}

function ChangeItemsSection({ items }: { items: OntologyChangeItem[] }) {
  if (items.length === 0) {
    return (
      <HanaCard title="변경 항목" emphasis="default">
        <CardBody>
          <Muted>이 요청에는 아직 변경 항목이 없습니다.</Muted>
        </CardBody>
      </HanaCard>
    );
  }
  return (
    <HanaCard title="변경 항목" description="대상 요소는 참조용으로만 표시되며 편집되지 않습니다" emphasis="default">
      <CardBody>
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>대상 종류</th>
                <th>변경 유형</th>
                <th>대상 요소</th>
                <th>온톨로지 버전</th>
                <th>제안 내용 (의도)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><HanaBadge tone="neutral">{item.target_kind} · {targetKindKo[item.target_kind]}</HanaBadge></td>
                  <td><HanaBadge tone="neutral">{item.change_type} · {changeTypeKo[item.change_type]}</HanaBadge></td>
                  <td>{item.change_type === "ADD" ? <Muted as="span">추가 — 대상 없음</Muted> : elementRef(item) || "—"}</td>
                  <td>{item.ontology_version_id}</td>
                  <td>{proposedChangeLabel(item.proposed_change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CompactTable>
      </CardBody>
    </HanaCard>
  );
}

function ReviewThreadSection({ reviews }: { reviews: GovernanceReviewDecision[] }) {
  return (
    <HanaCard title="검토 스레드" description="의견 · 변경 요청 · 결정 (시간순)" emphasis="default">
      <details>
        <summary>검토 스레드 보기 ({reviews.length})</summary>
        {reviews.length === 0 ? (
          <CardBody><Muted>아직 검토 활동이 없습니다.</Muted></CardBody>
        ) : (
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>시각</th>
                  <th>작성자</th>
                  <th>액션</th>
                  <th>사유 / 의견</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td>{formatGovernanceDate(review.created_at)}</td>
                    <td>{review.actor_id}{review.actor_role ? ` · ${review.actor_role}` : ""}</td>
                    <td><HanaBadge tone="neutral">{review.action} · {reviewActionKo[review.action]}</HanaBadge></td>
                    <td>{review.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        )}
      </details>
    </HanaCard>
  );
}

function DecisionPanel({
  changeRequest,
  capabilities,
  reason,
  onReasonChange,
  onDecision,
  onWithdraw,
  busy,
}: {
  changeRequest: OntologyChangeRequest;
  capabilities?: GovernanceCapabilities;
  reason: string;
  onReasonChange: (value: string) => void;
  onDecision: (action: GovernanceReviewAction) => void;
  onWithdraw: () => void;
  busy: boolean;
}) {
  const reviewable = changeRequest.status === "OPEN" || changeRequest.status === "IN_REVIEW";
  const withdrawable = ["DRAFT", "OPEN", "IN_REVIEW"].includes(changeRequest.status);
  const hasReason = reason.trim().length > 0;

  const canComment = Boolean(capabilities?.can_comment) && reviewable;
  const canRequestChanges = Boolean(capabilities?.can_request_changes) && reviewable;
  const canApprove = Boolean(capabilities?.can_approve) && reviewable;
  const canReject = Boolean(capabilities?.can_reject) && reviewable;
  const canWithdraw = Boolean(capabilities?.can_withdraw) && withdrawable;

  const noReviewControls = !canComment && !canRequestChanges && !canApprove && !canReject && !canWithdraw;

  if (!reviewable && !withdrawable) {
    return (
      <HanaCard title="결정" description="이 요청은 종료 상태입니다" emphasis="default">
        <CardBody>
          <Muted>이 변경 요청은 {changeRequest.status} 상태로 더 이상 결정을 기록할 수 없습니다.</Muted>
        </CardBody>
      </HanaCard>
    );
  }

  return (
    <HanaCard title="결정" description="사유 입력 — 변경 요청 · 승인 · 반려에는 사유가 필요합니다" emphasis="default">
      <CardBody>
        {noReviewControls ? (
          <PermissionInline>
            <StatusBadge token="PERMISSION_LIMITED" />
            <span>이 요청에 대해 기록할 수 있는 결정 작업이 없습니다.</span>
          </PermissionInline>
        ) : (
          <>
            <label>
              <FieldLabel>사유 / 정당화</FieldLabel>
              <ReasonArea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={2}
                placeholder="변경 요청 · 승인 · 반려 시 필수. 의견은 사유 없이도 가능합니다."
              />
            </label>
            <ActionRow>
              {/* Approver: primary 승인. */}
              {canApprove ? (
                <HanaButton type="button" variant="primary" onClick={() => onDecision("APPROVE")} disabled={!hasReason || busy}>
                  {reviewActionKo.APPROVE}
                </HanaButton>
              ) : null}
              {/* Reviewer (non-approver): primary 변경 요청. */}
              {!canApprove && canRequestChanges ? (
                <HanaButton type="button" variant="primary" onClick={() => onDecision("REQUEST_CHANGES")} disabled={!hasReason || busy}>
                  {reviewActionKo.REQUEST_CHANGES}
                </HanaButton>
              ) : null}
              {canReject ? (
                <HanaButton type="button" onClick={() => onDecision("REJECT")} disabled={!hasReason || busy}>
                  {reviewActionKo.REJECT}
                </HanaButton>
              ) : null}
              {canApprove && canRequestChanges ? (
                <HanaButton type="button" onClick={() => onDecision("REQUEST_CHANGES")} disabled={!hasReason || busy}>
                  {reviewActionKo.REQUEST_CHANGES}
                </HanaButton>
              ) : null}
              {canComment ? (
                <HanaButton type="button" onClick={() => onDecision("COMMENT")} disabled={busy}>
                  {reviewActionKo.COMMENT}
                </HanaButton>
              ) : null}
              {canWithdraw ? (
                <HanaButton type="button" onClick={onWithdraw} disabled={busy}>
                  요청 철회
                </HanaButton>
              ) : null}
            </ActionRow>
            {/* Segregation of duties: proposer's own-request approve is pre-disabled. */}
            {reviewable && !canApprove && capabilities?.can_reject ? (
              <SegregationCopy>
                <Lock aria-hidden="true" size={14} /> 본인이 제안한 요청은 승인할 수 없습니다 (직무 분리).
              </SegregationCopy>
            ) : null}
          </>
        )}
        <ProofLine>
          <Info aria-hidden="true" size={14} /> 이 결정은 온톨로지 · 후보 · 게시 그래프 · 프롬프트를 변경하지 않습니다.
        </ProofLine>
      </CardBody>
    </HanaCard>
  );
}

function AuditTrailSection({ entries, isLoading }: { entries: GovernanceAuditEntry[]; isLoading: boolean }) {
  return (
    <HanaCard title="감사 추적" description="actor · action · 상태 전이 · 사유 · 시각 (최신순)" emphasis="default">
      <details>
        <summary>감사 추적 보기 ({entries.length})</summary>
        {isLoading ? (
          <CardBody><Muted>감사 기록을 불러오는 중입니다.</Muted></CardBody>
        ) : entries.length === 0 ? (
          <CardBody><Muted>감사 기록이 없습니다.</Muted></CardBody>
        ) : (
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>시각</th>
                  <th>작성자</th>
                  <th>액션</th>
                  <th>상태 전이</th>
                  <th>사유</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatGovernanceDate(entry.created_at)}</td>
                    <td>{entry.actor_id}{entry.actor_role ? ` · ${entry.actor_role}` : ""}</td>
                    <td><HanaBadge tone="neutral">{entry.action} · {auditActionKo[entry.action]}</HanaBadge></td>
                    <td>{entry.before_status ?? "—"} → {entry.after_status ?? "—"}</td>
                    <td>{entry.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        )}
      </details>
    </HanaCard>
  );
}

// ---- MVP6.6 Governance change application block (APPROVED-only) ----
// Read-only pre-check panel + apply action behind a human-confirmation modal +
// APPLIED/SUPERSEDED states + applied-not-published banner + one-true-flag proof
// line + application audit. Apply mutates ONLY a DRAFT ontology version; publish
// is a separate MVP3 step. No 게시/배포/apply-and-publish affordance exists here.

function elementRefLabel(ref?: OntologyElementRef | null): string {
  if (!ref) return "없음";
  const id = ref.ontology_class_id ?? ref.ontology_property_id ?? ref.ontology_relation_id;
  return id ? `${id}${ref.status ? ` (${ref.status})` : ""}` : ref.status ?? "—";
}

// Non-destructive apply-failure notices (409/403). Nothing is applied.
const APPLY_ERROR_COPY: Record<string, string> = {
  CHANGE_REQUEST_SUPERSEDED:
    "승인 시점 이후 대상 초안이 변경되어 적용할 수 없습니다. 아무 것도 변경되지 않았으며 요청이 대체됨(SUPERSEDED) 상태가 되었습니다. 재적용하려면 다시 제안·승인해야 합니다.",
  CHANGE_ALREADY_APPLIED: "이 변경 요청은 이미 적용되었습니다. 다시 적용할 수 없습니다.",
  CHANGE_NOT_APPLICABLE: "이 요청은 적용 가능한 상태(승인됨 + 큐잉됨)가 아닙니다.",
  APPLY_TARGET_NOT_DRAFT:
    "적용 대상은 DRAFT 온톨로지 버전이어야 합니다. 게시된/보관된 버전에는 적용할 수 없습니다.",
  PERMISSION_DENIED: "적용은 온톨로지 관리자 · 프로젝트 관리자 · 시스템 관리자만 가능합니다.",
};

function ApplicationBlock({
  changeRequestId,
  changeRequest,
}: {
  changeRequestId: string;
  changeRequest: OntologyChangeRequest;
}) {
  const applicationState = changeRequest.application_state;
  const isQueued = applicationState === "QUEUED";
  const isApplied = applicationState === "APPLIED";
  const isSuperseded = applicationState === "SUPERSEDED";

  const statusQuery = useChangeRequestApplicationStatus(changeRequestId, isQueued);
  const auditQuery = useChangeRequestApplicationAudit(changeRequestId, isApplied || isSuperseded);
  const apply = useApplyOntologyChangeRequest(changeRequestId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyNotice, setApplyNotice] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyGuardProof, setApplyGuardProof] = useState<GovernanceApplicationStatusResponse | null>(null);
  const [appliedTarget, setAppliedTarget] = useState<string | null>(null);
  const [appliedProof, setAppliedProof] = useState(false);

  const status = statusQuery.data;
  const canApply = Boolean(status?.capabilities.can_apply);
  const targetVersionId = status?.target_ontology_version_id ?? null;
  const targetIsDraft = status?.target_is_draft ?? true;
  const wouldSupersede = status?.would_supersede ?? false;
  const itemCount = status?.item_previews.length ?? changeRequest.item_count;

  const handleApply = () => {
    setApplyError(null);
    setApplyNotice(null);
    apply.mutate(
      { target_ontology_version_id: targetVersionId ?? undefined },
      {
        onSuccess: (response) => {
          setConfirmOpen(false);
          setAppliedTarget(response.target_ontology_version_id);
          // One-true-flag proof: ontology_draft_mutated must be the ONLY true flag.
          const g = response.mutation_guard;
          const others =
            g.published_graph_mutated ||
            g.candidate_graph_mutated ||
            g.prompt_version_mutated ||
            g.publish_job_started ||
            g.extraction_job_started ||
            g.evaluation_run_started;
          setAppliedProof(g.ontology_draft_mutated === true && !others);
          setApplyNotice(
            `초안 온톨로지 버전(${response.target_ontology_version_id})에 적용되었습니다. 게시 그래프는 변경되지 않았습니다.`,
          );
          void applyGuardProof;
        },
        onError: (err) => {
          setConfirmOpen(false);
          if (err instanceof GovernanceError) {
            setApplyError(APPLY_ERROR_COPY[err.code] ?? "적용하지 못했습니다. 잠시 후 다시 시도하세요.");
          } else {
            setApplyError("적용하지 못했습니다. 서버/네트워크 오류로 아무 것도 변경되지 않았습니다. 다시 시도하세요.");
          }
        },
      },
    );
  };

  return (
    <>
      {/* Applied-not-published banner (persistent once APPLIED). */}
      {isApplied ? (
        <AppliedBanner role="status">
          <CheckCircle2 aria-hidden="true" size={18} />
          <div>
            <strong>초안 온톨로지에 적용되었습니다 — 아직 게시되지 않았습니다.</strong>
            <p>
              승인된 변경 항목이 DRAFT 온톨로지 버전
              {appliedTarget ? ` (${appliedTarget})` : ""}에 적용되었습니다. 게시 그래프는 변경되지
              않았습니다. 게시하려면 게시 흐름에서 별도로 게시해야 합니다.
            </p>
            <ProofLine as="p" data-proof="apply">
              <Info aria-hidden="true" size={14} /> 이 적용은 DRAFT 온톨로지 버전만 변경했습니다
              (ontology_draft_mutated=true). 게시 그래프 · 후보 그래프 · 프롬프트 · 추출 · 평가 · 게시
              작업은 변경/시작되지 않았습니다.
              {appliedProof ? "" : " (경고: 예상과 다른 mutation 플래그가 감지되었습니다.)"}
            </ProofLine>
          </div>
        </AppliedBanner>
      ) : null}

      {/* SUPERSEDED terminal conflict notice. */}
      {isSuperseded ? (
        <ConflictBand role="alert">
          <AlertTriangle aria-hidden="true" size={16} />
          <span>{APPLY_ERROR_COPY.CHANGE_REQUEST_SUPERSEDED}</span>
        </ConflictBand>
      ) : null}

      {/* Apply-attempt outcome notices (non-destructive). */}
      {applyNotice ? (
        <NoticeBand role="status">
          <ShieldCheck aria-hidden="true" size={16} />
          <span>{applyNotice}</span>
        </NoticeBand>
      ) : null}
      {applyError ? (
        <ConflictBand role="alert">
          <AlertTriangle aria-hidden="true" size={16} />
          <span>{applyError}</span>
          <HanaButton type="button" onClick={() => statusQuery.refetch()}>
            새로고침
          </HanaButton>
        </ConflictBand>
      ) : null}

      {/* Read-only application-status pre-check (QUEUED only). */}
      {isQueued ? (
        <HanaCard
          title="적용 미리보기 (읽기 전용)"
          description="적용 대상 DRAFT 버전 · 항목별 전/후 · 대체 위험 힌트"
          eyebrow="APPLICATION PRE-CHECK"
          emphasis="default"
        >
          <CardBody>
            {statusQuery.isLoading ? (
              <Muted>적용 미리보기를 불러오는 중입니다.</Muted>
            ) : statusQuery.isError ? (
              <PermissionInline>
                <StatusBadge token="WARNING" koLabel="미리보기 사용 불가" tone="warning" />
                <span>적용 미리보기를 불러오지 못했습니다. 적용은 미리보기가 로드될 때까지 비활성화됩니다.</span>
              </PermissionInline>
            ) : status ? (
              <PreCheckBody
                status={status}
                targetVersionId={targetVersionId}
                targetIsDraft={targetIsDraft}
                wouldSupersede={wouldSupersede}
              />
            ) : null}
          </CardBody>
        </HanaCard>
      ) : null}

      {/* Apply action (QUEUED + can_apply only). Behind a human-confirmation modal. */}
      {isQueued ? (
        <HanaCard title="초안에 적용" description="승인된 변경 항목을 DRAFT 온톨로지 버전에만 적용합니다" emphasis="default">
          <CardBody>
            {statusQuery.isLoading ? (
              <Muted>권한 및 적용 가능 여부를 확인하는 중입니다.</Muted>
            ) : canApply ? (
              <>
                <ActionRow>
                  <HanaButton
                    type="button"
                    variant="primary"
                    onClick={() => setConfirmOpen(true)}
                    disabled={!targetIsDraft || apply.isPending}
                  >
                    초안에 적용
                  </HanaButton>
                </ActionRow>
                {!targetIsDraft ? (
                  <PermissionInline>
                    <StatusBadge token="APPLY_TARGET_NOT_DRAFT" koLabel="대상이 DRAFT 아님" tone="warning" />
                    <span>{APPLY_ERROR_COPY.APPLY_TARGET_NOT_DRAFT}</span>
                  </PermissionInline>
                ) : null}
                {wouldSupersede ? (
                  <PermissionInline>
                    <StatusBadge token="STALE" />
                    <span>
                      승인 시점 이후 대상 초안이 변경되어 적용 시 대체(SUPERSEDED)될 수 있습니다. 적용을 시도하면 아무
                      것도 변경되지 않고 요청이 대체됨 상태가 됩니다.
                    </span>
                  </PermissionInline>
                ) : null}
              </>
            ) : (
              <PermissionInline>
                <StatusBadge token="PERMISSION_LIMITED" />
                <span>적용은 온톨로지 관리자 · 프로젝트 관리자 · 시스템 관리자만 가능합니다.</span>
              </PermissionInline>
            )}
            <ProofLine>
              <Info aria-hidden="true" size={14} /> 이 미리보기는 읽기 전용이며 온톨로지 · 게시 그래프를 변경하지 않습니다.
            </ProofLine>
          </CardBody>
        </HanaCard>
      ) : null}

      {/* Human-confirmation modal — apply never fires on a single click. */}
      {confirmOpen ? (
        <ConfirmOverlay role="dialog" aria-modal="true" aria-labelledby="apply-confirm-title">
          <ConfirmCard>
            <h2 id="apply-confirm-title">초안에 적용하시겠습니까?</h2>
            <p>
              이 작업은 승인된 변경 항목을 DRAFT 온톨로지 버전에만 적용합니다. 게시 그래프는 변경되지 않으며, 게시는
              이후 별도 단계(게시 흐름)에서 별도로 수행해야 합니다.
            </p>
            <KeyValue>
              <dt>적용 대상 DRAFT 버전</dt>
              <dd>{targetVersionId ?? "프로젝트 현재 DRAFT"}</dd>
              <dt>적용 항목 수</dt>
              <dd>{itemCount}</dd>
            </KeyValue>
            {wouldSupersede ? (
              <ConfirmWarn>
                <AlertTriangle aria-hidden="true" size={14} /> 승인 이후 대상 초안이 변경되어 적용 시 대체(SUPERSEDED)될
                수 있습니다. 대체되면 아무 것도 변경되지 않습니다.
              </ConfirmWarn>
            ) : null}
            <ActionRow>
              <HanaButton type="button" variant="primary" onClick={handleApply} disabled={apply.isPending}>
                적용
              </HanaButton>
              <HanaButton type="button" onClick={() => setConfirmOpen(false)} disabled={apply.isPending}>
                취소
              </HanaButton>
            </ActionRow>
          </ConfirmCard>
        </ConfirmOverlay>
      ) : null}

      {/* Application audit (APPLIED / SUPERSEDED). */}
      {isApplied || isSuperseded ? (
        <ApplicationAuditSection entries={auditQuery.data?.items ?? []} isLoading={auditQuery.isLoading} />
      ) : null}
    </>
  );
}

function PreCheckBody({
  status,
  targetVersionId,
  targetIsDraft,
  wouldSupersede,
}: {
  status: GovernanceApplicationStatusResponse;
  targetVersionId: string | null;
  targetIsDraft: boolean;
  wouldSupersede: boolean;
}) {
  return (
    <>
      <KeyValue>
        <dt>적용 대상 DRAFT 버전</dt>
        <dd>
          {targetVersionId ?? "프로젝트 현재 DRAFT"}{" "}
          <StatusBadge
            token={status.target_version_status ?? "NOT_AVAILABLE"}
            tone={targetIsDraft ? undefined : "warning"}
          />
        </dd>
        <dt>적용 가능</dt>
        <dd>{status.applicable ? "예" : "아니오"}</dd>
      </KeyValue>
      {wouldSupersede ? (
        <PermissionInline>
          <StatusBadge token="STALE" />
          <span>
            승인 시점 이후 대상 초안이 변경되어 적용 시 대체(SUPERSEDED)될 수 있습니다. 적용을 시도하면 아무 것도
            변경되지 않고 요청이 대체됨 상태가 됩니다.
          </span>
        </PermissionInline>
      ) : null}
      {status.item_previews.length === 0 ? (
        <Muted>미리볼 변경 항목이 없습니다.</Muted>
      ) : (
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>대상 종류</th>
                <th>변경 유형</th>
                <th>의도된 효과</th>
                <th>전 (before)</th>
                <th>후 (after)</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {status.item_previews.map((preview: ApplicationItemPreview) => (
                <tr key={preview.change_item_id}>
                  <td><HanaBadge tone="neutral">{preview.target_kind} · {targetKindKo[preview.target_kind]}</HanaBadge></td>
                  <td><HanaBadge tone="neutral">{preview.change_type} · {changeTypeKo[preview.change_type]}</HanaBadge></td>
                  <td>{applyChangeTypeEffectKo[preview.change_type]}</td>
                  <td>{elementRefLabel(preview.before_ref)}</td>
                  <td>{elementRefLabel(preview.after_ref)}</td>
                  <td>{preview.stale ? <StatusBadge token="STALE" /> : <Muted as="span">최신</Muted>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CompactTable>
      )}
      <ProofLine>
        <Info aria-hidden="true" size={14} /> 이 미리보기는 읽기 전용이며 온톨로지 · 게시 그래프를 변경하지 않습니다.
      </ProofLine>
    </>
  );
}

function ApplicationAuditSection({
  entries,
  isLoading,
}: {
  entries: GovernanceApplicationAuditEntry[];
  isLoading: boolean;
}) {
  // Wire order ascending; newest-first for display.
  const rows = [...entries].reverse();
  return (
    <HanaCard title="적용 감사 추적" description="적용 · 대체 이벤트 · actor · 대상 DRAFT 버전 · 전/후 요소 (최신순)" emphasis="default">
      <details>
        <summary>적용 감사 추적 보기 ({rows.length})</summary>
        {isLoading ? (
          <CardBody><Muted>적용 감사 기록을 불러오는 중입니다.</Muted></CardBody>
        ) : rows.length === 0 ? (
          <CardBody><Muted>적용 감사 기록이 없습니다.</Muted></CardBody>
        ) : (
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>시각</th>
                  <th>작성자</th>
                  <th>액션</th>
                  <th>대상 DRAFT 버전</th>
                  <th>적용 항목</th>
                  <th>상태 전이</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatGovernanceDate(entry.created_at)}</td>
                    <td>{entry.actor_id}{entry.actor_role ? ` · ${entry.actor_role}` : ""}</td>
                    <td><HanaBadge tone="neutral">{entry.action} · {applicationAuditActionKo[entry.action]}</HanaBadge></td>
                    <td>{entry.target_ontology_version_id ?? "—"}</td>
                    <td>{(entry.applied_item_ids ?? []).length > 0 ? (entry.applied_item_ids ?? []).join(", ") : "—"}</td>
                    <td>{entry.before_application_state ?? "—"} → {entry.after_application_state ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        )}
      </details>
    </HanaCard>
  );
}

function proposedChangeLabel(payload?: Record<string, unknown>): string {
  if (!payload || Object.keys(payload).length === 0) {
    return "—";
  }
  if (typeof payload.note === "string") {
    return payload.note;
  }
  return JSON.stringify(payload);
}

const NoticeBand = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const ConflictBand = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warning ?? theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const PermissionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  &[data-tone="limited"] {
    background: ${({ theme }) => theme.color.surface};
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const PermissionInline = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    overflow-wrap: anywhere;
  }
`;

const FieldLabel = styled.span`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.color.textMuted};
`;

const ReasonArea = styled.textarea`
  width: 100%;
  min-height: 56px;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
  font: inherit;
  resize: vertical;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const SegregationCopy = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ProofLine = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  &[data-proof="apply"] {
    margin-top: ${({ theme }) => theme.spacing.sm};
    align-items: flex-start;
  }
`;

const AppliedBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.positive ?? theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.positiveSoft ?? theme.color.surfaceRaised};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.positive ?? theme.color.primary};
    margin-top: 2px;
  }

  strong {
    display: block;
  }

  p {
    margin: ${({ theme }) => theme.spacing.xs} 0 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    overflow-wrap: anywhere;
  }
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(0, 0, 0, 0.4);
`;

const ConfirmCard = styled.div`
  width: 100%;
  max-width: 520px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.text};

  h2 {
    margin: 0 0 ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  p {
    margin: 0 0 ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.color.textMuted};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    overflow-wrap: anywhere;
  }
`;

const ConfirmWarn = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: flex-start;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  color: ${({ theme }) => theme.color.warning ?? theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;
