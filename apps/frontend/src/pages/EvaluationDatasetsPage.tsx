import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Beaker,
  DatabaseZap,
  GitCompareArrows,
  ListChecks,
  Play,
  Plus,
  TableProperties,
} from "lucide-react";
import styled from "styled-components";
import {
  useCreateEvaluationDataset,
  useCreateEvaluationRun,
  useCreateEvaluationSample,
  useCreateGoldEntity,
  useCreateGoldRelation,
  useEvaluationDatasetVersions,
  useEvaluationDatasets,
  useEvaluationErrorCases,
  useEvaluationMetrics,
  useEvaluationRuns,
  useEvaluationSamples,
  useGoldEntities,
  useGoldenItems,
  useGoldRelations,
  useProject,
} from "../shared/api/queries";
import {
  EvaluationCandidateRef,
  EvaluationErrorCase,
  EvaluationMetric,
  EvaluationMetricName,
  EvaluationRun,
  EvaluationSample,
  GoldEntity,
  GoldEvidenceRef,
  GoldRelation,
} from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, CompactTable, KeyValue, Mvp3ActionLink, Muted, Stack } from "./mvp3Shared";
import { Mvp4Grid, Mvp4Panel, Mvp4TwoColumn, PageActions, StateBadge } from "./mvp4Shared";

const metricOrder: EvaluationMetricName[] = [
  "ENTITY_PRECISION",
  "ENTITY_RECALL",
  "ENTITY_F1",
  "RELATION_PRECISION",
  "RELATION_RECALL",
  "RELATION_F1",
  "RELATION_DIRECTION_ACCURACY",
  "EVIDENCE_MATCH_RATE",
];

export function EvaluationDatasetsPage() {
  const { projectId = "", datasetId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const datasetsQuery = useEvaluationDatasets(projectId);
  const datasets = datasetsQuery.data ?? [];
  const activeDataset = useMemo(
    () =>
      datasets.find((dataset) => dataset.id === datasetId) ??
      datasets.find((dataset) => dataset.status === "ACTIVE") ??
      datasets[0],
    [datasetId, datasets],
  );

  const samplesQuery = useEvaluationSamples(activeDataset?.id ?? "");
  const goldEntitiesQuery = useGoldEntities(activeDataset?.id ?? "");
  const goldRelationsQuery = useGoldRelations(activeDataset?.id ?? "");
  const runsQuery = useEvaluationRuns(projectId);
  const activeRun = useMemo(
    () =>
      (runsQuery.data ?? []).find((run) => run.dataset_id === activeDataset?.id && run.status === "SUCCEEDED") ??
      (runsQuery.data ?? []).find((run) => run.dataset_id === activeDataset?.id) ??
      (runsQuery.data ?? [])[0],
    [activeDataset?.id, runsQuery.data],
  );
  const metricsQuery = useEvaluationMetrics(activeRun?.id ?? "");
  const errorsQuery = useEvaluationErrorCases(activeRun?.id ?? "");
  const versionsQuery = useEvaluationDatasetVersions(activeDataset?.id ?? "");
  const activeVersion = useMemo(
    () => versionsQuery.data?.find((version) => version.id === activeDataset?.active_version_id) ?? versionsQuery.data?.[0],
    [activeDataset?.active_version_id, versionsQuery.data],
  );
  const goldenItemsQuery = useGoldenItems(activeVersion?.id ?? "");

  const createDataset = useCreateEvaluationDataset(projectId);
  const createSample = useCreateEvaluationSample(activeDataset?.id ?? "", projectId);
  const createGoldEntity = useCreateGoldEntity(activeDataset?.id ?? "", projectId);
  const createGoldRelation = useCreateGoldRelation(activeDataset?.id ?? "", projectId);
  const createRun = useCreateEvaluationRun(projectId);

  if (projectQuery.isLoading || datasetsQuery.isLoading) {
    return <PageState kind="loading" title="Evaluation datasets are loading" description="Gold set and benchmark state are being prepared." />;
  }

  if (projectQuery.isError || datasetsQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="Evaluation datasets could not load" description="Retry from the selected project context." />;
  }

  const samples = samplesQuery.data ?? [];
  const goldEntities = goldEntitiesQuery.data ?? [];
  const goldRelations = goldRelationsQuery.data ?? [];
  const metrics = [...(metricsQuery.data ?? [])].sort((a, b) => metricOrder.indexOf(a.metric_name) - metricOrder.indexOf(b.metric_name));
  const errorCases = errorsQuery.data ?? [];
  const firstSample = samples[0];
  const firstEntity = goldEntities[0];
  const secondEntity = goldEntities[1];
  const firstRelation = goldRelations[0];

  const handleCreateDataset = () => {
    createDataset.mutate({
      name: "MVP6.1 working gold set",
      description: "Draft deterministic benchmark dataset for evaluation samples.",
    });
  };

  const handleCreateSample = () => {
    if (!activeDataset) {
      return;
    }

    createSample.mutate({
      sample_kind: "MANUAL_TEXT",
      title: "Manual deterministic ownership sample",
      content_text: "The Customer Data Policy is owned by the Privacy Office.",
      source_locator: "manual://mvp6.1/customer-data-policy",
      metadata: { fixture: "created-from-ui", domain: "privacy" },
    });
  };

  const handleCreateGoldEntity = () => {
    if (!activeDataset || !firstSample) {
      return;
    }

    const evidence = evidenceFromSample(firstSample, "Customer Data Policy");
    createGoldEntity.mutate({
      sample_id: firstSample.id,
      ontology_class_id: "class-policy",
      label: "Customer Data Policy",
      normalized_value: "customer data policy",
      evidence,
    });
  };

  const handleCreateGoldRelation = () => {
    if (!activeDataset || !firstSample || !firstEntity || !secondEntity) {
      return;
    }

    createGoldRelation.mutate({
      sample_id: firstSample.id,
      ontology_relation_id: "relation-owned-by",
      source_gold_entity_id: firstEntity.id,
      target_gold_entity_id: secondEntity.id,
      evidence: evidenceFromSample(firstSample, firstSample.content_text ?? firstSample.title),
    });
  };

  const handleRunEvaluation = () => {
    if (!activeDataset) {
      return;
    }

    createRun.mutate({
      dataset_id: activeDataset.id,
      run_mode: "DETERMINISTIC_MOCK",
      ontology_version_id: "onto-v6-eval",
      prompt_version_id: "prompt-v6-eval",
      model_name: "deterministic-mock",
      parser_version: "parser-v6.1",
    });
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Evaluation datasets" },
        ]}
      />
      <PageHeader title="Evaluation Datasets" description={`${projectQuery.data.name} · Gold Set / Benchmark Studio`}>
        <PageActions>
          <HanaBadge tone="success">MVP6.1</HanaBadge>
          <HanaBadge tone="neutral">DETERMINISTIC_MOCK</HanaBadge>
          <Mvp3ActionLink to={`/projects/${projectId}/prompt-performance`}>Prompt performance</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      <WorkflowBand aria-label="MVP6.1 evaluation workflow">
        {["Dataset", "Sample", "Gold entity", "Gold relation", "Deterministic run", "Metrics", "Error cases"].map((step, index) => (
          <WorkflowStep key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </WorkflowStep>
        ))}
      </WorkflowBand>

      {datasets.length === 0 ? (
        <PageState kind="empty" title="No evaluation datasets" description="Create a draft gold set before adding samples and benchmark runs." actionLabel="Create dataset" onAction={handleCreateDataset} />
      ) : (
        <Mvp4Grid>
          {datasets.map((dataset) => (
            <HanaCard key={dataset.id} title={dataset.name} description={dataset.description ?? "No description"}>
              <CardBody>
                <StatusRow>
                  <StateBadge state={dataset.status} />
                  <span>{dataset.owner_id ?? "Unassigned owner"}</span>
                </StatusRow>
                <CountRow>
                  <CountPill>
                    <strong>{dataset.sample_count ?? 0}</strong>
                    <span>samples</span>
                  </CountPill>
                  <CountPill>
                    <strong>{dataset.gold_entity_count ?? 0}</strong>
                    <span>entities</span>
                  </CountPill>
                  <CountPill>
                    <strong>{dataset.gold_relation_count ?? 0}</strong>
                    <span>relations</span>
                  </CountPill>
                </CountRow>
                <Muted>{dataset.notes ?? "Evaluation dataset metadata only."}</Muted>
                <Link to={`/projects/${projectId}/evaluation-datasets/${dataset.id}`}>Open dataset context</Link>
              </CardBody>
            </HanaCard>
          ))}
        </Mvp4Grid>
      )}

      <ActionRail>
        <HanaButton type="button" onClick={handleCreateDataset} disabled={createDataset.isPending}>
          <Plus aria-hidden="true" size={16} />
          Dataset
        </HanaButton>
        <HanaButton type="button" onClick={handleCreateSample} disabled={!activeDataset || createSample.isPending}>
          <TableProperties aria-hidden="true" size={16} />
          Sample
        </HanaButton>
        <HanaButton type="button" onClick={handleCreateGoldEntity} disabled={!activeDataset || !firstSample || createGoldEntity.isPending}>
          <DatabaseZap aria-hidden="true" size={16} />
          Gold entity
        </HanaButton>
        <HanaButton
          type="button"
          onClick={handleCreateGoldRelation}
          disabled={!activeDataset || !firstSample || !firstEntity || !secondEntity || createGoldRelation.isPending}
        >
          <GitCompareArrows aria-hidden="true" size={16} />
          Gold relation
        </HanaButton>
        <HanaButton type="button" variant="primary" onClick={handleRunEvaluation} disabled={!activeDataset || createRun.isPending}>
          <Play aria-hidden="true" size={16} />
          Run
        </HanaButton>
      </ActionRail>

      <Mvp4TwoColumn>
        <GoldSetPanel
          activeDatasetName={activeDataset?.name}
          samples={samples}
          goldEntities={goldEntities}
          goldRelations={goldRelations}
          firstRelation={firstRelation}
          isLoading={samplesQuery.isLoading || goldEntitiesQuery.isLoading || goldRelationsQuery.isLoading}
          isError={samplesQuery.isError || goldEntitiesQuery.isError || goldRelationsQuery.isError}
        />
        <RunContextPanel run={activeRun} isLoading={runsQuery.isLoading} isError={runsQuery.isError} />
      </Mvp4TwoColumn>

      <MetricsSection metrics={metrics} isLoading={metricsQuery.isLoading} isError={metricsQuery.isError} />
      <ErrorCaseExplorer errorCases={errorCases} samples={samples} isLoading={errorsQuery.isLoading} isError={errorsQuery.isError} />

      <LegacyGoldenItems
        activeDatasetName={activeDataset?.name}
        activeVersionLabel={activeVersion ? `v${activeVersion.version}` : "No version selected"}
        goldenItems={goldenItemsQuery.data ?? []}
        isLoading={versionsQuery.isLoading || goldenItemsQuery.isLoading}
      />
    </>
  );
}

function GoldSetPanel({
  activeDatasetName,
  samples,
  goldEntities,
  goldRelations,
  firstRelation,
  isLoading,
  isError,
}: {
  activeDatasetName?: string;
  samples: EvaluationSample[];
  goldEntities: GoldEntity[];
  goldRelations: GoldRelation[];
  firstRelation?: GoldRelation;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <PageState kind="loading" title="Gold set is loading" description="Samples and gold annotations are being prepared." />;
  }

  if (isError) {
    return <PageState kind="error" title="Gold set could not load" description="Retry from the dataset context." />;
  }

  if (samples.length === 0 && goldEntities.length === 0 && goldRelations.length === 0) {
    return <PageState kind="empty" title="No gold set rows" description="Add a sample before gold entities and relations." />;
  }

  return (
    <HanaCard title="Gold Set Manager" description={activeDatasetName ?? "No selected dataset"}>
      <CardBody>
        <SectionLabel>
          <TableProperties aria-hidden="true" size={16} />
          Samples
        </SectionLabel>
        {samples.map((sample) => (
          <Mvp4Panel key={sample.id}>
            <PanelHeader>
              <strong>{sample.title}</strong>
              <StateBadge state={sample.sample_kind === "SOURCE_SEGMENT" ? "ACTIVE" : "DRAFT"} />
            </PanelHeader>
            <span>{sample.source_locator ?? sample.source_segment_id ?? "Manual sample"}</span>
            <p>{sample.content_text ?? "No text body"}</p>
          </Mvp4Panel>
        ))}

        <SectionLabel>
          <DatabaseZap aria-hidden="true" size={16} />
          Gold entities
        </SectionLabel>
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Class</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {goldEntities.map((entity) => (
                <tr key={entity.id}>
                  <td>{entity.label}</td>
                  <td>{entity.ontology_class_id}</td>
                  <td>{evidenceLabel(entity.evidence)}</td>
                </tr>
              ))}
              {goldEntities.length === 0 ? (
                <tr>
                  <td colSpan={3}>No gold entities.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CompactTable>

        <SectionLabel>
          <GitCompareArrows aria-hidden="true" size={16} />
          Gold relations
        </SectionLabel>
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>Relation</th>
                <th>Direction</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {goldRelations.map((relation) => (
                <tr key={relation.id}>
                  <td>{relation.ontology_relation_id}</td>
                  <td>
                    {entityLabel(goldEntities, relation.source_gold_entity_id)} -&gt; {entityLabel(goldEntities, relation.target_gold_entity_id)}
                  </td>
                  <td>{evidenceLabel(relation.evidence)}</td>
                </tr>
              ))}
              {goldRelations.length === 0 ? (
                <tr>
                  <td colSpan={3}>No gold relations.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CompactTable>

        {firstRelation ? (
          <Mvp4Panel>
            <strong>Direction baseline</strong>
            <span>
              {entityLabel(goldEntities, firstRelation.source_gold_entity_id)} -&gt; {entityLabel(goldEntities, firstRelation.target_gold_entity_id)}
            </span>
          </Mvp4Panel>
        ) : null}
      </CardBody>
    </HanaCard>
  );
}

function RunContextPanel({ run, isLoading, isError }: { run?: EvaluationRun; isLoading: boolean; isError: boolean }) {
  if (isLoading) {
    return <PageState kind="loading" title="Evaluation runs are loading" description="Run context is being prepared." />;
  }

  if (isError) {
    return <PageState kind="error" title="Evaluation runs could not load" description="Retry from the project context." />;
  }

  if (!run) {
    return <PageState kind="empty" title="No deterministic runs" description="Run the benchmark after the gold set has a sample and annotations." />;
  }

  return (
    <HanaCard title="Deterministic Run" description={run.id}>
      <CardBody>
        <PanelHeader>
          <StateWithIcon>
            <Activity aria-hidden="true" size={16} />
            <strong>{run.run_mode ?? "DETERMINISTIC_MOCK"}</strong>
          </StateWithIcon>
          <EvaluationStatusBadge status={run.status} />
        </PanelHeader>
        <KeyValue>
          <dt>Dataset</dt>
          <dd>{run.dataset_id ?? run.dataset_version_id ?? "Unavailable"}</dd>
          <dt>Ontology version</dt>
          <dd>{run.ontology_version_id ?? "Unavailable"}</dd>
          <dt>Prompt version</dt>
          <dd>{run.prompt_version_id ?? "Unavailable"}</dd>
          <dt>Model</dt>
          <dd>{run.model_name ?? "Unavailable"}</dd>
          <dt>Model run</dt>
          <dd>{run.model_run_id ?? "Unavailable"}</dd>
          <dt>Parser</dt>
          <dd>{run.parser_version ?? "Unavailable"}</dd>
        </KeyValue>
      </CardBody>
    </HanaCard>
  );
}

function MetricsSection({ metrics, isLoading, isError }: { metrics: EvaluationMetric[]; isLoading: boolean; isError: boolean }) {
  if (isLoading) {
    return <PageState kind="loading" title="Metrics are loading" description="Benchmark formulas and counts are being prepared." />;
  }

  if (isError) {
    return <PageState kind="error" title="Metrics could not load" description="Retry from the evaluation run context." />;
  }

  if (metrics.length === 0) {
    return <PageState kind="empty" title="No metrics yet" description="Run a deterministic benchmark to compute metric cards." />;
  }

  return (
    <Stack>
      <SectionTitle>
        <Beaker aria-hidden="true" size={18} />
        <h2>Benchmark metrics</h2>
      </SectionTitle>
      <MetricGrid>
        {metrics.map((metric) => (
          <MetricCard key={metric.metric_name} label={metricLabel(metric.metric_name)} value={metricValue(metric)}>
            {metric.status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : `${metric.numerator}/${metric.denominator}`} · {metric.formula}
          </MetricCard>
        ))}
      </MetricGrid>
      <HanaCard title="Metric formulas" description="Counts and formulas from the deterministic run">
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Status</th>
                <th>Value</th>
                <th>Numerator</th>
                <th>Denominator</th>
                <th>Formula</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.metric_name}>
                  <td>{metric.metric_name}</td>
                  <td>
                    <EvaluationStatusBadge status={metric.status} />
                  </td>
                  <td>{metricValue(metric)}</td>
                  <td>{metric.numerator}</td>
                  <td>{metric.denominator}</td>
                  <td>{metric.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CompactTable>
      </HanaCard>
    </Stack>
  );
}

function ErrorCaseExplorer({
  errorCases,
  samples,
  isLoading,
  isError,
}: {
  errorCases: EvaluationErrorCase[];
  samples: EvaluationSample[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <PageState kind="loading" title="Error cases are loading" description="Candidate and gold comparison rows are being prepared." />;
  }

  if (isError) {
    return <PageState kind="error" title="Error cases could not load" description="Retry from the evaluation run context." />;
  }

  if (errorCases.length === 0) {
    return <PageState kind="empty" title="No error cases" description="The selected deterministic run has no comparison errors." />;
  }

  return (
    <HanaCard title="Error Case Explorer" description="Candidate vs gold comparison context">
      <CompactTable>
        <table>
          <thead>
            <tr>
              <th>Error type</th>
              <th>Sample</th>
              <th>Comparison</th>
              <th>Gold evidence</th>
              <th>Candidate evidence</th>
              <th>Candidate context</th>
            </tr>
          </thead>
          <tbody>
            {errorCases.map((errorCase) => (
              <tr key={errorCase.id}>
                <td>
                  <ErrorType>
                    <AlertTriangle aria-hidden="true" size={15} />
                    {errorCase.error_type}
                  </ErrorType>
                </td>
                <td>{sampleLabel(samples, errorCase.sample_id)}</td>
                <td>{errorCase.comparison_summary}</td>
                <td>{evidenceLabel(errorCase.gold_evidence, "Gold evidence unavailable")}</td>
                <td>{evidenceLabel(errorCase.candidate_evidence, "Candidate evidence unavailable")}</td>
                <td>
                  <CandidateContext candidate={errorCase.candidate_ref} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CompactTable>
    </HanaCard>
  );
}

function LegacyGoldenItems({
  activeDatasetName,
  activeVersionLabel,
  goldenItems,
  isLoading,
}: {
  activeDatasetName?: string;
  activeVersionLabel: string;
  goldenItems: Array<{
    id: string;
    kind: string;
    expected_payload: Record<string, unknown>;
    evidence_refs?: Array<{ locator?: string | null }>;
  }>;
  isLoading: boolean;
}) {
  return (
    <DetailGrid>
      <HanaCard title="Selected dataset version" description={activeDatasetName ?? "No active dataset"}>
        <CardBody>
          <KeyValue>
            <dt>Version</dt>
            <dd>{activeVersionLabel}</dd>
            <dt>Boundary</dt>
            <dd>Evaluation artifacts only</dd>
          </KeyValue>
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
              {isLoading ? (
                <tr>
                  <td colSpan={3}>Loading golden item kinds.</td>
                </tr>
              ) : goldenItems.length > 0 ? (
                goldenItems.map((item) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No legacy item kinds for this dataset.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CompactTable>
      </HanaCard>
    </DetailGrid>
  );
}

function evidenceFromSample(sample: EvaluationSample, quote: string): GoldEvidenceRef {
  return {
    sample_id: sample.id,
    source_id: sample.source_id ?? null,
    source_segment_id: sample.source_segment_id ?? null,
    locator: sample.source_locator ?? null,
    offset_start: 0,
    offset_end: quote.length,
    quote,
  };
}

function metricLabel(metricName: EvaluationMetricName) {
  return metricName
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function metricValue(metric: EvaluationMetric) {
  if (metric.status === "NOT_APPLICABLE" || metric.value === null) {
    return "N/A";
  }

  return `${Math.round(metric.value * 100)}%`;
}

function evidenceLabel(evidence?: GoldEvidenceRef | null, fallback = "Evidence unavailable") {
  if (!evidence) {
    return fallback;
  }

  return [evidence.locator, evidence.quote].filter(Boolean).join(" · ") || "Evidence ref";
}

function entityLabel(entities: GoldEntity[], entityId: string) {
  return entities.find((entity) => entity.id === entityId)?.label ?? entityId;
}

function sampleLabel(samples: EvaluationSample[], sampleId: string) {
  return samples.find((sample) => sample.id === sampleId)?.title ?? sampleId;
}

function CandidateContext({ candidate }: { candidate?: EvaluationCandidateRef | null }) {
  if (!candidate) {
    return <CandidateContextList data-testid="mvp6-candidate-context">No candidate ref</CandidateContextList>;
  }

  return (
    <CandidateContextList data-testid="mvp6-candidate-context">
      <strong>
        {candidate.candidate_kind}:{candidate.candidate_id}
      </strong>
      <span>Sample {candidate.sample_id}</span>
      {candidate.candidate_kind === "ENTITY" ? (
        <>
          <span>Class {candidate.ontology_class_id ?? "Unavailable"}</span>
          <span>Label {candidate.label ?? candidate.normalized_value ?? "Unavailable"}</span>
          <span>Value {candidate.normalized_value ?? "Unavailable"}</span>
        </>
      ) : (
        <>
          <span>Relation {candidate.ontology_relation_id ?? "Unavailable"}</span>
          <span>Source {candidate.source_gold_entity_id ?? "Unavailable"}</span>
          <span>Target {candidate.target_gold_entity_id ?? "Unavailable"}</span>
        </>
      )}
      <span>{evidenceLabel(candidate.evidence, "Candidate ref evidence unavailable")}</span>
    </CandidateContextList>
  );
}

function EvaluationStatusBadge({ status }: { status: EvaluationRun["status"] | EvaluationMetric["status"] }) {
  if (status === "SUCCEEDED" || status === "SUCCESS" || status === "MEASURED") {
    return <HanaBadge tone="success">{status}</HanaBadge>;
  }

  if (status === "RUNNING" || status === "PENDING") {
    return <HanaBadge tone="warning">{status}</HanaBadge>;
  }

  if (status === "FAILED") {
    return <HanaBadge tone="danger">{status}</HanaBadge>;
  }

  return <HanaBadge tone="neutral">{status}</HanaBadge>;
}

const WorkflowBand = styled.nav`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1080px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const WorkflowStep = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  span {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    background: ${({ theme }) => theme.color.primarySoft};
    color: ${({ theme }) => theme.color.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    overflow-wrap: anywhere;
  }
`;

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  color: ${({ theme }) => theme.color.textMuted};
`;

const CountRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CountPill = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

const ActionRail = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin: ${({ theme }) => theme.spacing.lg} 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  button {
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

const SectionLabel = styled.h3`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
`;

const PanelHeader = styled.div`
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

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
`;

const ErrorType = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  color: ${({ theme }) => theme.color.danger};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const CandidateContextList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 220px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  strong {
    color: ${({ theme }) => theme.color.text};
    overflow-wrap: anywhere;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    overflow-wrap: anywhere;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.2fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;
