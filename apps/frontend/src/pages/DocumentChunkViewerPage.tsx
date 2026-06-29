import { FileSearch, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useParseSource, useProject, useSource, useSourceSegments } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatDateTime } from "../shared/lib/format";
import { KeyValueGrid, Mono, MutedText, PanelGrid } from "./mvp2Shared";

export function DocumentChunkViewerPage() {
  const { sourceId = "" } = useParams();
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const { data: source, isLoading: isSourceLoading, isError: isSourceError, refetch: refetchSource } = useSource(sourceId);
  const projectQuery = useProject(source?.project_id ?? "");
  const projectName = projectQuery.data?.name ?? "프로젝트";
  const { data: segments, isLoading, isError, refetch } = useSourceSegments(sourceId);
  const parseSource = useParseSource(sourceId);
  const selectedSegment = useMemo(
    () => segments?.find((segment) => segment.id === selectedSegmentId) ?? segments?.[0],
    [selectedSegmentId, segments],
  );

  if (isSourceLoading || isLoading) {
    return <PageState kind="loading" title="Document chunks를 불러오는 중" description="source segment를 준비하고 있습니다." />;
  }

  if (isSourceError || !source || isError || !segments) {
    return (
      <PageState
        kind="error"
        title="Document chunks를 불러오지 못했습니다"
        description="source detail에서 파일 상태를 확인한 뒤 다시 시도하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void refetchSource();
          void refetch();
        }}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectName, to: `/projects/${source.project_id}` },
          { label: "Sources", to: `/projects/${source.project_id}/sources` },
          { label: source.file_name, to: `/projects/${source.project_id}/sources/${source.id}` },
          { label: "Chunks" },
        ]}
      />
      <PageHeader title="문서 청크" description="Source에서 evidence가 연결될 row, cell, paragraph, chunk를 확인합니다.">
        <HanaBadge tone="muted">Evidence anchors</HanaBadge>
        <HanaButton type="button" onClick={() => parseSource.mutate()} disabled={parseSource.isPending}>
          <Play aria-hidden="true" />
          {parseSource.isPending ? "Parsing" : "Parse source"}
        </HanaButton>
      </PageHeader>
      {parseSource.data && (
        <HanaCard title="Parse summary" description="마지막 parse 결과와 warning을 확인합니다.">
          <KeyValueGrid>
            <dt>Source</dt>
            <dd>
              <Mono>{parseSource.data.source_id}</Mono>
            </dd>
            <dt>Segment count</dt>
            <dd>{parseSource.data.segment_count}</dd>
            <dt>Segment types</dt>
            <dd>{parseSource.data.segment_types.join(", ") || "-"}</dd>
            <dt>Warnings</dt>
            <dd>{parseSource.data.warnings?.join(", ") || "-"}</dd>
          </KeyValueGrid>
        </HanaCard>
      )}
      {segments.length === 0 ? (
        <PageState kind="empty" title="Segment가 없습니다" description="parse source를 실행하면 chunk/page/row segment가 표시됩니다." />
      ) : (
        <PanelGrid>
          <HanaCard title="Segments" description={source.file_name}>
            <SegmentList>
              {segments.map((segment) => (
                <button key={segment.id} type="button" data-selected={segment.id === selectedSegment?.id} onClick={() => setSelectedSegmentId(segment.id)}>
                  <span>
                    <FileSearch aria-hidden="true" />
                    <strong>{segment.segment_type}</strong>
                  </span>
                  <MutedText>Sequence {segment.sequence}</MutedText>
                  <Mono>{segment.id}</Mono>
                  <MutedText>{segment.text ?? "Structured locator only"}</MutedText>
                </button>
              ))}
            </SegmentList>
          </HanaCard>
          <HanaCard title="Selected segment" description="선택한 source 구간의 locator와 text를 확인합니다.">
            {selectedSegment ? (
              <>
                <KeyValueGrid>
                  <dt>ID</dt>
                  <dd>
                    <Mono>{selectedSegment.id}</Mono>
                  </dd>
                  <dt>Type</dt>
                  <dd>
                    <HanaBadge tone="neutral">{selectedSegment.segment_type}</HanaBadge>
                  </dd>
                  <dt>Sequence</dt>
                  <dd>{selectedSegment.sequence}</dd>
                  <dt>Row / Column</dt>
                  <dd>
                    {selectedSegment.row_index ?? "-"} / {selectedSegment.column_name ?? "-"}
                  </dd>
                  <dt>Page / Section</dt>
                  <dd>
                    {selectedSegment.page_number ?? "-"} / {selectedSegment.section_title ?? "-"}
                  </dd>
                  <dt>Chunk</dt>
                  <dd>{selectedSegment.chunk_index ?? selectedSegment.paragraph_index ?? "-"}</dd>
                  <dt>Created</dt>
                  <dd>{formatDateTime(selectedSegment.created_at)}</dd>
                </KeyValueGrid>
                <TextPanel>{selectedSegment.text ?? "No text body for this structured segment."}</TextPanel>
              </>
            ) : (
              <PageState kind="empty" title="선택된 segment가 없습니다" description="왼쪽 목록에서 segment를 선택하세요." />
            )}
          </HanaCard>
        </PanelGrid>
      )}
    </>
  );
}

const SegmentList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};

  button {
    display: grid;
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surfaceRaised};
    color: ${({ theme }) => theme.color.text};
    text-align: left;
    cursor: pointer;

    &[data-selected="true"] {
      border-color: ${({ theme }) => theme.color.primary};
      background: ${({ theme }) => theme.color.primarySoft};
    }
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const TextPanel = styled.pre`
  margin: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.text};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  white-space: pre-wrap;
`;
