import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useCandidateEntities, useCandidateEvidence, useCandidateRelations, useExtractionJob, useProject } from "../shared/api/queries";
import { CandidateEntity, CandidateListFilters, CandidateRelation, CandidateValidationCode, ValidationStatus } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatDateTime } from "../shared/lib/format";
import { DataLink, Field, FormGrid, InlineList, KeyValueGrid, Mono, MutedText, TableWrap, WorkflowStage, formatPercent } from "./mvp2Shared";

type EvidenceFilter = "ALL" | "WITH_EVIDENCE" | "MISSING_EVIDENCE";
type ValidationFilter = "ALL" | ValidationStatus;
type CandidateKindFilter = "ALL" | "ENTITY" | "RELATION";
type ValidationCodeFilter = "ALL" | CandidateValidationCode;
type CandidateRow =
  | { key: string; kind: "Entity"; candidate: CandidateEntity }
  | { key: string; kind: "Relation"; candidate: CandidateRelation };

const validationCodeOptions: CandidateValidationCode[] = [
  "MISSING_EVIDENCE",
  "INVALID_EVIDENCE_REFERENCE",
  "SCHEMA_MISMATCH",
  "ONTOLOGY_ELEMENT_NOT_FOUND",
  "RELATION_ENDPOINT_MISSING",
  "LOW_CONFIDENCE",
  "PROVIDER_OUTPUT_INVALID",
];

export function CandidateResultsPage() {
  const { jobId = "" } = useParams();
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("ALL");
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>("ALL");
  const [candidateKindFilter, setCandidateKindFilter] = useState<CandidateKindFilter>("ALL");
  const [validationCodeFilter, setValidationCodeFilter] = useState<ValidationCodeFilter>("ALL");
  const [selectedCandidateKey, setSelectedCandidateKey] = useState("");
  const filters = useMemo<CandidateListFilters>(() => {
    return {
      has_evidence: evidenceFilter === "ALL" ? undefined : evidenceFilter === "WITH_EVIDENCE",
      validation_status: validationFilter === "ALL" ? undefined : validationFilter,
    };
  }, [evidenceFilter, validationFilter]);
  const jobQuery = useExtractionJob(jobId);
  const projectQuery = useProject(jobQuery.data?.project_id ?? "");
  const entitiesQuery = useCandidateEntities(jobId, filters);
  const relationsQuery = useCandidateRelations(jobId, filters);
  const filteredEntities = useMemo(
    () => filterCandidatesByValidationCode(entitiesQuery.data ?? [], validationCodeFilter),
    [entitiesQuery.data, validationCodeFilter],
  );
  const filteredRelations = useMemo(
    () => filterCandidatesByValidationCode(relationsQuery.data ?? [], validationCodeFilter),
    [relationsQuery.data, validationCodeFilter],
  );
  const candidateRows = useMemo<CandidateRow[]>(() => {
    const entityRows = candidateKindFilter === "RELATION" ? [] : filteredEntities.map((candidate) => ({
      key: `entity:${candidate.id}`,
      kind: "Entity" as const,
      candidate,
    }));
    const relationRows = candidateKindFilter === "ENTITY" ? [] : filteredRelations.map((candidate) => ({
      key: `relation:${candidate.id}`,
      kind: "Relation" as const,
      candidate,
    }));

    return [...entityRows, ...relationRows];
  }, [candidateKindFilter, filteredEntities, filteredRelations]);
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
    return <PageState kind="loading" title="Candidate results를 불러오는 중" description="엔티티와 관계 후보, Evidence 연결 상태를 조회하고 있습니다." />;
  }

  if (jobQuery.isError || entitiesQuery.isError || relationsQuery.isError || !jobQuery.data || !entitiesQuery.data || !relationsQuery.data) {
    return (
      <PageState
        kind="error"
        title="Candidate results를 불러오지 못했습니다"
        description="추출 작업 상태를 확인한 뒤 후보 결과를 다시 불러오세요."
        actionLabel="다시 시도"
        onAction={() => {
          void jobQuery.refetch();
          void entitiesQuery.refetch();
          void relationsQuery.refetch();
        }}
      />
    );
  }

  const candidates = candidateRows.map((row) => row.candidate);
  const warningCount = candidates.filter((candidate) => candidate.validation_status === "WARNING").length;
  const failedCount = candidates.filter((candidate) => candidate.validation_status === "FAILED").length;
  const missingEvidenceCount = candidates.filter((candidate) => candidate.evidence_ids.length === 0).length;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data?.name ?? "프로젝트", to: `/projects/${jobQuery.data.project_id}` },
          { label: "Candidates", to: `/projects/${jobQuery.data.project_id}/extraction-jobs` },
          { label: `작업 #${shortId(jobQuery.data.id)}` },
        ]}
      />
      <PageHeader title="후보 결과" description="Candidate를 검토하고 Evidence로 판단 근거를 확인합니다.">
        <StatusBadge token={jobQuery.data.status} tone={statusToTone(jobQuery.data.status)} />
        <DataLink to={`/extraction-jobs/${jobQuery.data.id}`}>Job으로 돌아가기</DataLink>
      </PageHeader>
      <WorkflowStage current="Candidates" action={<DataLink to={`/extraction-jobs/${jobQuery.data.id}`}>Extraction 상태 보기</DataLink>} />
      <ReviewSummary aria-label="Candidate review summary">
        <strong>{candidateRows.length}개 Candidate</strong>
        <span>Entity {filteredEntities.length} · Relation {filteredRelations.length}</span>
        <span>주의 {warningCount} · 실패 {failedCount} · Evidence 없음 {missingEvidenceCount}</span>
        <span>{jobQuery.data.retry_of_job_id ? "Retry 결과" : "첫 실행 결과"}</span>
      </ReviewSummary>
      <HanaCard title="Filters" description="유형, 검증 상태, Evidence 유무를 기준으로 후보를 좁혀 봅니다.">
        <FormGrid>
          <Field>
            <span>Kind</span>
            <HanaSelect value={candidateKindFilter} onChange={(event) => setCandidateKindFilter(event.target.value as CandidateKindFilter)}>
              <option value="ALL">All</option>
              <option value="ENTITY">Entities</option>
              <option value="RELATION">Relations</option>
            </HanaSelect>
          </Field>
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
          <Field>
            <span>검증 코드</span>
            <HanaSelect value={validationCodeFilter} onChange={(event) => setValidationCodeFilter(event.target.value as ValidationCodeFilter)}>
              <option value="ALL">All</option>
              {validationCodeOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </HanaSelect>
          </Field>
        </FormGrid>
      </HanaCard>
      {candidates.length === 0 ? (
        <PageState kind="empty" title="조건에 맞는 Candidate가 없습니다" description="filter를 조정하거나 추출 작업 모니터에서 실행 상태를 확인하세요." />
      ) : (
        <>
          <CandidateCardList aria-label="Mobile candidate review list">
            {candidateRows.map((row) => (
              <CandidateCardItem key={row.key} data-selected={row.key === selectedCandidateRow?.key}>
                <CandidateCardHeader>
                  <div>
                    <strong>{getCandidateTitle(row)}</strong>
                    <span>{getCandidateSubtitle(row)}</span>
                  </div>
                  <HanaBadge tone="neutral">{row.kind}</HanaBadge>
                </CandidateCardHeader>
                <CardSignalRow>
                  <StatusBadge token={row.candidate.validation_status} tone={statusToTone(row.candidate.validation_status)} />
                  {row.candidate.validation_codes.length === 0 ? <HanaBadge tone="success">NO_CODE</HanaBadge> : null}
                  {row.candidate.validation_codes.map((code) => (
                    <HanaBadge key={code} tone="warning">
                      {code}
                    </HanaBadge>
                  ))}
                  <strong>{formatPercent(row.candidate.confidence)}</strong>
                </CardSignalRow>
                {renderCandidateContext(row.candidate, jobQuery.data.id)}
                <CardActionRow>
                  {renderEvidenceLinks(row.candidate.evidence_ids, row.candidate, row.kind, jobQuery.data.id)}
                  <HanaButton type="button" variant="ghost" onClick={() => setSelectedCandidateKey(row.key)}>
                    Detail 보기
                  </HanaButton>
                </CardActionRow>
              </CandidateCardItem>
            ))}
          </CandidateCardList>
          {candidateKindFilter !== "RELATION" && (
          <CandidateTableCard title="Entity candidates" description="Entity 후보의 class, 신뢰도, 검증 상태, Evidence 연결을 한 번에 비교합니다.">
            {filteredEntities.length === 0 ? (
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
                      <th>Context</th>
                      <th>Created</th>
                      <th>검토</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntities.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>
                          <CandidateName>
                            <strong>{candidate.entity_name}</strong>
                            <span>{formatProperties(candidate.property_values)}</span>
                          </CandidateName>
                        </td>
                        <td>
                          <Mono>{shortId(formatNullable(candidate.class_id))}</Mono>
                        </td>
                        <td>{formatPercent(candidate.confidence)}</td>
                        <td>
                          <StatusStack>
                            <StatusBadge token={candidate.validation_status} tone={statusToTone(candidate.validation_status)} />
                            {candidate.validation_codes.map((code) => (
                              <HanaBadge key={code} tone="warning">
                                {code}
                              </HanaBadge>
                            ))}
                            <StatusBadge token={candidate.publish_status} tone={statusToTone(candidate.publish_status)} />
                          </StatusStack>
                        </td>
                        <td>{renderEvidenceLinks(candidate.evidence_ids, candidate, "Entity", jobQuery.data.id)}</td>
                        <td>{renderCandidateContext(candidate, jobQuery.data.id)}</td>
                        <td>{formatDateTime(candidate.created_at)}</td>
                        <td>
                          <HanaButton type="button" variant="ghost" onClick={() => setSelectedCandidateKey(`entity:${candidate.id}`)}>
                            Detail 보기
                          </HanaButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </CandidateTableCard>
          )}
          {candidateKindFilter !== "ENTITY" && (
          <CandidateTableCard title="Relation candidates" description="Relation 후보의 양쪽 대상, 신뢰도, 검증 상태, Evidence 연결을 비교합니다.">
            {filteredRelations.length === 0 ? (
              <PageState kind="empty" title="Relation candidate가 없습니다" description="현재 filter 조건에 맞는 relation candidate가 없습니다." />
            ) : (
              <TableWrap>
                <table>
                  <thead>
                    <tr>
                      <th>Relation</th>
                      <th>Members</th>
                      <th>Confidence</th>
                      <th>Validation</th>
                      <th>Evidence</th>
                      <th>Context</th>
                      <th>Created</th>
                      <th>검토</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRelations.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>
                          <CandidateName>
                            <strong>{formatRelationMembers(candidate)}</strong>
                            <span>Relation {shortId(formatNullable(candidate.relation_id))}</span>
                          </CandidateName>
                        </td>
                        <td>
                          <CandidateName>
                            <strong>{shortId(formatNullable(candidate.source_candidate_entity_id))}</strong>
                            <span>{shortId(formatNullable(candidate.target_candidate_entity_id))}</span>
                          </CandidateName>
                        </td>
                        <td>{formatPercent(candidate.confidence)}</td>
                        <td>
                          <StatusStack>
                            <StatusBadge token={candidate.validation_status} tone={statusToTone(candidate.validation_status)} />
                            {candidate.validation_codes.map((code) => (
                              <HanaBadge key={code} tone="warning">
                                {code}
                              </HanaBadge>
                            ))}
                            <StatusBadge token={candidate.publish_status} tone={statusToTone(candidate.publish_status)} />
                          </StatusStack>
                        </td>
                        <td>{renderEvidenceLinks(candidate.evidence_ids, candidate, "Relation", jobQuery.data.id)}</td>
                        <td>{renderCandidateContext(candidate, jobQuery.data.id)}</td>
                        <td>{formatDateTime(candidate.created_at)}</td>
                        <td>
                          <HanaButton type="button" variant="ghost" onClick={() => setSelectedCandidateKey(`relation:${candidate.id}`)}>
                            Detail 보기
                          </HanaButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </CandidateTableCard>
          )}
          {selectedCandidateRow && (
            <HanaCard title="Candidate detail" description="선택한 후보의 판단 정보와 Evidence 상태를 확인합니다.">
              <SelectedSummary>
                <div>
                  <strong>{getCandidateTitle(selectedCandidateRow)}</strong>
                  <span>{getCandidateSubtitle(selectedCandidateRow)}</span>
                </div>
                <StatusStack>
                  <HanaBadge tone="neutral">{selectedCandidateRow.kind}</HanaBadge>
                  <StatusBadge
                    token={selectedCandidateRow.candidate.validation_status}
                    tone={statusToTone(selectedCandidateRow.candidate.validation_status)}
                  />
                  <HanaBadge tone="progress">{formatPercent(selectedCandidateRow.candidate.confidence)}</HanaBadge>
                </StatusStack>
              </SelectedSummary>
              <KeyValueGrid>
                <dt>Type</dt>
                <dd>{selectedCandidateRow.kind}</dd>
                <dt>Source</dt>
                <dd>
                  <Mono>{shortId(selectedCandidateRow.candidate.source_id)}</Mono>
                </dd>
                <dt>Source segment</dt>
                <dd>{selectedCandidateRow.candidate.source_segment_id ? shortId(selectedCandidateRow.candidate.source_segment_id) : "-"}</dd>
                <dt>Confidence</dt>
                <dd>{formatPercent(selectedCandidateRow.candidate.confidence)}</dd>
                <dt>Validation</dt>
                <dd>
                  <StatusStack>
                    <StatusBadge
                      token={selectedCandidateRow.candidate.validation_status}
                      tone={statusToTone(selectedCandidateRow.candidate.validation_status)}
                    />
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
                    <StatusBadge
                      token={selectedCandidateRow.candidate.review_status}
                      tone={statusToTone(selectedCandidateRow.candidate.review_status)}
                    />
                    <StatusBadge
                      token={selectedCandidateRow.candidate.publish_status}
                      tone={statusToTone(selectedCandidateRow.candidate.publish_status)}
                    />
                  </StatusStack>
                </dd>
                <dt>Retry dedupe</dt>
                <dd>{jobQuery.data.retry_of_job_id ? `Retry ${shortId(jobQuery.data.retry_of_job_id)}` : "첫 실행 결과"}</dd>
              </KeyValueGrid>
              {selectedCandidateRow.candidate.evidence_ids.length === 0 ? (
                <EvidenceFallback>
                  <HanaBadge tone="warning">MISSING_EVIDENCE</HanaBadge>
                  <span>연결된 Evidence가 없습니다. Job 상태를 확인하거나 filter를 조정하세요.</span>
                  <DataLink to={`/extraction-jobs/${jobQuery.data.id}`}>Job으로 돌아가기</DataLink>
                </EvidenceFallback>
              ) : evidenceQuery.isLoading ? (
                <PageState kind="loading" title="Evidence detail을 불러오는 중" description="첫 Evidence 위치 정보를 확인하고 있습니다." />
              ) : evidenceQuery.isError || !evidenceQuery.data ? (
                <EvidenceFallback>
                  <HanaBadge tone="danger">BROKEN_EVIDENCE</HanaBadge>
                  <span>Evidence reference cannot be opened.</span>
                  <DataLink
                    to={buildEvidencePath(
                      selectedEvidenceId,
                      selectedCandidateRow.candidate,
                      selectedCandidateRow.kind,
                      jobQuery.data.id,
                    )}
                  >
                    복구 화면 열기
                  </DataLink>
                </EvidenceFallback>
              ) : (
                <EvidenceSummary>
                  <strong>{evidenceQuery.data.file_name}</strong>
                  <span>
                    {formatEvidenceLocator(evidenceQuery.data.row_index, evidenceQuery.data.column_name, evidenceQuery.data.paragraph_id, evidenceQuery.data.chunk_id)}
                  </span>
                  <MutedText>{evidenceQuery.data.evidence_text ?? "Evidence 본문이 없습니다."}</MutedText>
                  <DataLink
                    to={buildEvidencePath(
                      evidenceQuery.data.id,
                      selectedCandidateRow.candidate,
                      selectedCandidateRow.kind,
                      jobQuery.data.id,
                    )}
                  >
                    Evidence 보기
                  </DataLink>
                </EvidenceSummary>
              )}
              <TechnicalDetails>
                <summary>Technical details</summary>
                <KeyValueGrid>
                  <dt>Candidate ID</dt>
                  <dd><Mono>{selectedCandidateRow.candidate.id}</Mono></dd>
                  <dt>Source ID</dt>
                  <dd><Mono>{selectedCandidateRow.candidate.source_id}</Mono></dd>
                  <dt>Ontology version</dt>
                  <dd><Mono>{selectedCandidateRow.candidate.ontology_version_id}</Mono></dd>
                  <dt>Prompt version</dt>
                  <dd><Mono>{selectedCandidateRow.candidate.prompt_version_id}</Mono></dd>
                  <dt>Model run</dt>
                  <dd><Mono>{selectedCandidateRow.candidate.model_run_id}</Mono></dd>
                </KeyValueGrid>
                <RawPayload>{JSON.stringify(selectedCandidateRow.candidate.raw_payload, null, 2)}</RawPayload>
              </TechnicalDetails>
            </HanaCard>
          )}
        </>
      )}
    </>
  );
}

function getCandidateTitle(row: CandidateRow) {
  if (row.kind === "Entity") {
    return row.candidate.entity_name;
  }

  return formatRelationMembers(row.candidate);
}

function getCandidateSubtitle(row: CandidateRow) {
  if (row.kind === "Entity") {
    return `Class ${shortId(formatNullable(row.candidate.class_id))}`;
  }

  return `Relation ${shortId(formatNullable(row.candidate.relation_id))}`;
}

function formatRelationMembers(candidate: CandidateRelation) {
  return `${shortId(formatNullable(candidate.source_candidate_entity_id))} -> ${shortId(formatNullable(candidate.target_candidate_entity_id))}`;
}

function formatProperties(values: Record<string, unknown>) {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    return "No extracted properties";
  }

  return entries.map(([key, value]) => `${key}: ${value ?? "-"}`).join(" · ");
}

function filterCandidatesByValidationCode<T extends CandidateEntity | CandidateRelation>(
  candidates: T[],
  validationCodeFilter: ValidationCodeFilter,
) {
  if (validationCodeFilter === "ALL") {
    return candidates;
  }

  return candidates.filter((candidate) => candidate.validation_codes.includes(validationCodeFilter));
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
        <MutedText>Evidence 없음</MutedText>
      </InlineList>
    );
  }

  return (
    <InlineList>
      <HanaBadge tone="success">{evidenceIds.length} evidence</HanaBadge>
      {evidenceIds.map((evidenceId, index) => (
        <DataLink key={evidenceId} to={buildEvidencePath(evidenceId, candidate, kind, jobId)}>
          Evidence {index + 1}
        </DataLink>
      ))}
    </InlineList>
  );
}

function renderCandidateContext(candidate: CandidateEntity | CandidateRelation, jobId: string) {
  return (
    <ContextStack>
      <span>Source <Mono>{shortId(candidate.source_id)}</Mono></span>
      <span>Job <Mono>{shortId(jobId)}</Mono></span>
      {candidate.source_segment_id ? <span>Segment <Mono>{shortId(candidate.source_segment_id)}</Mono></span> : null}
    </ContextStack>
  );
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
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

  return parts.length > 0 ? parts.join(" · ") : "위치 정보 없음";
}

const ReviewSummary = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};

  strong {
    color: ${({ theme }) => theme.color.text};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const CandidateCardList = styled.section`
  display: none;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 760px) {
    display: grid;
  }
`;

const CandidateCardItem = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};

  &[data-selected="true"] {
    border-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }
`;

const CandidateCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;

  div {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  strong,
  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const CardSignalRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  strong {
    color: ${({ theme }) => theme.color.text};
  }
`;

const CardActionRow = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};

  button {
    justify-self: start;
  }
`;

const CandidateTableCard = styled(HanaCard)`
  /* Card stays pinned to page width; the table scrolls horizontally inside it
     (FE6-027). The 8-column candidate table gets a sensible min-width so the
     Context column is never cramped on mid widths. */
  width: 100%;
  max-width: 100%;
  min-width: 0;

  table {
    min-width: 980px;
  }

  @media (max-width: 760px) {
    display: none;
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
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ContextStack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
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

const SelectedSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg} 0;

  div {
    display: grid;
    gap: ${({ theme }) => theme.spacing.xs};
    min-width: 0;
  }

  strong,
  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const RawPayload = styled.pre`
  margin: ${({ theme }) => theme.spacing.md} 0 0;
  padding: ${({ theme }) => theme.spacing.md};
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.text};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
`;

const TechnicalDetails = styled.details`
  margin: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  summary {
    cursor: pointer;
  }
`;
