import { useMemo, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useCandidateEntities, useCandidateRelations, useExtractionJob } from "../shared/api/queries";
import { CandidateListFilters, ValidationStatus } from "../shared/api/types";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard, HanaSelect, statusToTone } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { formatDateTime } from "../shared/lib/format";
import { DataLink, Field, FormGrid, InlineList, Mono, MutedText, TableWrap, formatPercent } from "./mvp2Shared";

type EvidenceFilter = "ALL" | "WITH_EVIDENCE" | "MISSING_EVIDENCE";
type ValidationFilter = "ALL" | ValidationStatus;

export function CandidateResultsPage() {
  const { jobId = "job-policy-extraction" } = useParams();
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("ALL");
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>("ALL");
  const filters = useMemo<CandidateListFilters>(() => {
    return {
      has_evidence: evidenceFilter === "ALL" ? undefined : evidenceFilter === "WITH_EVIDENCE",
      validation_status: validationFilter === "ALL" ? undefined : validationFilter,
    };
  }, [evidenceFilter, validationFilter]);
  const jobQuery = useExtractionJob(jobId);
  const entitiesQuery = useCandidateEntities(jobId, filters);
  const relationsQuery = useCandidateRelations(jobId, filters);

  if (jobQuery.isLoading || entitiesQuery.isLoading || relationsQuery.isLoading) {
    return <PageState kind="loading" title="Candidate results를 불러오는 중" description="entity, relation candidate와 evidence reference를 조회하고 있습니다." />;
  }

  if (jobQuery.isError || entitiesQuery.isError || relationsQuery.isError || !jobQuery.data || !entitiesQuery.data || !relationsQuery.data) {
    return (
      <PageState
        kind="error"
        title="Candidate results를 불러오지 못했습니다"
        description="MVP 2 candidate result endpoint 또는 deterministic fixture 상태를 확인하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void jobQuery.refetch();
          void entitiesQuery.refetch();
          void relationsQuery.refetch();
        }}
      />
    );
  }

  const candidates = [...entitiesQuery.data, ...relationsQuery.data];
  const warningCount = candidates.filter((candidate) => candidate.validation_status === "WARNING").length;
  const failedCount = candidates.filter((candidate) => candidate.validation_status === "FAILED").length;
  const missingEvidenceCount = candidates.filter((candidate) => candidate.evidence_ids.length === 0).length;

  return (
    <>
      <PageHeader title="Candidate Results" description="MockProvider가 생성한 entity/relation candidate와 validation, evidence reference를 확인합니다.">
        <HanaBadge tone={statusToTone(jobQuery.data.status)}>{jobQuery.data.status}</HanaBadge>
      </PageHeader>
      <MetricGrid>
        <MetricCard label="Entities" value={entitiesQuery.data.length}>
          Candidate entity rows
        </MetricCard>
        <MetricCard label="Relations" value={relationsQuery.data.length}>
          Candidate relation rows
        </MetricCard>
        <MetricCard label="Warnings / Failed" value={`${warningCount} / ${failedCount}`}>
          Evidence and schema validation
        </MetricCard>
        <MetricCard label="Missing Evidence" value={missingEvidenceCount}>
          Debug-only candidates stay NOT_PUBLISHED
        </MetricCard>
      </MetricGrid>
      <HanaCard title="Filters" description="Backend actual API mode 전환 지점: GET /api/v1/extraction-jobs/{job_id}/candidates/entities|relations query filters">
        <FormGrid>
          <Field>
            <span>Evidence</span>
            <HanaSelect value={evidenceFilter} onChange={(event) => setEvidenceFilter(event.target.value as EvidenceFilter)}>
              <option value="ALL">All</option>
              <option value="WITH_EVIDENCE">With evidence</option>
              <option value="MISSING_EVIDENCE">Missing evidence</option>
            </HanaSelect>
          </Field>
          <Field>
            <span>Validation</span>
            <HanaSelect value={validationFilter} onChange={(event) => setValidationFilter(event.target.value as ValidationFilter)}>
              <option value="ALL">All</option>
              <option value="NOT_VALIDATED">NOT_VALIDATED</option>
              <option value="PASSED">PASSED</option>
              <option value="WARNING">WARNING</option>
              <option value="FAILED">FAILED</option>
            </HanaSelect>
          </Field>
        </FormGrid>
      </HanaCard>
      {candidates.length === 0 ? (
        <PageState kind="empty" title="조건에 맞는 candidate가 없습니다" description="filter를 조정하거나 extraction job 실행 후 다시 확인하세요." />
      ) : (
        <>
          <HanaCard title="Entity candidates" description="Evidence 없는 entity는 WARNING/MISSING_EVIDENCE 상태로만 노출합니다.">
            {entitiesQuery.data.length === 0 ? (
              <PageState kind="empty" title="Entity candidate가 없습니다" description="현재 filter 조건에 맞는 entity candidate가 없습니다." />
            ) : (
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Class</th>
                      <th>Confidence</th>
                      <th>Validation</th>
                      <th>Evidence</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entitiesQuery.data.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>
                          <CandidateName>
                            <strong>{candidate.entity_name}</strong>
                            <span>{formatProperties(candidate.property_values)}</span>
                          </CandidateName>
                        </td>
                        <td>
                          <Mono>{formatNullable(candidate.class_id)}</Mono>
                        </td>
                        <td>{formatPercent(candidate.confidence)}</td>
                        <td>
                          <StatusStack>
                            <HanaBadge tone={statusToTone(candidate.validation_status)}>{candidate.validation_status}</HanaBadge>
                            {candidate.validation_codes.map((code) => (
                              <HanaBadge key={code} tone="warning">
                                {code}
                              </HanaBadge>
                            ))}
                            <HanaBadge tone={statusToTone(candidate.publish_status)}>{candidate.publish_status}</HanaBadge>
                          </StatusStack>
                        </td>
                        <td>{renderEvidenceLinks(candidate.evidence_ids)}</td>
                        <td>{formatDateTime(candidate.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </HanaCard>
          <HanaCard title="Relation candidates" description="relation endpoint와 evidence reference는 publish graph와 분리된 candidate layer에서만 표시합니다.">
            {relationsQuery.data.length === 0 ? (
              <PageState kind="empty" title="Relation candidate가 없습니다" description="현재 filter 조건에 맞는 relation candidate가 없습니다." />
            ) : (
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th>Relation</th>
                      <th>Endpoints</th>
                      <th>Confidence</th>
                      <th>Validation</th>
                      <th>Evidence</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relationsQuery.data.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>
                          <Mono>{formatNullable(candidate.relation_id)}</Mono>
                        </td>
                        <td>
                          <CandidateName>
                            <strong>{formatNullable(candidate.source_candidate_entity_id)}</strong>
                            <span>{formatNullable(candidate.target_candidate_entity_id)}</span>
                          </CandidateName>
                        </td>
                        <td>{formatPercent(candidate.confidence)}</td>
                        <td>
                          <StatusStack>
                            <HanaBadge tone={statusToTone(candidate.validation_status)}>{candidate.validation_status}</HanaBadge>
                            {candidate.validation_codes.map((code) => (
                              <HanaBadge key={code} tone="warning">
                                {code}
                              </HanaBadge>
                            ))}
                            <HanaBadge tone={statusToTone(candidate.publish_status)}>{candidate.publish_status}</HanaBadge>
                          </StatusStack>
                        </td>
                        <td>{renderEvidenceLinks(candidate.evidence_ids)}</td>
                        <td>{formatDateTime(candidate.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </HanaCard>
        </>
      )}
    </>
  );
}

function formatProperties(values: Record<string, unknown>) {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    return "No extracted properties";
  }

  return entries.map(([key, value]) => `${key}: ${value ?? "-"}`).join(" · ");
}

function formatNullable(value: string | null) {
  return value ?? "-";
}

function renderEvidenceLinks(evidenceIds: string[]) {
  if (evidenceIds.length === 0) {
    return (
      <InlineList>
        <HanaBadge tone="warning">MISSING_EVIDENCE</HanaBadge>
        <MutedText>debug-only</MutedText>
      </InlineList>
    );
  }

  return (
    <InlineList>
      {evidenceIds.map((evidenceId) => (
        <DataLink key={evidenceId} to={`/candidate-evidence/${evidenceId}`}>
          {evidenceId}
        </DataLink>
      ))}
    </InlineList>
  );
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const CandidateName = styled.div`
  display: grid;
  gap: 4px;

  strong {
    color: ${({ theme }) => theme.color.text};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const StatusStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;
