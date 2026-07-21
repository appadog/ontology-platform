import { BarChart3, Play } from "lucide-react";
import { useParams } from "react-router-dom";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { useProject, useRunSourceProfile, useSource, useSourceProfile } from "../shared/api/queries";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";
import { formatPercent, InlineList, MutedText, PanelGrid } from "./mvp2Shared";
import { CompactTable } from "./mvp3Shared";

export function SourceProfilingPage() {
  const { sourceId = "" } = useParams();
  const { data: source, isLoading: isSourceLoading, isError: isSourceError, refetch: refetchSource } = useSource(sourceId);
  const projectQuery = useProject(source?.project_id ?? "");
  const projectName = projectQuery.data?.name ?? "프로젝트";
  const { data: profile, isLoading, isError, refetch } = useSourceProfile(sourceId);
  const runProfile = useRunSourceProfile(sourceId);

  if (isSourceLoading || isLoading) {
    return <PageState kind="loading" title="Source 컬럼 프로파일을 불러오는 중" description="컬럼 프로파일 결과를 준비하고 있습니다." />;
  }

  if (isSourceError || !source || isError || !profile) {
    return (
      <PageState
        kind="error"
        title="Source 컬럼 프로파일을 불러오지 못했습니다"
        description="Source 상세에서 파일 상태를 확인한 뒤 다시 시도하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void refetchSource();
          void refetch();
        }}
      />
    );
  }

  const warnings = profile.warnings ?? [];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectName, to: `/projects/${source.project_id}` },
          { label: "Sources", to: `/projects/${source.project_id}/sources` },
          { label: source.file_name, to: `/projects/${source.project_id}/sources/${source.id}` },
          { label: "컬럼 프로파일" },
        ]}
      />
      <PageHeader title="Source 컬럼 프로파일" description="CSV/Excel Source의 컬럼 타입, 결측 비율, 고유값 수, 샘플 값을 확인합니다.">
        <HanaBadge tone="muted">프로파일 준비 완료</HanaBadge>
        <HanaButton type="button" onClick={() => runProfile.mutate()} disabled={runProfile.isPending}>
          <Play aria-hidden="true" />
          {runProfile.isPending ? "실행 중" : "프로파일 실행"}
        </HanaButton>
      </PageHeader>
      <PanelGrid>
        <MetricCard label="Rows" value={profile.row_count}>
          {source.file_name}
        </MetricCard>
        <MetricCard label="Sample Size" value={profile.sample_size}>
          사용한 샘플 행
        </MetricCard>
        <MetricCard label="Columns" value={profile.columns.length}>
          추론된 프로파일 결과
        </MetricCard>
        <MetricCard label="Created" value={formatDateTime(profile.created_at)}>
          마지막 프로파일 결과
        </MetricCard>
      </PanelGrid>
      {warnings.length > 0 && (
        <HanaCard title="Warnings">
          <InlineList>
            {warnings.map((warning) => (
              <HanaBadge key={warning} tone="warning">
                {warning}
              </HanaBadge>
            ))}
          </InlineList>
        </HanaCard>
      )}
      {profile.columns.length === 0 ? (
        <PageState kind="empty" title="프로파일 컬럼이 없습니다" description="비어 있거나 컬럼이 없는 Source는 warning과 함께 빈 프로파일로 표시됩니다." />
      ) : (
        <HanaCard title="Column profile" description="컬럼 타입, null 비율, 샘플 값을 확인합니다.">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Inferred type</th>
                  <th>Nullable</th>
                  <th>Null ratio</th>
                  <th>Distinct sampled</th>
                  <th>Key score</th>
                  <th>Samples</th>
                </tr>
              </thead>
              <tbody>
                {profile.columns.map((column) => (
                  <tr key={column.name}>
                    <td>
                      <strong>{column.name}</strong>
                    </td>
                    <td>
                      <HanaBadge tone="neutral">{column.inferred_type}</HanaBadge>
                    </td>
                    <td>{column.nullable ? "Yes" : "No"}</td>
                    <td>{formatPercent(column.null_ratio)}</td>
                    <td>{column.distinct_count_sampled}</td>
                    <td>{formatPercent(column.candidate_key_score)}</td>
                    <td>
                      <MutedText>{column.sample_values.map((value) => String(value ?? "-")).join(", ")}</MutedText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>
      )}
    </>
  );
}
