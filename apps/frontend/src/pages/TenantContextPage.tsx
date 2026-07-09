import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import styled from "styled-components";
import { TenantAccessError } from "../shared/api/client";
import { useMyTenants, useTenantProjects, useTenantSummary } from "../shared/api/queries";
import {
  ProjectSummaryRef,
  TenantMutationGuard,
  TenantSummary,
} from "../shared/api/types";
import { useActiveTenantId } from "../shared/lib/activeTenant";
import { formatDateTime } from "../shared/lib/format";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CardBody, KeyValue, Muted, Stack } from "./mvp3Shared";

// MVP6.10 Multi-tenant (FE6-095..097). READ-ONLY tenant context + STRICT
// ISOLATION. This surface PROVISIONS NOTHING, MUTATES NOTHING, RE-HOMES NOTHING:
// there is NO create / edit / rename / delete / invite / add-member /
// remove-member / role-change / provision / switch-org-write affordance anywhere.
// The only control is the CLIENT-SIDE active-tenant switcher in the app-shell
// header (writes no server state). Isolation is enforced in two layers:
//   (1) by construction — the switcher offers ONLY the actor's ACTIVE visibility
//       set (GET /tenants); cross-tenant selection is unreachable through the UI.
//   (2) clean denial for an out-of-band id — 404 TENANT_NOT_FOUND (existence NEVER
//       leaked) / 403 TENANT_ACCESS_SUSPENDED, driven by denial_reason. Another
//       tenant's data is NEVER rendered; stale data is cleared before resolving.
// Every 200 carries an ALL-FALSE 8-flag TenantMutationGuard, rendered as a LIVE
// proof line read FROM the response (never hardcoded); errors carry no guard.

const GUARD_FLAGS: (keyof TenantMutationGuard)[] = [
  "tenant_created",
  "tenant_updated",
  "tenant_deleted",
  "membership_mutated",
  "project_rehomed",
  "cross_tenant_access_granted",
  "candidate_graph_mutated",
  "published_graph_mutated",
];

function guardAllFalse(guard: TenantMutationGuard): boolean {
  return GUARD_FLAGS.every((flag) => guard[flag] === false);
}

export function TenantContextPage() {
  const [searchParams] = useSearchParams();
  // Dev-only QA lever (never a production control): resolve the acting actor.
  const actorId = searchParams.get("actor_id") ?? "dev-user";
  // An out-of-band / deep-linked tenant id (stale bookmark, cross-tenant probe).
  const tenantParam = searchParams.get("tenant");

  const [activeTenantId, setActiveTenantId] = useActiveTenantId();
  const myTenantsQuery = useMyTenants(actorId);
  const myTenants = useMemo(() => myTenantsQuery.data?.items ?? [], [myTenantsQuery.data]);

  // Resolve which tenant to read: an explicit deep-link param wins; else the
  // client-side active tenant; else default to the first visible tenant. A stale
  // id is always re-validated server-side (it resolves to 404/403, never trusted).
  const resolvedTenantId = useMemo(() => {
    if (tenantParam) return tenantParam;
    if (activeTenantId) return activeTenantId;
    return myTenants[0]?.id ?? "";
  }, [tenantParam, activeTenantId, myTenants]);

  // Keep the client-side active tenant in sync with a valid default (no server
  // write). Never auto-select a tenant the actor cannot see.
  useEffect(() => {
    if (tenantParam) return;
    if (!activeTenantId && myTenants[0]?.id) {
      setActiveTenantId(myTenants[0].id);
    }
  }, [tenantParam, activeTenantId, myTenants, setActiveTenantId]);

  const hasTarget = Boolean(resolvedTenantId);
  const summaryQuery = useTenantSummary(actorId, resolvedTenantId, hasTarget);
  const projectsQuery = useTenantProjects(actorId, resolvedTenantId, hasTarget);

  const liveGuard = summaryQuery.data?.mutation_guard ?? null;
  const guardViolation = liveGuard ? !guardAllFalse(liveGuard) : false;

  return (
    <>
      <Breadcrumbs items={[{ label: "테넌트 컨텍스트" }]} />
      <PageHeader
        title="테넌트 컨텍스트"
        description="내가 활성 멤버인 테넌트만 · 읽기 전용 · 프로비저닝 없음"
        eyebrow="TENANT CONTEXT · 읽기 전용 (프로비저닝 없음)"
      >
        <PageActions>
          <HanaBadge tone="neutral">MVP6.10</HanaBadge>
          <HanaBadge tone="warning">Read-only · 읽기 전용</HanaBadge>
        </PageActions>
      </PageHeader>

      {/* Safety spine: persistent read-only-context banner + boundary chips. */}
      <BoundaryBanner role="note">
        <Info aria-hidden="true" size={18} />
        <div>
          <strong>테넌트 컨텍스트는 읽기 전용입니다. 아무것도 만들거나 변경하지 않습니다.</strong>
          <p>
            내가 활성 멤버인 테넌트만 조회합니다. 테넌트나 멤버십을 만들거나 수정·삭제하지 않고, 프로젝트를 다른
            테넌트로 옮기지 않으며, 다른 테넌트의 데이터에는 접근하지 않습니다. 기존 프로젝트 범위는 그대로입니다.
            테넌트 전환은 화면 상태만 바꿀 뿐 서버에 저장되지 않습니다.
          </p>
          <ChipRow>
            <HanaBadge tone="progress">READ_ONLY_CONTEXT · 읽기 전용 컨텍스트</HanaBadge>
            <HanaBadge tone="progress">NO_PROVISIONING · 프로비저닝 없음</HanaBadge>
            <HanaBadge tone="progress">NO_CROSS_TENANT · 교차 테넌트 없음</HanaBadge>
            <HanaBadge tone="progress">SCOPING_UNCHANGED · 기존 범위 유지</HanaBadge>
            <HanaBadge tone="warning">CLIENT_SIDE_SWITCH · 화면 전환만</HanaBadge>
          </ChipRow>
        </div>
      </BoundaryBanner>

      {liveGuard ? (
        guardViolation ? (
          <ErrorRow role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>예상치 못한 상태: mutation 플래그가 감지되었습니다. 이는 결함이며 안전한 상태로 전환합니다.</span>
          </ErrorRow>
        ) : (
          <GuardProof guard={liveGuard} />
        )
      ) : null}

      <TenantBody
        actorId={actorId}
        resolvedTenantId={resolvedTenantId}
        myTenantsQuery={myTenantsQuery}
        summaryQuery={summaryQuery}
        projectsQuery={projectsQuery}
      />
    </>
  );
}

function TenantBody({
  actorId,
  resolvedTenantId,
  myTenantsQuery,
  summaryQuery,
  projectsQuery,
}: {
  actorId: string;
  resolvedTenantId: string;
  myTenantsQuery: ReturnType<typeof useMyTenants>;
  summaryQuery: ReturnType<typeof useTenantSummary>;
  projectsQuery: ReturnType<typeof useTenantProjects>;
}) {
  // Loading the visibility set.
  if (myTenantsQuery.isLoading) {
    return <PageState kind="loading" title="테넌트를 불러오는 중" description="내가 활성 멤버인 테넌트 목록을 준비하고 있습니다." />;
  }
  if (myTenantsQuery.isError) {
    return (
      <PageState
        kind="error"
        title="테넌트 목록을 불러오지 못했습니다"
        description="서비스에서 오류가 반환되었습니다. 이 화면은 아무것도 변경하지 않으므로 안전하게 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => void myTenantsQuery.refetch()}
      />
    );
  }

  // Empty visibility set (first-class): NEVER fabricate/offer a "create tenant".
  const myTenants = myTenantsQuery.data?.items ?? [];
  if (myTenants.length === 0 && !resolvedTenantId) {
    return (
      <PageState
        kind="empty"
        title="소속된 테넌트 없음"
        description="표시할 테넌트가 없습니다. 활성 멤버십이 있는 테넌트만 표시됩니다."
      />
    );
  }

  // A resolved (possibly out-of-band / stale) tenant id: read it server-side and
  // render ONLY that tenant's data, or the clean isolation denial state.
  if (summaryQuery.isLoading) {
    return <SkeletonCard aria-hidden="true" style={{ height: 200 }} />;
  }

  if (summaryQuery.isError) {
    return <IsolationDenial error={summaryQuery.error} />;
  }

  const summary = summaryQuery.data?.tenant;
  if (!summary) {
    return (
      <PageState kind="empty" title="테넌트를 선택하세요" description="상단 테넌트 전환기에서 조회할 테넌트를 선택하세요." />
    );
  }

  return (
    <Stack>
      <TenantSummaryCard summary={summary} actorId={actorId} />
      <TenantProjectSection tenantId={resolvedTenantId} projectsQuery={projectsQuery} />
    </Stack>
  );
}

// ---- Isolation denial (404-not-leak / 403-suspended), driven by denial_reason ----

function IsolationDenial({ error }: { error: unknown }) {
  if (error instanceof TenantAccessError) {
    if (error.status === 403) {
      // Access-suspended: may acknowledge the relationship exists but is inactive;
      // render NO tenant summary/project data.
      return (
        <DenialCard role="alert" data-tone="suspended">
          <DenialHead>
            <StatusBadge token="PERMISSION_LIMITED" />
            {error.denialReason ? <StatusBadge token={error.denialReason} /> : null}
          </DenialHead>
          <h3>이 테넌트에 대한 접근이 일시 중단되었습니다.</h3>
          <Muted>
            멤버십 또는 테넌트가 일시 중단 상태입니다. 이 테넌트의 요약/프로젝트 데이터는 표시하지 않습니다. 상단
            테넌트 전환기에서 활성 테넌트로 전환하세요.
          </Muted>
        </DenialCard>
      );
    }
    if (error.code === "PROJECT_NOT_FOUND") {
      return (
        <DenialCard role="alert" data-tone="notfound">
          <h3>요청한 프로젝트를 찾을 수 없습니다.</h3>
          <Muted>이 프로젝트가 속한 테넌트를 조회할 권한이 없거나 프로젝트가 존재하지 않습니다. 교차 테넌트 데이터는 표시하지 않습니다.</Muted>
        </DenialCard>
      );
    }
    // 404 TENANT_NOT_FOUND — reveal NOTHING about existence/name/count.
    return (
      <DenialCard role="alert" data-tone="notfound">
        <h3>요청하신 테넌트를 찾을 수 없습니다.</h3>
        <Muted>존재 여부를 포함해 어떤 정보도 표시하지 않습니다. 상단 테넌트 전환기에서 내가 접근할 수 있는 테넌트를 선택하세요.</Muted>
      </DenialCard>
    );
  }
  return (
    <DenialCard role="alert" data-tone="notfound">
      <h3>테넌트를 불러오지 못했습니다.</h3>
      <Muted>일시적인 오류일 수 있습니다. 이 화면은 아무것도 변경하지 않습니다.</Muted>
    </DenialCard>
  );
}

// ---- Tenant summary card (TenantStatus + my membership role/status) ----

function TenantSummaryCard({ summary, actorId }: { summary: TenantSummary; actorId: string }) {
  return (
    <HanaCard title={summary.display_name} eyebrow={`${summary.id} · 테넌트 요약`} emphasis="default">
      <CardBody>
        <BadgeRow>
          <span>테넌트 상태</span>
          <StatusBadge token={summary.status} />
        </BadgeRow>
        <BadgeRow>
          <span>내 멤버십</span>
          {/* role reuses the MVP5 Role treatment; status is its own labelled slot so
              TenantStatus and TenantMembershipStatus are never conflated. */}
          <HanaBadge tone="neutral">{summary.my_membership.role}</HanaBadge>
          <StatusBadge token={summary.my_membership.status} />
        </BadgeRow>
        {summary.description ? <Muted>{summary.description}</Muted> : null}
        <KeyValue>
          <dt>테넌트 ID</dt>
          <dd>
            <code>{summary.id}</code>
          </dd>
          <dt>액터 (dev)</dt>
          <dd>
            <code>{actorId}</code>
          </dd>
          <dt>프로젝트 수</dt>
          <dd>{summary.project_count}개</dd>
          <dt>생성일</dt>
          <dd>{formatDateTime(summary.created_at)}</dd>
        </KeyValue>
      </CardBody>
    </HanaCard>
  );
}

// ---- Tenant-scoped project list (this tenant's projects only) ----

function TenantProjectSection({
  tenantId,
  projectsQuery,
}: {
  tenantId: string;
  projectsQuery: ReturnType<typeof useTenantProjects>;
}) {
  if (projectsQuery.isLoading) {
    return <SkeletonCard aria-hidden="true" style={{ height: 160 }} />;
  }
  // The summary already resolved (visible); a project error here is transport.
  if (projectsQuery.isError) {
    return (
      <PageState
        kind="error"
        title="테넌트 프로젝트를 불러오지 못했습니다"
        description="서비스에서 오류가 반환되었습니다. 안전하게 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => void projectsQuery.refetch()}
      />
    );
  }

  const items = projectsQuery.data?.items ?? [];
  if (items.length === 0) {
    return (
      <HanaCard title="테넌트 프로젝트" eyebrow="TENANT PROJECTS · 이 테넌트만" emphasis="default">
        <CardBody>
          <PageState kind="empty" title="이 테넌트에 프로젝트가 없습니다." description="프로젝트가 옮겨지거나 삭제된 것이 아닙니다 — 이 테넌트가 소유한 프로젝트가 없습니다." />
        </CardBody>
      </HanaCard>
    );
  }

  return (
    <HanaCard
      title="테넌트 프로젝트"
      description="이 테넌트가 소유한 프로젝트만 표시합니다. 다른 테넌트의 프로젝트는 절대 표시되지 않습니다."
      eyebrow={`TENANT PROJECTS · ${tenantId}`}
      emphasis="default"
    >
      <CardBody>
        <MarkerRow>
          <HanaBadge tone="neutral">총 {projectsQuery.data?.total_count ?? items.length}개 · 이 테넌트만</HanaBadge>
        </MarkerRow>
        <ProjectList>
          {items.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </ProjectList>
      </CardBody>
    </HanaCard>
  );
}

function ProjectRow({ project }: { project: ProjectSummaryRef }) {
  return (
    <ProjectCard>
      <ProjectHead>
        {/* Rows link into the EXISTING project routes (tenant-unaware, unchanged). */}
        <Link to={`/projects/${project.id}`}>
          <strong>{project.name}</strong>
        </Link>
        <StatusBadge token={project.status} />
      </ProjectHead>
      {project.description ? <Muted>{project.description}</Muted> : null}
      <Metrics>
        <MetricCard label="소스" value={String(project.source_count)} />
        <MetricCard label="온톨로지 버전" value={String(project.ontology_version_count)} />
      </Metrics>
      <Muted as="span">
        <code>{project.id}</code> · 수정 {formatDateTime(project.updated_at)}
      </Muted>
    </ProjectCard>
  );
}

// ---- Guard proof line (reads flags FROM the response, never hardcoded) ----

function GuardProof({ guard }: { guard: TenantMutationGuard }) {
  return (
    <ProofBlock>
      <ProofHead>
        <ShieldCheck aria-hidden="true" size={14} />
        <span>이 응답은 아무것도 만들거나/변경/이관/교차 접근하지 않았습니다 — 8개 mutation 플래그 모두 false</span>
      </ProofHead>
      <ProofGrid>
        {GUARD_FLAGS.map((flag) => (
          <ProofFlag key={flag} data-key={flag}>
            <code>{flag}</code>
            <b>{String(guard[flag])}</b>
          </ProofFlag>
        ))}
      </ProofGrid>
    </ProofBlock>
  );
}

// ---- styled ----

const PageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const BoundaryBanner = styled.div`
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

const MarkerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  > span:first-child {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    min-width: 84px;
  }
`;

const SkeletonCard = styled.div`
  min-height: 160px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ProjectCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  code {
    overflow-wrap: anywhere;
  }
`;

const ProjectHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  a {
    color: ${({ theme }) => theme.color.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    overflow-wrap: anywhere;
  }
`;

const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 200px));
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.xs} 0;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const DenialCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-left: 4px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};

  &[data-tone="suspended"] {
    border-left-color: ${({ theme }) => theme.color.warning};
  }

  h3 {
    margin: ${({ theme }) => theme.spacing.sm} 0;
  }
`;

const DenialHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
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

const ProofBlock = styled.div`
  margin: ${({ theme }) => theme.spacing.sm} 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const ProofHead = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
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
`;
