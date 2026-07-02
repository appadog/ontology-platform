import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Info, Lock, MessageSquare, ShieldCheck } from "lucide-react";
import styled from "styled-components";
import {
  useChangeRequestAudit,
  useOntologyChangeRequestDetail,
  useProject,
  useRecordGovernanceReviewDecision,
  useWithdrawOntologyChangeRequest,
} from "../shared/api/queries";
import { GovernanceError } from "../shared/api/client";
import {
  GovernanceAuditEntry,
  GovernanceCapabilities,
  GovernanceReviewAction,
  GovernanceReviewDecision,
  OntologyChangeItem,
  OntologyChangeRequest,
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
  auditActionKo,
  changeTypeKo,
  formatGovernanceDate,
  reviewActionKo,
  targetKindKo,
} from "./governanceShared";

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
`;
