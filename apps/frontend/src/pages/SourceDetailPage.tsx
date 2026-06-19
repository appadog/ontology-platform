import { FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useSource, useSourcePreview } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatBytes, formatDateTime } from "../shared/lib/format";

export function SourceDetailPage() {
  const { sourceId = "" } = useParams();
  const { data: source, isLoading, isError, refetch } = useSource(sourceId);
  const shouldLoadPreview = source?.preview_status === "READY";
  const { data: preview, isLoading: isPreviewLoading, isError: isPreviewError } = useSourcePreview(sourceId, shouldLoadPreview);

  if (isLoading || (shouldLoadPreview && isPreviewLoading)) {
    return <PageState kind="loading" title="Source preview를 불러오는 중" description="파일 메타데이터와 CSV/Excel sample row를 준비하고 있습니다." />;
  }

  if (isError || !source || (shouldLoadPreview && (isPreviewError || !preview))) {
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
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: "Sources", to: `/projects/${source.project_id}/sources` },
          { label: source.file_name },
        ]}
      />
      <PageHeader title={source.file_name} description="업로드 파일의 메타데이터와 샘플 preview를 확인합니다.">
        <HanaBadge tone={statusToTone(source.status)}>{source.status}</HanaBadge>
        <HanaBadge tone={statusToTone(source.preview_status)}>{source.preview_status}</HanaBadge>
        <HeaderLink to={`/projects/${source.project_id}/sources/${source.id}/profile`}>Profile</HeaderLink>
        <HeaderLink to={`/projects/${source.project_id}/sources/${source.id}/chunks`}>Chunks</HeaderLink>
        <HeaderLink to={`/projects/${source.project_id}/extraction/new`}>Create job</HeaderLink>
      </PageHeader>
      <DetailGrid>
        <HanaCard title="Metadata">
          <MetaList>
            <dt>Source Type</dt>
            <dd>{source.source_type}</dd>
            <dt>MIME Type</dt>
            <dd>{source.mime_type ?? "N/A"}</dd>
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
            <dt>Preview Status</dt>
            <dd>{source.preview_status}</dd>
            <dt>Rows Sampled</dt>
            <dd>{preview?.row_count_sampled ?? "-"}</dd>
            <dt>Total Rows</dt>
            <dd>{preview?.total_row_count ?? "-"}</dd>
            <dt>Sheet</dt>
            <dd>{preview?.sheet_name ?? "N/A"}</dd>
            <dt>Warnings</dt>
            <dd>{preview?.warnings?.length ?? "-"}</dd>
          </MetaList>
        </HanaCard>
      </DetailGrid>
      {source.preview_status === "NOT_AVAILABLE" ? (
        <PreviewNotice>
          <FileText aria-hidden="true" />
          <div>
            <strong>Preview not available</strong>
            <span>TXT/PDF source는 MVP 1에서 metadata만 제공하며 SourcePreviewStatus=NOT_AVAILABLE로 표시합니다.</span>
          </div>
        </PreviewNotice>
      ) : source.preview_status === "PENDING" ? (
        <PageState kind="empty" title="Preview 준비 중" description="CSV/Excel preview가 생성되면 SourcePreviewStatus=READY 상태로 table이 표시됩니다." />
      ) : source.preview_status === "FAILED" ? (
        <PageState kind="error" title="Preview 생성 실패" description="Backend preview job 또는 file parsing 상태를 확인하세요." />
      ) : !preview || preview.rows.length === 0 ? (
        <PageState kind="empty" title="Preview row가 없습니다" description="CSV/Excel preview API가 sample rows를 반환하면 여기에 표시됩니다." />
      ) : (
        <HanaCard title="CSV/Excel sample rows" description="MVP 1에서는 sample preview만 표시하고 profiling 상세는 후속 작업으로 둡니다.">
          <ColumnList>
            {preview.columns.map((column) => (
              <ColumnPill key={column.name}>
                <strong>{column.name}</strong>
                <span>
                  {column.data_type} · {column.nullable ? "nullable" : "required"}
                </span>
              </ColumnPill>
            ))}
          </ColumnList>
          <PreviewTable>
            <table>
              <thead>
                <tr>
                  {preview.columns.map((column) => (
                    <th key={column.name}>{column.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr key={index}>
                    {preview.columns.map((column) => (
                      <td key={column.name}>{row[column.name] ?? "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </PreviewTable>
          {(preview.warnings?.length ?? 0) > 0 && (
            <WarningList>
              {preview.warnings?.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </WarningList>
          )}
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

const PreviewNotice = styled.section`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};

  svg {
    width: 28px;
    height: 28px;
    color: ${({ theme }) => theme.color.textMuted};
  }

  div {
    display: grid;
    gap: 4px;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const ColumnList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 18px 18px 0;
`;

const ColumnPill = styled.div`
  display: grid;
  gap: 3px;
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  strong {
    font-size: 13px;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
  }
`;

const WarningList = styled.ul`
  margin: 0;
  padding: 0 18px 18px 38px;
  color: ${({ theme }) => theme.color.warning};
  font-weight: 700;
`;

const HeaderLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;
