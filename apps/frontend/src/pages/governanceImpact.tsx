import { useState } from "react";
import { AlertTriangle, Info, Layers, ShieldCheck } from "lucide-react";
import styled from "styled-components";
import { GovernanceError } from "../shared/api/client";
import { useChangeRequestImpactSimulation } from "../shared/api/queries";
import {
  AffectedOntologyElement,
  DependencyRelation,
  DependentRefBucket,
  ImpactItem,
  ImpactSeverity,
  ImpactSimulationMutationGuard,
  ImpactSimulationReport,
  OntologyElementRef,
} from "../shared/api/types";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { CardBody, Muted } from "../shared/ui/platform/Section";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CompactTable, KeyValue } from "./mvp3Shared";
import { changeTypeKo, targetKindKo } from "./governanceShared";

// MVP6.7 Impact Simulation panel — a contextual, read-only "영향도(Impact)"
// Section inside the existing Governance change-request detail (no new LNB/route).
// The report mutates NOTHING (all-false ImpactSimulationMutationGuard) and is
// advisory only: a BREAKING/HIGH severity is information, never a block. The panel
// is collapsed until the human runs the read-only "영향도 분석 실행" trigger. There
// is NO apply/publish/enforce/fix affordance anywhere on this panel.

const SEVERITY_ORDER: ImpactSeverity[] = ["BREAKING", "HIGH", "MEDIUM", "LOW", "NONE"];

const dependencyRelationKo: Record<DependencyRelation, string> = {
  DIRECT_TARGET: "직접 대상",
  PROPERTY_OF_CLASS: "클래스의 속성",
  RELATION_DOMAIN: "관계 도메인",
  RELATION_RANGE: "관계 레인지",
  SUBCLASS_OF: "하위 클래스",
  SUPERCLASS_OF: "상위 클래스",
  RELATED_ELEMENT: "연관 요소",
};

const qualityGroupKo: Record<string, string> = {
  COMPLETENESS: "완전성",
  CONSISTENCY: "일관성",
  TRACEABILITY: "추적성",
  VALIDATION: "검증",
  REVIEW: "검토",
  DUPLICATE: "중복",
  RELATION_DENSITY: "관계 밀도",
};

function refLabel(ref: OntologyElementRef): string {
  const id = ref.ontology_class_id ?? ref.ontology_property_id ?? ref.ontology_relation_id;
  return id ? `${id}${ref.status ? ` (${ref.status})` : ""}` : ref.status ?? "—";
}

/** All-false invariant: MVP6.7 turns NO flag true, ever. */
function guardAllFalse(guard: ImpactSimulationMutationGuard): boolean {
  return !(
    guard.ontology_draft_mutated ||
    guard.published_graph_mutated ||
    guard.candidate_graph_mutated ||
    guard.prompt_version_mutated ||
    guard.governance_state_mutated ||
    guard.publish_job_started ||
    guard.extraction_job_started ||
    guard.evaluation_run_started
  );
}

export function ImpactSimulationSection({ changeRequestId }: { changeRequestId: string }) {
  const [run, setRun] = useState(false);
  const query = useChangeRequestImpactSimulation(changeRequestId, run);

  const report = query.data;
  const permissionLimited =
    query.isError && query.error instanceof GovernanceError && query.error.status === 403;

  return (
    <HanaCard
      title="영향도(Impact)"
      description="변경 요청이 온톨로지·후보·게시 그래프와 검증/품질에 미치는 영향을 읽기 전용으로 분석합니다"
      eyebrow="IMPACT · 읽기 전용 분석"
      emphasis="default"
    >
      <CardBody>
        {!run ? (
          <Collapsed>
            <Muted>
              변경 요청이 온톨로지·후보·게시 그래프와 검증/품질에 미치는 영향을 읽기 전용으로 분석합니다. 이 분석은 아무 것도
              변경하지 않으며 적용·게시·시행하지 않습니다.
            </Muted>
            <HanaButton type="button" onClick={() => setRun(true)}>
              영향도 분석 실행
            </HanaButton>
          </Collapsed>
        ) : query.isLoading || query.isFetching ? (
          <LoadingRow role="status">
            <StatusBadge token="RUNNING" koLabel="분석 실행 중" tone="progress" />
            <span>영향도를 읽기 전용으로 분석하고 있습니다… (아무 것도 변경하지 않습니다)</span>
          </LoadingRow>
        ) : permissionLimited ? (
          <PermissionInline>
            <StatusBadge token="PERMISSION_LIMITED" />
            <span>이 프로젝트의 변경 요청을 볼 수 있는 구성원만 영향도 분석을 볼 수 있습니다.</span>
          </PermissionInline>
        ) : query.isError || !report ? (
          <ErrorRow role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>영향도 분석을 불러오지 못했습니다. 이 분석은 읽기 전용이므로 아무 것도 변경되지 않았습니다.</span>
            <HanaButton type="button" onClick={() => query.refetch()}>
              다시 분석
            </HanaButton>
          </ErrorRow>
        ) : (
          <ImpactReportView report={report} />
        )}
      </CardBody>
    </HanaCard>
  );
}

function ImpactReportView({ report }: { report: ImpactSimulationReport }) {
  const allFalse = guardAllFalse(report.mutation_guard);
  const { summary } = report;
  const isEmpty = report.items.length === 0 || summary.max_severity === "NONE";

  return (
    <>
      {/* Read-only / advisory banner (load-bearing: report changes nothing). */}
      <AdvisoryBanner role="note">
        <Info aria-hidden="true" size={18} />
        <p>
          이 분석은 읽기 전용입니다. 온톨로지(초안/게시)·후보 그래프·게시 그래프·프롬프트·추출·평가·거버넌스 상태를 변경하지
          않으며, 적용·게시·시행하지 않습니다. 심각도는 참고 정보이며 적용/게시를 막지 않습니다.
        </p>
      </AdvisoryBanner>

      {/* All-false mutation-guard proof line. Any true flag is an unexpected-state defect. */}
      {allFalse ? (
        <ProofLine>
          <ShieldCheck aria-hidden="true" size={14} /> 이 분석은 아무 것도 변경하지 않았습니다 (모든 mutation 플래그
          false). 온톨로지·게시 그래프·후보 그래프·프롬프트·추출·평가·거버넌스 상태는 변경되지 않았고, 어떤 작업도 시작되지
          않았습니다.
        </ProofLine>
      ) : (
        <ErrorRow role="alert">
          <AlertTriangle aria-hidden="true" size={16} />
          <span>
            예상치 못한 상태: 이 읽기 전용 분석에서 mutation 플래그가 감지되었습니다. 이는 결함이며 즉시 확인이 필요합니다.
          </span>
        </ErrorRow>
      )}

      {/* Dimension 5 (shown first): severity / summary rollup. */}
      <SummaryBlock>
        <SummaryHead>
          <span>심각도 요약</span>
          <SeverityBadge severity={summary.max_severity} />
        </SummaryHead>
        <SeverityCounts>
          {SEVERITY_ORDER.map((sev) => (
            <SeverityCountItem key={sev}>
              <SeverityBadge severity={sev} />
              <strong>{summary.severity_counts[sev]}</strong>
            </SeverityCountItem>
          ))}
        </SeverityCounts>
        <KeyValue>
          <dt>분석 대상 온톨로지 버전</dt>
          <dd>
            {report.analyzed_ontology_version_id}{" "}
            <StatusBadge token={report.analyzed_ontology_version_status} />
          </dd>
          <dt>변경 항목 수</dt>
          <dd>{summary.total_change_items}</dd>
          <dt>영향받는 온톨로지 요소</dt>
          <dd>{summary.total_affected_ontology_elements}개</dd>
          <dt>의존 후보 요소</dt>
          <dd>{summary.total_dependent_candidates}개</dd>
          <dt>의존 게시 요소</dt>
          <dd>{summary.total_dependent_published}개</dd>
        </KeyValue>
        {(summary.max_severity === "BREAKING" || summary.max_severity === "HIGH") && (
          <AdvisoryNote>
            높은 심각도는 검토를 권장하는 참고 정보입니다. 적용/게시를 막지 않으며, 진행 여부는 이후 별도 단계(적용/게시 흐름)에서
            사람이 결정합니다.
          </AdvisoryNote>
        )}
      </SummaryBlock>

      {isEmpty && report.items.length === 0 ? (
        <EmptyRow>
          <StatusBadge token="NONE" />
          <span>이 변경 요청은 기존 요소에 대한 의존성 영향이 없습니다.</span>
        </EmptyRow>
      ) : (
        <ItemList>
          {report.items.map((item) => (
            <ImpactItemBlock key={item.change_item_id} item={item} refCap={report.bounding.ref_cap} />
          ))}
        </ItemList>
      )}
    </>
  );
}

function ImpactItemBlock({ item, refCap }: { item: ImpactItem; refCap: number }) {
  return (
    <ItemCard>
      <ItemHead>
        <HanaBadge tone="neutral">
          {item.target_kind} · {targetKindKo[item.target_kind]}
        </HanaBadge>
        <HanaBadge tone="neutral">
          {item.change_type} · {changeTypeKo[item.change_type]}
        </HanaBadge>
        <Muted as="span">{refLabel(item.target_ref)}</Muted>
        <ItemSeverity>
          <SeverityBadge severity={item.severity} />
        </ItemSeverity>
      </ItemHead>

      {/* Dimension 1: affected ontology elements + bounded transitive dependents. */}
      <DimTitle>
        <Layers aria-hidden="true" size={14} /> 영향받는 온톨로지 요소
      </DimTitle>
      <Muted>전이 의존성은 최대 깊이 2까지 표시됩니다.</Muted>
      <CompactTable>
        <table>
          <thead>
            <tr>
              <th>요소</th>
              <th>관계</th>
              <th>깊이</th>
              <th>표시명</th>
            </tr>
          </thead>
          <tbody>
            {item.affected_ontology_elements.map((el: AffectedOntologyElement, i) => (
              <tr key={`${refLabel(el.element_ref)}-${el.depth}-${i}`}>
                <td>{refLabel(el.element_ref)}</td>
                <td>
                  <HanaBadge tone="neutral">{dependencyRelationKo[el.relation_to_target]}</HanaBadge>
                </td>
                <td>깊이 {el.depth}</td>
                <td>{el.display_name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CompactTable>

      {/* Dimension 2 + 3: dependent candidate / published elements (count + capped list). */}
      <DependentBucketView title="의존 후보 요소" layer="CANDIDATE" bucket={item.dependent_candidates} refCap={refCap} />
      <DependentBucketView title="의존 게시 요소" layer="PUBLISHED" bucket={item.dependent_published} refCap={refCap} />

      {/* Dimension 4: affected validations / quality groups (by reference). */}
      <DimTitle>영향받는 검증 / 품질</DimTitle>
      {item.affected_validations.length === 0 && item.affected_quality_groups.length === 0 ? (
        <Muted>영향받는 검증 규칙 / 품질 그룹이 없습니다.</Muted>
      ) : (
        <BadgeRow>
          {item.affected_validations.map((v) => (
            <StatusBadge key={v.rule_code} token={v.severity} koLabel={v.rule_code} />
          ))}
          {item.affected_quality_groups.map((g) => (
            <HanaBadge key={g} tone="neutral">
              {g} · {qualityGroupKo[g] ?? g}
            </HanaBadge>
          ))}
        </BadgeRow>
      )}
    </ItemCard>
  );
}

function DependentBucketView({
  title,
  layer,
  bucket,
  refCap,
}: {
  title: string;
  layer: "CANDIDATE" | "PUBLISHED";
  bucket: DependentRefBucket;
  refCap: number;
}) {
  const layerKo = layer === "CANDIDATE" ? "후보 계층" : "게시 계층";
  return (
    <BucketBlock>
      <DimTitle>
        {title}{" "}
        <CountPill>
          {bucket.count}개 · {layerKo}
        </CountPill>
      </DimTitle>
      {bucket.count === 0 ? (
        <Muted>
          {layer === "CANDIDATE" ? "의존하는 후보 요소가 없습니다." : "의존하는 게시 요소가 없습니다."}
        </Muted>
      ) : (
        <>
          <RefList>
            {bucket.refs.map((ref, i) => (
              <li key={`${refLabel(ref)}-${i}`}>{refLabel(ref)}</li>
            ))}
          </RefList>
          {bucket.truncated ? (
            <Truncation>
              총 {bucket.count}개 중 처음 {bucket.refs.length}개 표시 (상한 {refCap})
            </Truncation>
          ) : null}
        </>
      )}
    </BucketBlock>
  );
}

function SeverityBadge({ severity }: { severity: ImpactSeverity }) {
  return <StatusBadge token={severity} />;
}

const Collapsed = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  justify-content: space-between;

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const LoadingRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    overflow-wrap: anywhere;
  }
`;

const ErrorRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin: ${({ theme }) => theme.spacing.sm} 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warning ?? theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
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

const AdvisoryBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.primary};
    margin-top: 2px;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    overflow-wrap: anywhere;
  }
`;

const ProofLine = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const SummaryBlock = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const SummaryHead = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  span {
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const SeverityCounts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SeverityCountItem = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;

  strong {
    font-variant-numeric: tabular-nums;
  }
`;

const AdvisoryNote = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;
`;

const EmptyRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    overflow-wrap: anywhere;
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
`;

const ItemCard = styled.div`
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const ItemHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  > span {
    overflow-wrap: anywhere;
  }
`;

const ItemSeverity = styled.div`
  margin-left: auto;
`;

const DimTitle = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const BucketBlock = styled.div``;

const CountPill = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const RefList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  li {
    overflow-wrap: anywhere;
  }
`;

const Truncation = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;
