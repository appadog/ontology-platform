import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useCandidateEvidence } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { DataLink, KeyValueGrid, Mono, MutedText } from "./mvp2Shared";

const defaultProjectId = "project-corp-knowledge";

export function EvidenceViewerPage() {
  const { evidenceId = "evidence-policy-row-1" } = useParams();
  const evidenceQuery = useCandidateEvidence(evidenceId);

  if (evidenceQuery.isLoading) {
    return <PageState kind="loading" title="Evidence를 불러오는 중" description="candidate evidence source locator와 snippet을 조회하고 있습니다." />;
  }

  if (evidenceQuery.isError || !evidenceQuery.data) {
    return (
      <PageState
        kind="error"
        title="Evidence를 불러오지 못했습니다"
        description="MVP 2 candidate evidence endpoint 또는 fixture 상태를 확인하세요."
        actionLabel="다시 시도"
        onAction={() => void evidenceQuery.refetch()}
      />
    );
  }

  const evidence = evidenceQuery.data;

  return (
    <>
      <PageHeader title="Evidence Viewer" description="Candidate가 참조하는 원천 구간과 evidence text를 확인합니다.">
        <HanaBadge tone="neutral">{evidence.source_type}</HanaBadge>
      </PageHeader>
      <HanaCard title="Evidence locator" description="Backend actual API mode 전환 지점: GET /api/v1/candidate-evidence/{evidence_id}">
        <KeyValueGrid>
          <dt>ID</dt>
          <dd>
            <Mono>{evidence.id}</Mono>
          </dd>
          <dt>Source</dt>
          <dd>
            <DataLink to={`/projects/${defaultProjectId}/sources/${evidence.source_id}`}>{evidence.file_name}</DataLink>
          </dd>
          <dt>Segment</dt>
          <dd>
            <DataLink to={`/projects/${defaultProjectId}/sources/${evidence.source_id}/chunks`}>
              <Mono>{evidence.source_segment_id}</Mono>
            </DataLink>
          </dd>
          <dt>Sheet / Row</dt>
          <dd>{formatSheetRow(evidence.sheet_name, evidence.row_index, evidence.column_name)}</dd>
          <dt>Page / Section</dt>
          <dd>{formatPageSection(evidence.page_number, evidence.section_title, evidence.paragraph_id, evidence.chunk_id)}</dd>
          <dt>Offsets</dt>
          <dd>{formatOffsets(evidence.start_offset, evidence.end_offset)}</dd>
        </KeyValueGrid>
      </HanaCard>
      <HanaCard title="Evidence text" description="후속 화면은 이 text range를 candidate detail과 연결합니다.">
        <EvidenceText>{evidence.evidence_text}</EvidenceText>
      </HanaCard>
      <HanaCard title="Metadata" description="Fixture와 actual API 모두 nullable locator field를 그대로 렌더링합니다.">
        {evidence.metadata ? <MetadataBlock>{JSON.stringify(evidence.metadata, null, 2)}</MetadataBlock> : <MutedText>No metadata</MutedText>}
      </HanaCard>
    </>
  );
}

function formatSheetRow(sheetName?: string | null, rowIndex?: number | null, columnName?: string | null) {
  const parts = [sheetName ? `sheet=${sheetName}` : null, rowIndex !== undefined && rowIndex !== null ? `row=${rowIndex}` : null, columnName ? `column=${columnName}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "-";
}

function formatPageSection(pageNumber?: number | null, sectionTitle?: string | null, paragraphId?: string | null, chunkId?: string | null) {
  const parts = [
    pageNumber !== undefined && pageNumber !== null ? `page=${pageNumber}` : null,
    sectionTitle ? `section=${sectionTitle}` : null,
    paragraphId ? `paragraph=${paragraphId}` : null,
    chunkId ? `chunk=${chunkId}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "-";
}

function formatOffsets(startOffset?: number | null, endOffset?: number | null) {
  if (startOffset === undefined || startOffset === null || endOffset === undefined || endOffset === null) {
    return "-";
  }

  return `${startOffset}..${endOffset}`;
}

const EvidenceText = styled.blockquote`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  border-left: 4px solid ${({ theme }) => theme.color.primary};
  color: ${({ theme }) => theme.color.text};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const MetadataBlock = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  overflow: auto;
  color: ${({ theme }) => theme.color.text};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
`;
