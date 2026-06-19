import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useCandidateEntities, useCandidateEvidence, useCandidateRelations, useExtractionJob } from "../shared/api/queries";
import { CandidateEntity, CandidateListFilters, CandidateRelation, ValidationStatus } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaSelect, statusToTone } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { formatDateTime } from "../shared/lib/format";
import { DataLink, Field, FormGrid, InlineList, KeyValueGrid, Mono, MutedText, TableWrap, formatPercent } from "./mvp2Shared";

type EvidenceFilter = "ALL" | "WITH_EVIDENCE" | "MISSING_EVIDENCE";
type ValidationFilter = "ALL" | ValidationStatus;
type CandidateRow =
  | { key: string; kind: "Entity"; candidate: CandidateEntity }
  | { key: string; kind: "Relation"; candidate: CandidateRelation };

export function CandidateResultsPage() {
  const { jobId = "" } = useParams();
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("ALL");
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>("ALL");
  const [selectedCandidateKey, setSelectedCandidateKey] = useState("");
  const filters = useMemo<CandidateListFilters>(() => {
    return {
      has_evidence: evidenceFilter === "ALL" ? undefined : evidenceFilter === "WITH_EVIDENCE",
      validation_status: validationFilter === "ALL" ? undefined : validationFilter,
    };
  }, [evidenceFilter, validationFilter]);
  const jobQuery = useExtractionJob(jobId);
  const entitiesQuery = useCandidateEntities(jobId, filters);
  const relationsQuery = useCandidateRelations(jobId, filters);
  const candidateRows = useMemo<CandidateRow[]>(() => {
    const entityRows = (entitiesQuery.data ?? []).map((candidate) => ({
      key: `entity:${candidate.id}`,
      kind: "Entity" as const,
      candidate,
    }));
    const relationRows = (relationsQuery.data ?? []).map((candidate) => ({
      key: `relation:${candidate.id}`,
      kind: "Relation" as const,
      candidate,
    }));

    return [...entityRows, ...relationRows];
  }, [entitiesQuery.data, relationsQuery.data]);
  const selectedCandidateRow = candidateRows.find((row) => row.key === selectedCandidateKey) ?? candidateRows[0];
  const selectedEvidenceId = selectedCandidateRow?.candidate.evidence_ids[0] ?? "";
  const evidenceQuery = useCandidateEvidence(selectedEvidenceId);

  useEffect(() => {
    if (!selectedCandidateKey && candidateRows[0]) {
      setSelectedCandidateKey(candidateRows[0].key);
      return;
    }

    if (selectedCandidateKey && !candidateRows.some((row) => row.key === selectedCandidateKey)) {
      setSelectedCandidateKey(candidateRows[0]?.key ?? "");
    }
  }, [candidateRows, selectedCandidateKey]);

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
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: "Extraction", to: `/projects/${jobQuery.data.project_id}/extraction-jobs` },
          { label: jobQuery.data.id, to: `/extraction-jobs/${jobQuery.data.id}` },
          { label: "Candidates" },
        ]}
      />
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
        <MetricCard label="Retry Dedupe" value={jobQuery.data.retry_of_job_id ? "Retry" : "Root"}>
          List rows are chain-deduped by backend natural key
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
                      <th>Detail</th>
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
                        <td>{renderEvidenceLinks(candidate.evidence_ids, candidate, "Entity", jobQuery.data.id)}</td>
                        <td>{formatDateTime(candidate.created_at)}</td>
                        <td>
                          <HanaButton type="button" variant="ghost" onClick={() => setSelectedCandidateKey(`entity:${candidate.id}`)}>
                            Details
                          </HanaButton>
                        </td>
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
                      <th>Detail</th>
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
                        <td>{renderEvidenceLinks(candidate.evidence_ids, candidate, "Relation", jobQuery.data.id)}</td>
                        <td>{formatDateTime(candidate.created_at)}</td>
                        <td>
                          <HanaButton type="button" variant="ghost" onClick={() => setSelectedCandidateKey(`relation:${candidate.id}`)}>
                            Details
                          </HanaButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </HanaCard>
          {selectedCandidateRow && (
            <HanaCard title="Candidate detail" description="Candidate row DTO와 첫 evidence detail을 조합해 표시합니다.">
              <KeyValueGrid>
                <dt>Type</dt>
                <dd>{selectedCandidateRow.kind}</dd>
                <dt>ID</dt>
                <dd>
                  <Mono>{selectedCandidateRow.candidate.id}</Mono>
                </dd>
                <dt>Source</dt>
                <dd>
                  <Mono>{selectedCandidateRow.candidate.source_id}</Mono>
                </dd>
                <dt>Source segment</dt>
                <dd>{selectedCandidateRow.candidate.source_segment_id ?? "-"}</dd>
                <dt>Ontology</dt>
                <dd>
                  <Mono>{selectedCandidateRow.candidate.ontology_version_id}</Mono>
                </dd>
                <dt>Prompt / Model run</dt>
                <dd>
                  <Mono>{selectedCandidateRow.candidate.prompt_version_id}</Mono> / <Mono>{selectedCandidateRow.candidate.model_run_id}</Mono>
                </dd>
                <dt>Confidence</dt>
                <dd>{formatPercent(selectedCandidateRow.candidate.confidence)}</dd>
                <dt>Validation</dt>
                <dd>
                  <StatusStack>
                    <HanaBadge tone={statusToTone(selectedCandidateRow.candidate.validation_status)}>
                      {selectedCandidateRow.candidate.validation_status}
                    </HanaBadge>
                    {selectedCandidateRow.candidate.validation_codes.map((code) => (
                      <HanaBadge key={code} tone="warning">
                        {code}
                      </HanaBadge>
                    ))}
                  </StatusStack>
                </dd>
                <dt>Review / Publish</dt>
                <dd>
                  <StatusStack>
                    <HanaBadge tone={statusToTone(selectedCandidateRow.candidate.review_status)}>
                      {selectedCandidateRow.candidate.review_status}
                    </HanaBadge>
                    <HanaBadge tone={statusToTone(selectedCandidateRow.candidate.publish_status)}>
                      {selectedCandidateRow.candidate.publish_status}
                    </HanaBadge>
                  </StatusStack>
                </dd>
                <dt>Retry dedupe</dt>
                <dd>{jobQuery.data.retry_of_job_id ? `Retry of ${jobQuery.data.retry_of_job_id}` : "Root chain result"}</dd>
              </KeyValueGrid>
              {selectedCandidateRow.candidate.evidence_ids.length === 0 ? (
                <EvidenceFallback>
                  <HanaBadge tone="warning">MISSING_EVIDENCE</HanaBadge>
                  <span>No evidence reference is attached to this candidate.</span>
                </EvidenceFallback>
              ) : evidenceQuery.isLoading ? (
                <PageState kind="loading" title="Evidence detail을 불러오는 중" description="첫 evidence locator를 확인하고 있습니다." />
              ) : evidenceQuery.isError || !evidenceQuery.data ? (
                <EvidenceFallback>
                  <HanaBadge tone="danger">BROKEN_EVIDENCE</HanaBadge>
                  <span>{selectedEvidenceId}</span>
                </EvidenceFallback>
              ) : (
                <EvidenceSummary>
                  <strong>{evidenceQuery.data.file_name}</strong>
                  <span>
                    {formatEvidenceLocator(evidenceQuery.data.row_index, evidenceQuery.data.column_name, evidenceQuery.data.paragraph_id, evidenceQuery.data.chunk_id)}
                  </span>
                  <MutedText>{evidenceQuery.data.evidence_text ?? "No evidence text available."}</MutedText>
                  <DataLink
                    to={buildEvidencePath(
                      evidenceQuery.data.id,
                      selectedCandidateRow.candidate,
                      selectedCandidateRow.kind,
                      jobQuery.data.id,
                    )}
                  >
                    Open evidence viewer
                  </DataLink>
                </EvidenceSummary>
              )}
              <RawPayload>{JSON.stringify(selectedCandidateRow.candidate.raw_payload, null, 2)}</RawPayload>
            </HanaCard>
          )}
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

function renderEvidenceLinks(
  evidenceIds: string[],
  candidate: CandidateEntity | CandidateRelation,
  kind: CandidateRow["kind"],
  jobId: string,
) {
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
        <DataLink key={evidenceId} to={buildEvidencePath(evidenceId, candidate, kind, jobId)}>
          {evidenceId}
        </DataLink>
      ))}
    </InlineList>
  );
}

function buildEvidencePath(
  evidenceId: string,
  candidate: CandidateEntity | CandidateRelation,
  kind: CandidateRow["kind"],
  jobId: string,
) {
  const params = new URLSearchParams({
    project_id: candidate.project_id,
    source_id: candidate.source_id,
    job_id: jobId,
    candidate_id: candidate.id,
    candidate_kind: kind,
    validation_code: candidate.validation_codes[0] ?? candidate.validation_status,
  });

  if (candidate.source_segment_id) {
    params.set("source_segment_id", candidate.source_segment_id);
  }

  return `/candidate-evidence/${evidenceId}?${params.toString()}`;
}

function formatEvidenceLocator(rowIndex?: number | null, columnName?: string | null, paragraphId?: number | null, chunkId?: number | null) {
  const parts = [
    rowIndex !== undefined && rowIndex !== null ? `row=${rowIndex}` : null,
    columnName ? `cell=${columnName}` : null,
    paragraphId !== undefined && paragraphId !== null ? `paragraph=${paragraphId}` : null,
    chunkId !== undefined && chunkId !== null ? `chunk=${chunkId}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "locator unavailable";
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

const EvidenceFallback = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const EvidenceSummary = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const RawPayload = styled.pre`
  margin: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.text};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
`;
