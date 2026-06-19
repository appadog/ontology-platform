import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { DatabaseZap } from "lucide-react";
import styled from "styled-components";
import { useEvaluationDatasets, useEvaluationDatasetVersions, useGoldenItems, useProject } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, CompactTable, KeyValue, Mvp3ActionLink, Muted, Stack } from "./mvp3Shared";
import { Mvp4Grid, Mvp4Panel, PageActions, StateBadge } from "./mvp4Shared";

export function EvaluationDatasetsPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const datasetsQuery = useEvaluationDatasets(projectId);
  const activeDataset = useMemo(() => datasetsQuery.data?.find((dataset) => dataset.status === "ACTIVE") ?? datasetsQuery.data?.[0], [datasetsQuery.data]);
  const versionsQuery = useEvaluationDatasetVersions(activeDataset?.id ?? "");
  const activeVersion = useMemo(
    () => versionsQuery.data?.find((version) => version.id === activeDataset?.active_version_id) ?? versionsQuery.data?.[0],
    [activeDataset?.active_version_id, versionsQuery.data],
  );
  const goldenItemsQuery = useGoldenItems(activeVersion?.id ?? "");

  if (projectQuery.isLoading || datasetsQuery.isLoading) {
    return <PageState kind="loading" title="Evaluation datasets are loading" description="Dataset status and golden set summaries are being prepared." />;
  }

  if (projectQuery.isError || datasetsQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="Evaluation datasets could not load" description="Retry from the selected project context." />;
  }

  const datasets = datasetsQuery.data ?? [];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Evaluation datasets" },
        ]}
      />
      <PageHeader title="Evaluation Datasets" description={`${projectQuery.data.name} · golden sets and provenance`}>
        <PageActions>
          <HanaBadge tone="neutral">GOLDEN SETS</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/prompt-performance`}>Prompt performance</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      {datasets.length === 0 ? (
        <PageState kind="empty" title="No evaluation datasets" description="Create a draft dataset before running prompt comparisons." />
      ) : (
        <Mvp4Grid>
          {datasets.map((dataset) => (
            <HanaCard key={dataset.id} title={dataset.name} description={dataset.description ?? "No description"}>
              <CardBody>
                <StatusRow>
                  <StateBadge state={dataset.status} />
                  <span>{dataset.owner_id ?? "Unassigned owner"}</span>
                </StatusRow>
                <Muted>{dataset.notes ?? "No notes"}</Muted>
                <Mvp4Panel>
                  <strong>{editabilityLabel(dataset.status)}</strong>
                  <span>{dataset.status === "DRAFT" ? "Metadata and golden items may be edited." : "Changes should use a new version or remain read-only."}</span>
                </Mvp4Panel>
                {dataset.active_version_id ? <Link to={`/projects/${projectId}/evaluation-dataset-versions/${dataset.active_version_id}`}>Open active version context</Link> : null}
              </CardBody>
            </HanaCard>
          ))}
        </Mvp4Grid>
      )}

      <DetailGrid>
        <HanaCard title="Selected dataset version" description={activeDataset?.name ?? "No active dataset"}>
          <CardBody>
            {versionsQuery.isLoading ? (
              <Muted>Loading versions.</Muted>
            ) : activeVersion ? (
              <KeyValue>
                <dt>Version</dt>
                <dd>v{activeVersion.version}</dd>
                <dt>Status</dt>
                <dd>
                  <StateBadge state={activeVersion.status} />
                </dd>
                <dt>Golden items</dt>
                <dd>{activeVersion.golden_item_count}</dd>
                <dt>Sources</dt>
                <dd>{activeVersion.source_refs?.map((ref) => ref.label ?? ref.source_id).join(", ") || "Missing"}</dd>
                <dt>Evidence</dt>
                <dd>{activeVersion.evidence_refs?.map((ref) => ref.locator).join(", ") || "Missing"}</dd>
              </KeyValue>
            ) : (
              <Muted>No version selected.</Muted>
            )}
          </CardBody>
        </HanaCard>
        <HanaCard title="Golden item kinds">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Payload</th>
                  <th>Provenance</th>
                </tr>
              </thead>
              <tbody>
                {(goldenItemsQuery.data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <StateWithIcon>
                        <DatabaseZap aria-hidden="true" size={16} />
                        {item.kind}
                      </StateWithIcon>
                    </td>
                    <td>{String(item.expected_payload.label ?? item.expected_payload.field ?? item.id)}</td>
                    <td>{item.evidence_refs?.length ? item.evidence_refs.map((ref) => ref.locator).join(", ") : "Missing provenance"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
          {goldenItemsQuery.data?.some((item) => !item.evidence_refs?.length) ? (
            <CardBody>
              <Mvp4Panel>
                <strong>Provenance missing</strong>
                <span>Golden items are expected to carry source and evidence references.</span>
              </Mvp4Panel>
            </CardBody>
          ) : null}
        </HanaCard>
      </DetailGrid>
    </>
  );
}

function editabilityLabel(status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  if (status === "DRAFT") {
    return "Editable draft";
  }
  if (status === "ACTIVE") {
    return "Controlled active set";
  }
  return "Archived read-only";
}

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  color: ${({ theme }) => theme.color.textMuted};
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.2fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const StateWithIcon = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;
