import { BarChart3, Play } from "lucide-react";
import { useParams } from "react-router-dom";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { useRunSourceProfile, useSource, useSourceProfile } from "../shared/api/queries";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";
import { formatPercent, InlineList, MutedText, PanelGrid, TableWrap } from "./mvp2Shared";

export function SourceProfilingPage() {
  const { sourceId = "" } = useParams();
  const { data: source, isLoading: isSourceLoading, isError: isSourceError, refetch: refetchSource } = useSource(sourceId);
  const { data: profile, isLoading, isError, refetch } = useSourceProfile(sourceId);
  const runProfile = useRunSourceProfile(sourceId);

  if (isSourceLoading || isLoading) {
    return <PageState kind="loading" title="Source profile을 불러오는 중" description="CSV/Excel column profile fixture 또는 API 응답을 준비하고 있습니다." />;
  }

  if (isSourceError || !source || isError || !profile) {
    return (
      <PageState
        kind="error"
        title="Source profile을 불러오지 못했습니다"
        description="MVP 2 profile endpoint 또는 deterministic fixture 상태를 확인하세요."
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
          { label: "Projects", to: "/projects" },
          { label: "Sources", to: `/projects/${source.project_id}/sources` },
          { label: source.file_name, to: `/projects/${source.project_id}/sources/${source.id}` },
          { label: "Profile" },
        ]}
      />
      <PageHeader title="Source Profiling" description="CSV/Excel source의 column type, null ratio, distinct count, sample values를 확인합니다.">
        <HanaBadge tone="muted">MVP2 THIN</HanaBadge>
        <HanaButton type="button" onClick={() => runProfile.mutate()} disabled={runProfile.isPending}>
          <Play aria-hidden="true" />
          {runProfile.isPending ? "Profiling" : "Run profile"}
        </HanaButton>
      </PageHeader>
      <PanelGrid>
        <MetricCard label="Rows" value={profile.row_count}>
          {source.file_name}
        </MetricCard>
        <MetricCard label="Sample Size" value={profile.sample_size}>
          Profile fixture scope
        </MetricCard>
        <MetricCard label="Columns" value={profile.columns.length}>
          Inferred by `ProfileInferredType`
        </MetricCard>
        <MetricCard label="Created" value={formatDateTime(profile.created_at)}>
          Last profile result
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
        <PageState kind="empty" title="Profile column이 없습니다" description="profile API가 column list를 반환하면 여기에 표시됩니다." />
      ) : (
        <HanaCard title="Column profile" description="Backend actual API mode 전환 지점: GET/POST /api/v1/sources/{source_id}/profile">
          <TableWrap>
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
          </TableWrap>
        </HanaCard>
      )}
    </>
  );
}
