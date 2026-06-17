import { Upload } from "lucide-react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { mockProjects } from "../shared/mocks/fixtures";
import { useSources } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatBytes, formatDateTime } from "../shared/lib/format";

const currentProjectId = mockProjects[0].id;

export function SourceManagerPage() {
  const { data: sources, isLoading, isError, refetch } = useSources(currentProjectId);

  if (isLoading) {
    return <PageState kind="loading" title="원천 데이터 목록을 불러오는 중" description="SourceData fixture와 upload 상태를 조회하고 있습니다." />;
  }

  if (isError || !sources) {
    return (
      <PageState
        kind="error"
        title="원천 데이터 목록을 불러오지 못했습니다"
        description="Source API boundary 또는 mock fixture 상태를 확인하세요."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader title="Sources" description="업로드된 CSV, Excel, PDF, TXT 원천 데이터 상태와 preview 준비 상태를 확인합니다.">
        <HanaButton variant="primary" type="button">
          <Upload aria-hidden="true" />
          Upload Source
        </HanaButton>
      </PageHeader>
      {sources.length === 0 ? (
        <PageState kind="empty" title="업로드된 원천 데이터가 없습니다" description="SourceData를 업로드하면 parse/profile 상태와 preview 링크가 표시됩니다." />
      ) : (
        <HanaCard>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Preview</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <SourceLink to={`/sources/${source.id}`}>
                        <strong>{source.file_name}</strong>
                        <span>{source.storage_uri}</span>
                      </SourceLink>
                    </td>
                    <td>
                      <HanaBadge tone="neutral">{source.source_type}</HanaBadge>
                    </td>
                    <td>
                      <HanaBadge tone={statusToTone(source.status)}>{source.status}</HanaBadge>
                    </td>
                    <td>
                      <HanaBadge tone={statusToTone(source.preview_status)}>{source.preview_status}</HanaBadge>
                    </td>
                    <td>{formatBytes(source.size_bytes)}</td>
                    <td>{formatDateTime(source.uploaded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </HanaCard>
      )}
    </>
  );
}

const TableWrap = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 16px 18px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    text-transform: uppercase;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const SourceLink = styled(Link)`
  display: grid;
  gap: 4px;

  strong {
    color: ${({ theme }) => theme.color.primary};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
  }
`;
