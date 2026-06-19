import { ChangeEvent, useState } from "react";
import { Upload } from "lucide-react";
import styled from "styled-components";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSources, useUploadSource } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatBytes, formatDateTime } from "../shared/lib/format";
import { SourceType } from "../shared/api/types";

export function SourceManagerPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const { data: sources, isLoading, isError, refetch } = useSources(projectId);
  const uploadSource = useUploadSource(projectId);
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("CSV");
  const [displayName, setDisplayName] = useState("");

  const canUpload = Boolean(file) && !uploadSource.isPending;

  if (!projectId) {
    return (
      <PageState
        kind="empty"
        title="Project context가 필요합니다"
        description="Projects에서 작업할 project를 선택한 뒤 source를 업로드하세요."
        actionLabel="Go to projects"
        onAction={() => navigate("/projects")}
      />
    );
  }

  function handleUpload() {
    if (!file) {
      return;
    }

    uploadSource.mutate(
      {
        file,
        source_type: sourceType,
        display_name: displayName.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFile(null);
          setDisplayName("");
        },
      },
    );
  }

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
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: "Sources" },
        ]}
      />
      <PageHeader title="Sources" description="업로드된 CSV, Excel, PDF, TXT 원천 데이터 상태와 preview 준비 상태를 확인합니다.">
        <HanaButton variant="primary" type="button" disabled={!canUpload} onClick={handleUpload}>
          <Upload aria-hidden="true" />
          {uploadSource.isPending ? "Uploading" : "Upload Source"}
        </HanaButton>
      </PageHeader>
      <HanaCard title="Upload source" description="SourceUploadRequest(file, source_type, display_name)를 multipart API로 보낼 준비가 된 입력 영역입니다.">
        <UploadGrid>
          <Field>
            <span>File</span>
            <FileInput type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} />
          </Field>
          <Field>
            <span>Source Type</span>
            <HanaSelect value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
              <option value="CSV">CSV</option>
              <option value="EXCEL">EXCEL</option>
              <option value="TXT">TXT</option>
              <option value="PDF">PDF</option>
            </HanaSelect>
          </Field>
          <Field>
            <span>Display Name</span>
            <HanaInput
              value={displayName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)}
              placeholder={file?.name ?? "선택 사항"}
            />
          </Field>
        </UploadGrid>
        {uploadSource.isError && <InlineError>업로드 요청에 실패했습니다. mock/API boundary와 backend Source API 상태를 확인하세요.</InlineError>}
      </HanaCard>
      {sources.length === 0 ? (
        <PageState
          kind="empty"
          title="업로드된 원천 데이터가 없습니다"
          description="파일을 업로드하면 detail, profile, chunks, extraction으로 이어집니다."
          actionLabel="Choose file"
          onAction={() => document.querySelector<HTMLInputElement>("input[type='file']")?.click()}
        />
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
                      <SourceLink to={`/projects/${projectId}/sources/${source.id}`}>
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

const UploadGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 2fr) 160px minmax(180px, 1fr);
  gap: 12px;
  padding: 18px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 6px;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }
`;

const FileInput = styled.input`
  width: 100%;
  min-height: 38px;
  padding: 7px 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
`;

const InlineError = styled.p`
  margin: 0;
  padding: 0 18px 18px;
  color: ${({ theme }) => theme.color.danger};
  font-weight: 800;
`;
