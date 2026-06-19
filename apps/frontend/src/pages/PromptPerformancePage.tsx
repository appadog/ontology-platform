import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Activity } from "lucide-react";
import { useEvaluationRuns, useProject, usePromptExperiments, usePromptPerformanceSummary } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, CompactTable, KeyValue, Mvp3ActionLink, Muted } from "./mvp3Shared";
import { Mvp4Panel, Mvp4TwoColumn, PageActions, StateBadge, pct } from "./mvp4Shared";

export function PromptPerformancePage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const performanceQuery = usePromptPerformanceSummary(projectId);
  const experimentsQuery = usePromptExperiments(projectId);
  const runsQuery = useEvaluationRuns(projectId);

  if (projectQuery.isLoading || performanceQuery.isLoading) {
    return <PageState kind="loading" title="Prompt performance is loading" description="Comparison rows and run status are being prepared." />;
  }

  if (projectQuery.isError || performanceQuery.isError || !projectQuery.data || !performanceQuery.data) {
    return <PageState kind="error" title="Prompt performance could not load" description="Retry from the selected project context." />;
  }

  const hasTelemetryUnavailable = performanceQuery.data.rows.some(
    (row) => row.latency_ms == null || row.token_count == null || row.cost == null,
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Prompt performance" },
        ]}
      />
      <PageHeader title="Prompt and Model Performance" description={`${projectQuery.data.name} · generated ${new Date(performanceQuery.data.generated_at).toLocaleString()}`}>
        <PageActions>
          <HanaBadge tone="success">COMPARISON</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/evaluation-datasets`}>Datasets</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      {performanceQuery.data.rows.length === 0 ? (
        <PageState kind="empty" title="No comparison rows" description="Set up datasets and evaluation runs before comparing prompts." />
      ) : (
        <HanaCard title="Comparison table" description="Rates are shown per row; missing telemetry is labeled unavailable.">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Approval</th>
                  <th>Rejected</th>
                  <th>Modified</th>
                  <th>Failed validation</th>
                  <th>Missing evidence</th>
                  <th>Telemetry</th>
                </tr>
              </thead>
              <tbody>
                {performanceQuery.data.rows.map((row) => (
                  <tr key={`${row.dimensions.prompt_version_id}-${row.dimensions.model_run_id}`}>
                    <td>
                      <DimensionCell>
                        <strong>{row.dimensions.prompt_version_id ?? "No prompt ref"}</strong>
                        <span>{row.dimensions.model_run_id ?? "No model run"}</span>
                      </DimensionCell>
                    </td>
                    <td>{pct(row.approval_rate)}</td>
                    <td>{pct(row.rejection_rate)}</td>
                    <td>{pct(row.modification_rate)}</td>
                    <td>{pct(row.failed_validation_rate)}</td>
                    <td>{pct(row.missing_evidence_rate)}</td>
                    <td>{row.latency_ms == null || row.token_count == null || row.cost == null ? "Telemetry unavailable" : `${row.latency_ms}ms · ${row.token_count} tokens`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>
      )}

      {hasTelemetryUnavailable ? (
        <Mvp4Panel>
          <strong>Telemetry unavailable</strong>
          <span>Latency, token, and cost fields are intentionally shown as unavailable when the actual API omits them.</span>
        </Mvp4Panel>
      ) : null}

      <Mvp4TwoColumn>
        <HanaCard title="Experiments">
          <CardBody>
            {(experimentsQuery.data ?? []).map((experiment) => (
              <Mvp4Panel key={experiment.id}>
                <ExperimentHeader>
                  <strong>{experiment.name}</strong>
                  <StateBadge state={experiment.status} />
                </ExperimentHeader>
                <span>{experiment.hypothesis ?? "No hypothesis recorded"}</span>
                <span>
                  {experiment.control_prompt_version_id} vs {experiment.treatment_prompt_version_id}
                </span>
              </Mvp4Panel>
            ))}
            {experimentsQuery.data?.length === 0 ? <Muted>No experiments yet.</Muted> : null}
          </CardBody>
        </HanaCard>
        <HanaCard title="Evaluation runs">
          <CardBody>
            {(runsQuery.data ?? []).map((run) => (
              <Mvp4Panel key={run.id}>
                <ExperimentHeader>
                  <StateWithIcon>
                    <Activity aria-hidden="true" size={16} />
                    <strong>{run.id}</strong>
                  </StateWithIcon>
                  <StateBadge state={run.status} />
                </ExperimentHeader>
                <KeyValue>
                  <dt>Dataset version</dt>
                  <dd>{run.dataset_version_id}</dd>
                  <dt>Model</dt>
                  <dd>{run.model_name ?? "Unavailable"}</dd>
                  <dt>Correction patterns</dt>
                  <dd>{Object.entries(run.metrics.correction_pattern_counts ?? {}).map(([key, value]) => `${key}: ${value}`).join(", ") || "Unavailable"}</dd>
                  <dt>Error</dt>
                  <dd>{run.error_code ? `${run.error_code}: ${run.error_message}` : "None"}</dd>
                </KeyValue>
              </Mvp4Panel>
            ))}
            {runsQuery.data?.length === 0 ? <Muted>No evaluation runs yet.</Muted> : null}
          </CardBody>
        </HanaCard>
      </Mvp4TwoColumn>
    </>
  );
}

const DimensionCell = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};

  span {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const ExperimentHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  justify-content: space-between;
`;

const StateWithIcon = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;
