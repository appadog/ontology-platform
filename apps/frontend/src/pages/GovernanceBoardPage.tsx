import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FilePlus2 } from "lucide-react";
import styled from "styled-components";
import { useOntologyChangeRequests, useProject } from "../shared/api/queries";
import { OntologyChangeRequest, OntologyChangeRequestStatus } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { CardBody, Muted, SectionStack } from "../shared/ui/platform/Section";
import { PageState } from "../shared/ui/platform/PageState";
import { CompactTable } from "./mvp3Shared";
import { PageActions } from "./mvp4Shared";
import {
  ApplicationStateBadge,
  ApprovalIntentBanner,
  ChangeRequestStatusBadge,
  formatGovernanceDate,
} from "./governanceShared";

// MVP6.5 Governance board — the project's change-request work queue, grouped
// client-side by status (G4). One primary action: 변경 요청 생성. No 적용/게시
// affordance anywhere; the approval-is-intent banner is persistent.

// Board display order for the status groups.
const STATUS_ORDER: OntologyChangeRequestStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "DRAFT",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
];

export function GovernanceBoardPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const projectQuery = useProject(projectId);
  const requestsQuery = useOntologyChangeRequests(projectId);

  const grouped = useMemo(() => {
    const items = requestsQuery.data?.items ?? [];
    const map = new Map<OntologyChangeRequestStatus, OntologyChangeRequest[]>();
    for (const status of STATUS_ORDER) {
      map.set(status, []);
    }
    for (const item of items) {
      map.get(item.status)?.push(item);
    }
    return map;
  }, [requestsQuery.data]);

  const totalCount = requestsQuery.data?.total_count ?? 0;

  if (!projectId) {
    return (
      <PageState
        kind="empty"
        title="프로젝트를 선택하세요"
        description="프로젝트를 선택하면 작업 메뉴가 표시됩니다."
      />
    );
  }

  if (projectQuery.isLoading || requestsQuery.isLoading) {
    return (
      <PageState
        kind="loading"
        title="거버넌스 변경 요청을 불러오는 중입니다"
        description="변경 요청 보드와 상태별 그룹을 준비하고 있습니다."
      />
    );
  }

  if (projectQuery.isError || requestsQuery.isError || !projectQuery.data) {
    return (
      <PageState
        kind="error"
        title="거버넌스 보드를 불러오지 못했습니다"
        description="선택한 프로젝트 컨텍스트에서 다시 시도하세요."
        actionLabel="다시 시도"
        onAction={() => requestsQuery.refetch()}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Governance" },
        ]}
      />
      <PageHeader
        title="거버넌스"
        description={`${projectQuery.data.name} · 온톨로지 변경 요청 검토 / 승인 / 감사`}
        eyebrow="GOVERNANCE"
      >
        <PageActions>
          <HanaBadge tone="success">MVP6.5</HanaBadge>
          <HanaButton
            type="button"
            variant="primary"
            onClick={() => navigate(`/projects/${projectId}/governance/new`)}
          >
            <FilePlus2 aria-hidden="true" size={16} /> 변경 요청 생성
          </HanaButton>
        </PageActions>
      </PageHeader>

      <ApprovalIntentBanner />

      {totalCount === 0 ? (
        <PageState
          kind="empty"
          title="이 프로젝트에는 아직 변경 요청이 없습니다."
          description="온톨로지 변경 제안을 새로 만들어 검토·승인 흐름을 시작하세요."
          actionLabel="변경 요청 생성"
          onAction={() => navigate(`/projects/${projectId}/governance/new`)}
        />
      ) : (
        <SectionStack>
          {STATUS_ORDER.map((status) => {
            const rows = grouped.get(status) ?? [];
            if (rows.length === 0) {
              return null;
            }
            return (
              <HanaCard
                key={status}
                title={undefined}
                emphasis="default"
                action={<ChangeRequestStatusBadge status={status} />}
              >
                <CardBody>
                  <CompactTable>
                    <table>
                      <thead>
                        <tr>
                          <th>제목</th>
                          <th>제안자</th>
                          <th>항목</th>
                          <th>적용 상태</th>
                          <th>온톨로지 버전</th>
                          <th>생성</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((cr) => (
                          <ClickableRow
                            key={cr.id}
                            onClick={() => navigate(`/projects/${projectId}/governance/${cr.id}`)}
                          >
                            <td>
                              <strong>{cr.title}</strong>
                              {cr.summary ? <RowSummary>{cr.summary}</RowSummary> : null}
                            </td>
                            <td>{cr.proposer_id}</td>
                            <td>{cr.item_count}</td>
                            <td>
                              {cr.application_state === "QUEUED" ? (
                                <ApplicationStateBadge state={cr.application_state} />
                              ) : (
                                <Muted as="span">—</Muted>
                              )}
                            </td>
                            <td>{cr.ontology_version_id ?? "—"}</td>
                            <td>{formatGovernanceDate(cr.created_at)}</td>
                          </ClickableRow>
                        ))}
                      </tbody>
                    </table>
                  </CompactTable>
                </CardBody>
              </HanaCard>
            );
          })}
        </SectionStack>
      )}
    </>
  );
}

const ClickableRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.surfaceRaised};
  }
`;

const RowSummary = styled.span`
  display: block;
  margin-top: 2px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  overflow-wrap: anywhere;
`;
