import { ChangeEvent, useState } from "react";
import { Upload } from "lucide-react";
import styled from "styled-components";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProject, useSources, useUploadSource } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatBytes, formatDateTime } from "../shared/lib/format";
import { SourceType } from "../shared/api/types";

export function SourceManagerPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
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
        title="프로젝트 선택이 필요합니다"
        description="프로젝트 목록에서 작업할 프로젝트를 선택한 뒤 소스를 업로드하세요."
        actionLabel="프로젝트로 이동"
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
    return <PageState kind="loading" title="원천 데이터 목록을 불러오는 중" description="업로드된 파일과 처리 상태를 준비하고 있습니다." />;
  }

  if (isError || !sources) {
    return (
      <PageState
        kind="error"
        title="원천 데이터 목록을 불러오지 못했습니다"
        description="파일 목록을 다시 불러오거나 잠시 후 재시도하세요."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data?.name ?? "프로젝트", to: `/projects/${projectId}` },
          { label: "Sources" },
        ]}
      />
      <PageHeader title="소스" description="프로젝트의 CSV, Excel, PDF, TXT 원천 데이터 상태와 다음 처리 단계를 확인합니다.">
        <HanaButton
          variant="primary"
          type="button"
          onClick={() => {
            if (canUpload) {
              handleUpload();
              return;
            }
            const input = document.querySelector<HTMLInputElement>("input[type='file']");
            input?.scrollIntoView({ behavior: "smooth", block: "center" });
            input?.focus();
          }}
        >
          <Upload aria-hidden="true" />
          {uploadSource.isPending ? "업로드 중" : file ? "소스 업로드" : "파일 선택"}
        </HanaButton>
      </PageHeader>
      <HanaCard
        eyebrow="원천 데이터 추가"
        title="원천 데이터 업로드"
        description="파일 유형과 표시 이름을 정한 뒤 원천 데이터를 업로드하면 컬럼 프로파일 또는 구간 보기로 이어집니다."
      >
        <UploadGrid>
          <Field>
            <span>파일</span>
            <FileInput type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} />
          </Field>
          <Field>
            <span>소스 유형</span>
            <HanaSelect value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
              <option value="CSV">CSV</option>
              <option value="EXCEL">EXCEL</option>
              <option value="TXT">TXT</option>
              <option value="PDF">PDF</option>
            </HanaSelect>
          </Field>
          <Field>
            <span>표시 이름</span>
            <HanaInput
              value={displayName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)}
              placeholder={file?.name ?? "선택 사항"}
            />
          </Field>
        </UploadGrid>
        {uploadSource.isError && <InlineError>업로드에 실패했습니다. 파일 유형과 크기를 확인한 뒤 다시 시도하세요.</InlineError>}
      </HanaCard>
      {sources.length === 0 ? (
        <PageState
          kind="empty"
          title="업로드된 원천 데이터가 없습니다"
          description="파일을 업로드하면 Source 상세에서 컬럼 프로파일 또는 구간 보기로 이어집니다."
          actionLabel="파일 선택"
          onAction={() => document.querySelector<HTMLInputElement>("input[type='file']")?.click()}
        />
      ) : (
        <HanaCard emphasis="default" eyebrow="업로드된 원천 데이터" title="원천 데이터 목록">
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>파일</th>
                  <th>유형</th>
                  <th>상태</th>
                  <th>미리보기</th>
                  <th>다음</th>
                  <th>크기</th>
                  <th>업로드</th>
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
                      <StatusBadge token={source.status} tone={statusToTone(source.status)} />
                    </td>
                    <td>
                      <StatusBadge token={source.preview_status} tone={statusToTone(source.preview_status)} />
                    </td>
                    <td>
                      <SourceLink to={`/projects/${projectId}/sources/${source.id}`}>
                        <strong>{source.source_type === "CSV" || source.source_type === "EXCEL" ? "프로파일" : "구간"}</strong>
                      </SourceLink>
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
    padding: ${({ theme }) => theme.spacing.lg};
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    text-transform: uppercase;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const SourceLink = styled(Link)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};

  strong {
    color: ${({ theme }) => theme.color.primary};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

const UploadGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 2fr) 160px minmax(180px, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
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
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.danger};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;
