import styled from "styled-components";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCandidateEvidence } from "../shared/api/queries";
import { CandidateEvidence } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { DataLink, KeyValueGrid, Mono, MutedText, WorkflowStage } from "./mvp2Shared";
import { formatDateTime } from "../shared/lib/format";

export function EvidenceViewerPage() {
  const { evidenceId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const context = getEvidenceRouteContext(searchParams);
  const evidenceQuery = useCandidateEvidence(evidenceId);

  if (evidenceQuery.isLoading) {
    return <PageState kind="loading" title="Evidence를 불러오는 중" description="Candidate가 참조한 Source 위치와 근거 문장을 조회하고 있습니다." />;
  }

  if (evidenceQuery.isError || !evidenceQuery.data) {
    return (
      <>
        <Breadcrumbs
          items={buildEvidenceBreadcrumb(context)}
        />
        <PageHeader title="근거 뷰어" description="Evidence 참조가 없거나 더 이상 조회되지 않습니다.">
          <HanaBadge tone="danger">BROKEN_EVIDENCE</HanaBadge>
        </PageHeader>
        <WorkflowStage current="Evidence" />
        <HanaCard title="누락되었거나 끊어진 Evidence">
          <KeyValueGrid>
            <dt>Evidence ID</dt>
            <dd>
              <Mono>{evidenceId || "-"}</Mono>
            </dd>
            <dt>Source ID</dt>
            <dd>
              <Mono>{context.sourceId ?? "-"}</Mono>
            </dd>
            <dt>Source segment</dt>
            <dd>{context.sourceSegmentId ? <Mono>{context.sourceSegmentId}</Mono> : "-"}</dd>
            <dt>검증 코드</dt>
            <dd>{context.validationCode ? <HanaBadge tone="warning">{context.validationCode}</HanaBadge> : "-"}</dd>
            <dt>Candidate</dt>
            <dd>{context.candidateId ? `${context.candidateKind ?? "Candidate"} / ${context.candidateId}` : "-"}</dd>
          </KeyValueGrid>
          <FallbackActions>
            <HanaButton type="button" onClick={() => void evidenceQuery.refetch()}>
              다시 시도
            </HanaButton>
            {context.jobId ? <ActionLink to={`/extraction-jobs/${context.jobId}/candidates`}>Candidate로 돌아가기</ActionLink> : null}
            {context.jobId ? <ActionLink to={`/extraction-jobs/${context.jobId}`}>Job으로 돌아가기</ActionLink> : null}
            {context.sourceId ? <ActionLink to={sourceDetailPath(context.sourceId, context.projectId)}>Source로 돌아가기</ActionLink> : null}
            {!context.jobId && !context.sourceId ? <ActionLink to="/projects">Projects로 돌아가기</ActionLink> : null}
          </FallbackActions>
        </HanaCard>
      </>
    );
  }

  const evidence = evidenceQuery.data;

  return (
    <>
      <Breadcrumbs
        items={buildEvidenceBreadcrumb(context, evidence)}
      />
      <PageHeader title="근거 뷰어" description="Candidate 판단에 사용된 Evidence 본문을 먼저 확인합니다.">
        <HanaBadge tone="neutral">{evidence.source_type}</HanaBadge>
        {context.jobId ? <DataLink to={`/extraction-jobs/${context.jobId}/candidates`}>Candidate로 돌아가기</DataLink> : null}
      </PageHeader>
      <WorkflowStage current="Evidence" action={context.jobId ? <DataLink to={`/extraction-jobs/${context.jobId}/candidates`}>Candidate로 돌아가기</DataLink> : null} />
      <HanaCard title="Evidence 읽기" description="Candidate 요약, 검증 상태, Source, Evidence 본문 순서로 읽습니다.">
        <ReadingPanel>
          <ReadingSummary>
            <div>
              <strong>{context.candidateKind ?? "Candidate"}</strong>
              <span>{context.candidateId ? shortId(context.candidateId) : "Candidate 맥락 없음"}</span>
            </div>
            <StatusRow>
              {context.validationCode ? <HanaBadge tone="warning">{context.validationCode}</HanaBadge> : <HanaBadge tone="neutral">VALIDATION_UNKNOWN</HanaBadge>}
              <HanaBadge tone="neutral">{evidence.source_type}</HanaBadge>
            </StatusRow>
          </ReadingSummary>
          <ReadingSource>
            <span>Source</span>
            <DataLink to={sourceDetailPath(evidence.source_id, context.projectId)}>{evidence.file_name}</DataLink>
            <small>{formatLocatorLabel(evidence)}</small>
          </ReadingSource>
          <EvidenceText>{renderHighlightedText(evidence.evidence_text, evidence.start_offset, evidence.end_offset)}</EvidenceText>
        </ReadingPanel>
      </HanaCard>
      <HanaCard title="Evidence 위치" description="근거 위치를 행/셀 또는 문단/구간 기준으로 확인합니다.">
        {renderLocatorHighlight(evidence)}
      </HanaCard>
      <HanaCard title="복구 동선" description="같은 맥락의 Candidate, 추출 작업, Source로 돌아갑니다.">
        <FallbackActions>
          {context.jobId ? <ActionLink to={`/extraction-jobs/${context.jobId}/candidates`}>Candidate로 돌아가기</ActionLink> : null}
          {context.jobId ? <ActionLink to={`/extraction-jobs/${context.jobId}`}>Job으로 돌아가기</ActionLink> : null}
          <ActionLink to={sourceDetailPath(evidence.source_id, context.projectId)}>Source로 돌아가기</ActionLink>
          {evidence.source_segment_id ? <ActionLink to={sourceChunksPath(evidence.source_id, context.projectId)}>구간 보기</ActionLink> : null}
        </FallbackActions>
      </HanaCard>
      <HanaCard title="Technical details" description="QA 재현에 필요한 위치 정보와 ID입니다.">
        <KeyValueGrid>
          <dt>ID</dt>
          <dd>
            <Mono>{evidence.id}</Mono>
          </dd>
          <dt>Source</dt>
          <dd>
            <DataLink to={sourceDetailPath(evidence.source_id, context.projectId)}>{evidence.file_name}</DataLink>
          </dd>
          <dt>Segment</dt>
          <dd>
            {evidence.source_segment_id ? (
              <DataLink to={sourceChunksPath(evidence.source_id, context.projectId)}>
                <Mono>{evidence.source_segment_id}</Mono>
              </DataLink>
            ) : (
              "-"
            )}
          </dd>
          <dt>Sheet / Row</dt>
          <dd>{formatSheetRow(evidence.sheet_name, evidence.row_index, evidence.column_name)}</dd>
          <dt>Page / Section</dt>
          <dd>{formatPageSection(evidence.page_number, evidence.section_title, evidence.paragraph_id, evidence.chunk_id)}</dd>
          <dt>Offsets</dt>
          <dd>{formatOffsets(evidence.start_offset, evidence.end_offset)}</dd>
          <dt>Created</dt>
          <dd>{formatDateTime(evidence.created_at)}</dd>
          <dt>Project</dt>
          <dd>{context.projectId ? <Mono>{context.projectId}</Mono> : "-"}</dd>
          <dt>Job</dt>
          <dd>{context.jobId ? <DataLink to={`/extraction-jobs/${context.jobId}`}>{context.jobId}</DataLink> : "-"}</dd>
          <dt>Candidate</dt>
          <dd>
            {context.jobId && context.candidateId ? (
              <DataLink to={`/extraction-jobs/${context.jobId}/candidates`}>
                {context.candidateKind ?? "Candidate"} / {context.candidateId}
              </DataLink>
            ) : (
              "-"
            )}
          </dd>
          <dt>검증 코드</dt>
          <dd>{context.validationCode ? <HanaBadge tone="warning">{context.validationCode}</HanaBadge> : "-"}</dd>
        </KeyValueGrid>
        {evidence.metadata ? (
          <MetadataDetails>
            <summary>metadata 보기</summary>
            <MetadataBlock>{JSON.stringify(evidence.metadata, null, 2)}</MetadataBlock>
          </MetadataDetails>
        ) : (
          <MutedText>추가 metadata가 없습니다.</MutedText>
        )}
      </HanaCard>
    </>
  );
}

interface EvidenceRouteContext {
  projectId: string | null;
  sourceId: string | null;
  sourceSegmentId: string | null;
  jobId: string | null;
  candidateId: string | null;
  candidateKind: string | null;
  validationCode: string | null;
}

function getEvidenceRouteContext(searchParams: URLSearchParams): EvidenceRouteContext {
  return {
    projectId: searchParams.get("project_id"),
    sourceId: searchParams.get("source_id"),
    sourceSegmentId: searchParams.get("source_segment_id"),
    jobId: searchParams.get("job_id"),
    candidateId: searchParams.get("candidate_id"),
    candidateKind: searchParams.get("candidate_kind"),
    validationCode: searchParams.get("validation_code"),
  };
}

function sourceDetailPath(sourceId: string, projectId?: string | null) {
  return projectId ? `/projects/${projectId}/sources/${sourceId}` : `/sources/${sourceId}`;
}

function sourceChunksPath(sourceId: string, projectId?: string | null) {
  return projectId ? `/projects/${projectId}/sources/${sourceId}/chunks` : `/sources/${sourceId}`;
}

function buildEvidenceBreadcrumb(context: EvidenceRouteContext, evidence?: CandidateEvidence) {
  const sourceId = evidence?.source_id ?? context.sourceId;
  const items: Array<{ label: string; to?: string }> = [{ label: "Projects", to: "/projects" }];

  if (context.projectId) {
    items.push({ label: "Project", to: `/projects/${context.projectId}` });
  }

  if (sourceId) {
    items.push({ label: "Source", to: sourceDetailPath(sourceId, context.projectId) });
  }

  if (context.jobId) {
    items.push({ label: "Job", to: `/extraction-jobs/${context.jobId}` });
    items.push({ label: "Candidates", to: `/extraction-jobs/${context.jobId}/candidates` });
  }

  if (context.candidateId) {
    items.push({ label: context.candidateKind ? `${context.candidateKind} candidate` : "Candidate" });
  }

  items.push({ label: "Evidence" });

  return items;
}

function formatSheetRow(sheetName?: string | null, rowIndex?: number | null, columnName?: string | null) {
  const parts = [sheetName ? `sheet=${sheetName}` : null, rowIndex !== undefined && rowIndex !== null ? `row=${rowIndex}` : null, columnName ? `column=${columnName}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "-";
}

function formatPageSection(pageNumber?: number | null, sectionTitle?: string | null, paragraphId?: number | null, chunkId?: number | null) {
  const parts = [
    pageNumber !== undefined && pageNumber !== null ? `page=${pageNumber}` : null,
    sectionTitle ? `section=${sectionTitle}` : null,
    paragraphId !== undefined && paragraphId !== null ? `paragraph=${paragraphId}` : null,
    chunkId !== undefined && chunkId !== null ? `chunk=${chunkId}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "-";
}

function formatOffsets(startOffset?: number | null, endOffset?: number | null) {
  if (startOffset === undefined || startOffset === null || endOffset === undefined || endOffset === null) {
    return "-";
  }

  return `${startOffset}..${endOffset}`;
}

function formatLocatorLabel(evidence: CandidateEvidence) {
  const sheetRow = formatSheetRow(evidence.sheet_name, evidence.row_index, evidence.column_name);
  if (sheetRow !== "-") {
    return sheetRow;
  }

  return formatPageSection(evidence.page_number, evidence.section_title, evidence.paragraph_id, evidence.chunk_id);
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function renderLocatorHighlight(evidence: CandidateEvidence) {
  if (
    evidence.row_index !== undefined &&
    evidence.row_index !== null
  ) {
    return (
      <StructuredHighlight>
        <table>
          <thead>
            <tr>
              <th>Sheet</th>
              <th>Row</th>
              <th>Cell</th>
              <th>Snippet</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{evidence.sheet_name ?? "-"}</td>
              <td data-highlight="true">{evidence.row_index}</td>
              <td data-highlight="true">{evidence.column_name ?? "row"}</td>
              <td>{evidence.evidence_text ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </StructuredHighlight>
    );
  }

  if (
    (evidence.page_number !== undefined && evidence.page_number !== null) ||
    (evidence.paragraph_id !== undefined && evidence.paragraph_id !== null) ||
    (evidence.chunk_id !== undefined && evidence.chunk_id !== null) ||
    evidence.section_title
  ) {
    return (
      <TextLocator>
        <HanaBadge tone="neutral">{evidence.source_type}</HanaBadge>
        <strong>{formatPageSection(evidence.page_number, evidence.section_title, evidence.paragraph_id, evidence.chunk_id)}</strong>
        <span>{formatOffsets(evidence.start_offset, evidence.end_offset)}</span>
      </TextLocator>
    );
  }

  if (evidence.source_segment_id) {
    return (
      <TextLocator>
        <HanaBadge tone="neutral">{String(evidence.metadata?.segment_type ?? "SEGMENT")}</HanaBadge>
        <strong>
          <Mono>{evidence.source_segment_id}</Mono>
        </strong>
        <span>{formatOffsets(evidence.start_offset, evidence.end_offset)}</span>
      </TextLocator>
    );
  }

  return (
    <BrokenLocator>
      <HanaBadge tone="warning">LOCATOR_MISSING</HanaBadge>
      <span>이 Evidence에 행/셀 또는 문단/구간 위치 정보가 없습니다.</span>
    </BrokenLocator>
  );
}

function renderHighlightedText(text?: string | null, startOffset?: number | null, endOffset?: number | null) {
  if (!text) {
    return "Evidence 본문이 없습니다.";
  }

  if (
    startOffset === undefined ||
    startOffset === null ||
    endOffset === undefined ||
    endOffset === null ||
    startOffset < 0 ||
    endOffset <= startOffset ||
    startOffset >= text.length
  ) {
    return <mark>{text}</mark>;
  }

  const boundedEnd = Math.min(endOffset, text.length);

  return (
    <>
      {text.slice(0, startOffset)}
      <mark>{text.slice(startOffset, boundedEnd)}</mark>
      {text.slice(boundedEnd)}
    </>
  );
}

const EvidenceText = styled.blockquote`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  border-left: 4px solid ${({ theme }) => theme.color.primary};
  color: ${({ theme }) => theme.color.text};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;

  mark {
    padding: 0 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.warningSoft};
    color: ${({ theme }) => theme.color.text};
  }
`;

const ReadingPanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ReadingSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};

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

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ReadingSource = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  small {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const StructuredHighlight = styled.div`
  overflow-x: auto;
  padding: ${({ theme }) => theme.spacing.lg};

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 12px 14px;
    border: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
  }

  th {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    text-transform: uppercase;
  }

  td[data-highlight="true"] {
    background: ${({ theme }) => theme.color.warningSoft};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const TextLocator = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const BrokenLocator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const FallbackActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.color.text};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const MetadataBlock = styled.pre`
  margin: ${({ theme }) => theme.spacing.md} 0 0;
  padding: ${({ theme }) => theme.spacing.md};
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.text};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
`;

const MetadataDetails = styled.details`
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  summary {
    cursor: pointer;
  }
`;
