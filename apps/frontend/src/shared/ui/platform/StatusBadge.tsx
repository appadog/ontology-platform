import {
  AlertTriangle,
  Archive,
  Ban,
  Box,
  CheckCircle2,
  Copy,
  PauseCircle,
  CircleDashed,
  CircleSlash,
  Clock,
  CloudOff,
  FileQuestion,
  GitBranch,
  History,
  Info,
  Layers,
  Lightbulb,
  Loader,
  Lock,
  MessageCircle,
  Minus,
  MinusCircle,
  PencilLine,
  PlusCircle,
  RotateCcw,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import styled from "styled-components";
import { HanaBadge } from "../hana";

// Wave 35 / D6 (docs/pm/UIUX_REMEDIATION_DECISIONS.md §6): every status token
// renders as badge = tone color + icon + UPPER_SNAKE token text + Korean
// secondary label. Never rely on color alone. The English token stays (API
// truth / intentional-English scope); the Korean label is the human gloss.

// D6 tones -> existing HanaBadge tones. HanaBadge has no `info`; map info ->
// progress (the blue in-progress/informational surface).
type D6Tone = "neutral" | "info" | "success" | "warning" | "danger";
type HanaTone = "neutral" | "success" | "warning" | "danger" | "progress" | "muted";

const d6ToneToHana: Record<D6Tone, HanaTone> = {
  neutral: "muted",
  info: "progress",
  success: "success",
  warning: "warning",
  danger: "danger",
};

interface TokenSpec {
  tone: D6Tone;
  icon: LucideIcon;
  ko: string;
}

// D6 §6.3 frozen token table. Extend with the same rule for any new token.
const tokenTable: Record<string, TokenSpec> = {
  NOT_AVAILABLE: { tone: "neutral", icon: MinusCircle, ko: "데이터 없음" },
  NOT_PUBLISHED: { tone: "neutral", icon: CircleDashed, ko: "미게시" },
  NOT_APPLICABLE: { tone: "neutral", icon: Ban, ko: "해당 없음" },
  NOT_COMPARABLE: { tone: "warning", icon: AlertTriangle, ko: "비교 불가" },
  PUBLISHED: { tone: "success", icon: CheckCircle2, ko: "게시됨" },
  DRAFT: { tone: "info", icon: PencilLine, ko: "초안" },
  PENDING: { tone: "info", icon: Clock, ko: "대기" },
  RUNNING: { tone: "info", icon: Loader, ko: "실행 중" },
  SUCCEEDED: { tone: "success", icon: CheckCircle2, ko: "성공" },
  SUCCESS: { tone: "success", icon: CheckCircle2, ko: "성공" },
  FAILED: { tone: "danger", icon: XCircle, ko: "실패" },
  WARNING: { tone: "warning", icon: AlertTriangle, ko: "경고" },
  INFO: { tone: "info", icon: Info, ko: "정보" },
  APPROVED: { tone: "success", icon: CheckCircle2, ko: "승인됨" },
  REJECTED: { tone: "danger", icon: XCircle, ko: "반려됨" },
  NEEDS_DISCUSSION: { tone: "warning", icon: MessageCircle, ko: "논의 필요" },
  MODIFIED: { tone: "info", icon: PencilLine, ko: "수정 승인" },
  SUGGESTED: { tone: "info", icon: Lightbulb, ko: "제안됨" },
  ACCEPTED: { tone: "success", icon: CheckCircle2, ko: "채택됨" },
  DISMISSED: { tone: "neutral", icon: XCircle, ko: "기각됨" },
  SUPERSEDED: { tone: "neutral", icon: History, ko: "대체됨" },
  // MVP6.6 (G7): APPLIED = successful apply into a DRAFT ontology version. The KO
  // gloss states 미게시 so "applied" never reads as "published". SUPERSEDED is
  // reused above (neutral); the governance-apply context passes warning + gloss.
  APPLIED: { tone: "success", icon: CheckCircle2, ko: "초안에 적용됨 (미게시)" },
  IMPROVED: { tone: "success", icon: TrendingUp, ko: "개선" },
  REGRESSED: { tone: "danger", icon: TrendingDown, ko: "하락" },
  UNCHANGED: { tone: "neutral", icon: Minus, ko: "변동 없음" },
  __NONE__: { tone: "neutral", icon: CircleSlash, ko: "없음(매칭 없음)" },
  STALE: { tone: "warning", icon: AlertTriangle, ko: "오래됨" },
  PERMISSION_LIMITED: { tone: "warning", icon: Lock, ko: "권한 제한" },
  // D6 §6.3 "extend with the same rule for any token not listed". The following
  // are additional API status/lifecycle enums shown across MVP1-MVP6 screens
  // (project/source/preview/validation/ontology/publish/job/run/review/eval/
  // search/RAG/external-API states). Same badge rule = tone + icon + Korean.
  ACTIVE: { tone: "success", icon: CheckCircle2, ko: "활성" },
  ARCHIVED: { tone: "neutral", icon: History, ko: "보관됨" },
  DELETED: { tone: "danger", icon: Trash2, ko: "삭제됨" },
  UPLOADED: { tone: "neutral", icon: Upload, ko: "업로드됨" },
  PARSING: { tone: "info", icon: Loader, ko: "파싱 중" },
  PARSED: { tone: "info", icon: CheckCircle2, ko: "파싱 완료" },
  PROFILED: { tone: "success", icon: CheckCircle2, ko: "프로파일 완료" },
  EXTRACTION_READY: { tone: "success", icon: CheckCircle2, ko: "추출 준비됨" },
  READY: { tone: "success", icon: CheckCircle2, ko: "준비됨" },
  NOT_VALIDATED: { tone: "neutral", icon: MinusCircle, ko: "미검증" },
  QUEUED: { tone: "info", icon: Clock, ko: "대기열" },
  PASSED: { tone: "success", icon: CheckCircle2, ko: "통과" },
  PARTIAL_FAILED: { tone: "warning", icon: AlertTriangle, ko: "부분 실패" },
  RETRYING: { tone: "info", icon: RotateCcw, ko: "재시도 중" },
  ROLLED_BACK: { tone: "warning", icon: RotateCcw, ko: "롤백됨" },
  CANCELLED: { tone: "neutral", icon: Ban, ko: "취소됨" },
  // Evaluation dataset / prompt experiment / RAG / search / vector / auth states
  COMPLETED: { tone: "success", icon: CheckCircle2, ko: "완료" },
  MEASURED: { tone: "success", icon: CheckCircle2, ko: "측정됨" },
  ANSWERED: { tone: "success", icon: CheckCircle2, ko: "답변됨" },
  AVAILABLE: { tone: "success", icon: CheckCircle2, ko: "사용 가능" },
  UNAVAILABLE: { tone: "danger", icon: CloudOff, ko: "사용 불가" },
  ERROR: { tone: "danger", icon: XCircle, ko: "오류" },
  PARTIAL: { tone: "warning", icon: AlertTriangle, ko: "부분" },
  FALLBACK_KEYWORD: { tone: "warning", icon: AlertTriangle, ko: "키워드 대체" },
  SAFE_TOO_LARGE: { tone: "warning", icon: AlertTriangle, ko: "안전 한도 초과" },
  INSUFFICIENT_EVIDENCE: { tone: "warning", icon: AlertTriangle, ko: "근거 부족" },
  DEV_AUTH: { tone: "info", icon: Lock, ko: "개발 인증" },
  READ_ONLY: { tone: "neutral", icon: Lock, ko: "읽기 전용" },
  // Evidence presence (review/publish surfaces)
  PRESENT: { tone: "success", icon: CheckCircle2, ko: "있음" },
  MISSING: { tone: "danger", icon: AlertTriangle, ko: "없음" },
  MISSING_EVIDENCE: { tone: "warning", icon: AlertTriangle, ko: "근거 없음" },
  BROKEN_EVIDENCE: { tone: "danger", icon: FileQuestion, ko: "근거 손상" },
  // Auto-approval preview status (learning insights)
  RECOMMENDATION_ONLY: { tone: "info", icon: Lightbulb, ko: "추천 전용" },
  NOT_ENFORCED: { tone: "warning", icon: AlertTriangle, ko: "미적용" },
  REQUIRES_POLICY_APPROVAL: { tone: "warning", icon: Lock, ko: "정책 승인 필요" },
  // Auto-approval historical match outcome
  WOULD_MATCH: { tone: "success", icon: CheckCircle2, ko: "매칭됨" },
  WOULD_NOT_MATCH: { tone: "warning", icon: AlertTriangle, ko: "매칭 안 됨" },
  BLOCKED_BY_SAFETY_RULE: { tone: "danger", icon: Ban, ko: "안전 규칙 차단" },
  // Benchmark run exclusion reasons
  NOT_TERMINAL_SUCCESS: { tone: "warning", icon: AlertTriangle, ko: "성공 종료 아님" },
  DIFFERENT_PROJECT: { tone: "warning", icon: AlertTriangle, ko: "다른 프로젝트" },
  RUN_NOT_FOUND: { tone: "warning", icon: FileQuestion, ko: "실행 없음" },
  DUPLICATE_RUN_ID: { tone: "warning", icon: AlertTriangle, ko: "중복 실행 ID" },
  // Publish eligibility reason codes
  ELIGIBLE: { tone: "success", icon: CheckCircle2, ko: "게시 가능" },
  NOT_APPROVED_OR_MODIFIED: { tone: "warning", icon: AlertTriangle, ko: "승인/수정 안 됨" },
  FAILED_VALIDATION: { tone: "danger", icon: XCircle, ko: "검증 실패" },
  WARNING_REASON_REQUIRED: { tone: "warning", icon: AlertTriangle, ko: "경고 사유 필요" },
  ALREADY_PUBLISHED: { tone: "neutral", icon: CheckCircle2, ko: "이미 게시됨" },
  ONTOLOGY_VERSION_MISMATCH: { tone: "warning", icon: AlertTriangle, ko: "온톨로지 버전 불일치" },
  PUBLISH_PERMISSION_REQUIRED: { tone: "warning", icon: Lock, ko: "게시 권한 필요" },
  CORRECTION_DIFF_REQUIRED: { tone: "warning", icon: AlertTriangle, ko: "정정 차이 필요" },
  // MVP6.7 ImpactSeverity (read-only impact simulation). Deterministic severity is
  // a VISUAL cue, NOT a block: BREAKING/HIGH never gate apply/publish. Order
  // low->high: NONE < LOW < MEDIUM < HIGH < BREAKING.
  NONE: { tone: "neutral", icon: MinusCircle, ko: "영향 없음" },
  LOW: { tone: "info", icon: Info, ko: "낮음" },
  MEDIUM: { tone: "warning", icon: AlertTriangle, ko: "중간" },
  HIGH: { tone: "warning", icon: AlertTriangle, ko: "높음" },
  BREAKING: { tone: "danger", icon: XCircle, ko: "심각(파손 가능)" },
  // MVP6.9 Connectors (read-only catalog + dry-run preview). ConnectorPreviewStatus
  // / ConnectorPreviewCompatibility / ConnectorPreviewTargetLayer tokens. READY and
  // WARNING reuse the existing rows above.
  BLOCKED: { tone: "danger", icon: Ban, ko: "차단됨" },
  COMPATIBLE: { tone: "success", icon: CheckCircle2, ko: "호환됨" },
  INCOMPATIBLE: { tone: "danger", icon: XCircle, ko: "비호환" },
  CANDIDATE: { tone: "info", icon: Layers, ko: "후보 레이어" },
  // MVP6.10 Multi-tenant (read-only context + strict isolation). TenantStatus /
  // TenantMembershipStatus share ACTIVE (above); SUSPENDED is the membership/tenant
  // inactive token. TenantAccessDenialReason tokens appear only in denial states.
  // ARCHIVED is reused above (History/보관됨); the denial-specific TENANT_ARCHIVED
  // is a distinct token so the reason taxonomy is explicit.
  SUSPENDED: { tone: "warning", icon: PauseCircle, ko: "일시 중단" },
  NOT_A_MEMBER: { tone: "neutral", icon: MinusCircle, ko: "멤버 아님" },
  TENANT_ARCHIVED: { tone: "neutral", icon: Archive, ko: "테넌트 보관됨" },
  MEMBERSHIP_SUSPENDED: { tone: "warning", icon: PauseCircle, ko: "멤버십 중단" },
  TENANT_SUSPENDED: { tone: "warning", icon: PauseCircle, ko: "테넌트 중단" },
  // MVP6.11 Ontology Packs (read-only catalog + dry-run apply-preview). READY /
  // BLOCKED / COMPATIBLE / WARNING / INCOMPATIBLE / DRAFT reuse existing rows.
  // PackPreviewItemDisposition + PackElementKind tokens (D6; extend-with-same-rule):
  NEW: { tone: "success", icon: PlusCircle, ko: "신규(추가 예정)" },
  CONFLICT: { tone: "warning", icon: AlertTriangle, ko: "충돌(해소 필요)" },
  DUPLICATE: { tone: "neutral", icon: Copy, ko: "중복(no-op)" },
  CLASS: { tone: "info", icon: Box, ko: "클래스" },
  PROPERTY: { tone: "info", icon: Tag, ko: "속성" },
  RELATION: { tone: "info", icon: GitBranch, ko: "관계" },
};

interface StatusBadgeProps {
  token: string;
  /** Override the looked-up Korean label (rare). */
  koLabel?: string;
  /**
   * Optional Hana tone override for callers that compute their own tone from
   * domain context (e.g. validation severity, publish eligibility, risk level,
   * boolean eligible/blocked). The D6 token text + Korean gloss are still shown;
   * only the badge color is taken from the caller. When omitted the D6 §6.3
   * table tone is used.
   */
  tone?: HanaTone;
}

/**
 * Returns the D6 spec for a token, or a neutral fallback (Info icon, no Korean
 * gloss) so an unlisted token still renders a badge rather than crashing.
 */
function specFor(token: string): TokenSpec {
  return tokenTable[token] ?? { tone: "neutral", icon: Info, ko: "" };
}

export function StatusBadge({ token, koLabel, tone }: StatusBadgeProps) {
  const spec = specFor(token);
  const Icon = spec.icon;
  const ko = koLabel ?? spec.ko;
  const hanaTone = tone ?? d6ToneToHana[spec.tone];

  return (
    <HanaBadge tone={hanaTone}>
      <IconWrap>
        <Icon aria-hidden="true" />
      </IconWrap>
      <Token>{token}</Token>
      {ko ? <Ko>· {ko}</Ko> : null}
    </HanaBadge>
  );
}

const IconWrap = styled.span`
  display: inline-flex;

  svg {
    width: 13px;
    height: 13px;
  }
`;

const Token = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Ko = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  opacity: 0.85;
`;
