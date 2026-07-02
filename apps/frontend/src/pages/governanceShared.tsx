import { Info } from "lucide-react";
import styled from "styled-components";
import {
  ChangeRequestChangeType,
  ChangeRequestTargetKind,
  GovernanceApplicationState,
  GovernanceAuditAction,
  GovernanceReviewAction,
  OntologyChangeRequestStatus,
} from "../shared/api/types";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";

// MVP6.5 Governance — shared UI helpers (D6 badges, KO labels, the persistent
// approval-is-intent banner). QUEUED is intentionally rendered warning-toned as
// `큐잉됨 (미적용)` (NOT success) so "approved" never reads as "applied".

const statusKo: Record<OntologyChangeRequestStatus, string> = {
  DRAFT: "초안",
  OPEN: "검토 대기",
  IN_REVIEW: "검토 중",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  WITHDRAWN: "철회됨",
};

// D6 tone override for tokens not in the shared table (OPEN/IN_REVIEW/WITHDRAWN)
// or where the governance gloss differs from the shared one (QUEUED).
const statusToneOverride: Partial<Record<OntologyChangeRequestStatus, "neutral" | "progress" | "warning">> = {
  OPEN: "progress",
  IN_REVIEW: "progress",
  WITHDRAWN: "muted" as "neutral",
};

export function ChangeRequestStatusBadge({ status }: { status: OntologyChangeRequestStatus }) {
  const tone = statusToneOverride[status];
  return <StatusBadge token={status} koLabel={statusKo[status]} tone={tone} />;
}

export function ApplicationStateBadge({ state }: { state: GovernanceApplicationState }) {
  if (state === "QUEUED") {
    // Warning tone + `큐잉됨 (미적용)` — approved is queued intent, not applied.
    return <StatusBadge token="QUEUED" koLabel="큐잉됨 (미적용)" tone="warning" />;
  }
  if (state === "NOT_APPLICABLE") {
    return <StatusBadge token="NOT_APPLICABLE" />;
  }
  // APPLIED / SUPERSEDED are RESERVED — never expected in P0. If the backend
  // ever returns them, surface an unexpected-state notice rather than success.
  return <StatusBadge token={state} koLabel="예상치 못한 상태 (P0 미지원)" tone="danger" />;
}

export const reviewActionKo: Record<GovernanceReviewAction, string> = {
  COMMENT: "의견 추가",
  REQUEST_CHANGES: "변경 요청",
  APPROVE: "승인",
  REJECT: "반려",
};

export const targetKindKo: Record<ChangeRequestTargetKind, string> = {
  CLASS: "클래스",
  PROPERTY: "속성",
  RELATION: "관계",
};

export const changeTypeKo: Record<ChangeRequestChangeType, string> = {
  ADD: "추가",
  MODIFY: "수정",
  DEPRECATE: "폐기 제안",
};

export const auditActionKo: Record<GovernanceAuditAction, string> = {
  CHANGE_REQUEST_CREATED: "생성",
  CHANGE_REQUEST_UPDATED: "수정",
  CHANGE_REQUEST_SUBMITTED: "제출",
  CHANGE_REQUEST_WITHDRAWN: "철회",
  REVIEW_STARTED: "검토 시작",
  COMMENT_ADDED: "의견 추가",
  CHANGES_REQUESTED: "변경 요청",
  CHANGE_REQUEST_APPROVED: "승인",
  CHANGE_REQUEST_REJECTED: "반려",
};

/** Persistent approval-is-intent banner (load-bearing). Rendered on board + detail. */
export function ApprovalIntentBanner() {
  return (
    <IntentBanner role="note">
      <Info aria-hidden="true" size={18} />
      <div>
        <strong>승인은 큐잉된 의도이며, 아직 적용되지 않았습니다.</strong>
        <p>
          승인된 변경 요청은 감사 가능한 결정 기록으로 큐잉(QUEUED)됩니다. 온톨로지 정의와 게시 그래프는 변경되지
          않으며, 실제 적용은 이후 별도의 사람이 개시하는 단계에서 감사와 함께 이뤄집니다.
        </p>
      </div>
    </IntentBanner>
  );
}

export function formatGovernanceDate(value: string) {
  return value.replace("T", " ").replace(/\..*$/, "");
}

const IntentBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};
  color: ${({ theme }) => theme.color.text};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.primary};
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
