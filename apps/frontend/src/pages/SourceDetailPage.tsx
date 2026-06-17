import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useSource, useSourcePreview } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatBytes, formatDateTime } from "../shared/lib/format";

export function SourceDetailPage() {
  const { sourceId = "" } = useParams();
  const { data: source, isLoading, isError, refetch } = useSource(sourceId);
  const { data: preview, isLoading: isPreviewLoading, isError: isPreviewError } = useSourcePreview(sourceId);

  if (isLoading || isPreviewLoading) {
    return <PageState kind="loading" title="Source preview를 불러오는 중" description="파일 메타데이터와 CSV/Excel sample row를 준비하고 있습니다." />;
  }

  if (isError || isPreviewError || !source || !preview) {
    return (
      <PageState
        kind="error"
        title="Source 상세를 불러오지 못했습니다"
        description="source_id가 fixture에 없거나 preview endpoint boundary에서 실패했습니다."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader title={source.file_name} description="업로드 파일의 메타데이터와 샘플 preview를 확인합니다.">
        <HanaBadge tone={statusToTone(source.status)}>{source.status}</HanaBadge>
        <HanaBadge tone={statusToTone(source.preview_status)}>{source.preview_status}</HanaBadge>
      </PageHeader>
      <DetailGrid>
        <HanaCard title="Metadata">
          <MetaList>
            <dt>Source Type</dt>
            <dd>{source.source_type}</dd>
            <dt>MIME Type</dt>
            <dd>{source.mime_type}</dd>
            <dt>Size</dt>
            <dd>{formatBytes(source.size_bytes)}</dd>
            <dt>Uploaded At</dt>
            <dd>{formatDateTime(source.uploaded_at)}</dd>
            <dt>Created By</dt>
            <dd>{source.created_by}</dd>
          </MetaList>
        </HanaCard>
        <HanaCard title="Preview summary">
          <MetaList>
            <dt>Rows Sampled</dt>
            <dd>{preview.row_count_sampled}</dd>
            <dt>Total Rows</dt>
            <dd>{preview.total_row_count}</dd>
            <dt>Sheet</dt>
            <dd>{preview.sheet_name ?? "N/A"}</dd>
            <dt>Warnings</dt>
            <dd>{preview.warnings.length}</dd>
          </MetaList>
        </HanaCard>
      </DetailGrid>
      {preview.rows.length === 0 ? (
        <PageState kind="empty" title="Preview row가 없습니다" description="CSV/Excel preview API가 sample rows를 반환하면 여기에 표시됩니다." />
      ) : (
        <HanaCard title="CSV/Excel sample rows" description="MVP 1에서는 sample preview만 표시하고 profiling 상세는 후속 작업으로 둡니다.">
          <PreviewTable>
            <table>
              <thead>
                <tr>
                  {preview.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr key={index}>
                    {preview.columns.map((column) => (
                      <td key={column}>{row[column] ?? "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </PreviewTable>
        </HanaCard>
      )}
    </>
  );
}

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const MetaList = styled.dl`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px 18px;
  margin: 0;
  padding: 18px;

  dt {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: 800;
  }

  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const PreviewTable = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 14px 18px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
  }

  th {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    text-transform: uppercase;
  }
`;
