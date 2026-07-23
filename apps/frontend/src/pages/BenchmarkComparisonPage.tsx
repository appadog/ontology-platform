import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  GitCompareArrows,
  Grid3x3,
  Info,
  Layers,
  Minus,
  ShieldCheck,
} from "lucide-react";
import styled from "styled-components";
import {
  useBenchmarkCellErrorCases,
  useBenchmarkComparison,
  useBenchmarkComparisons,
  useBenchmarkConfusionMatrix,
  useCreateBenchmarkComparison,
  useEvaluationRuns,
  useProject,
} from "../shared/api/queries";
import {
  BenchmarkComparison,
  BenchmarkComparisonGroupBy,
  BenchmarkMetricCell,
  BenchmarkMetricRow,
  ComparisonComparabilityFlag,
  ConfusionMatrix,
  ConfusionMatrixAxis,
  ConfusionMatrixCell,
  CONFUSION_NONE_LABEL,
  EvaluationErrorCase,
  EvaluationMetricName,
  EvaluationRun,
  GoldEvidenceRef,
} from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaSelect } from "../shared/ui/hana";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, CompactTable, KeyValue, Muted, Stack } from "./mvp3Shared";
import { Mvp4Grid, Mvp4Panel, PageActions } from "./mvp4Shared";

const GROUP_BY_OPTIONS: BenchmarkComparisonGroupBy[] = [
  "MODEL",
  "PROMPT_VERSION",
  "ONTOLOGY_VERSION",
  "DATASET_VERSION",
  "PARSER_VERSION",
];

const AXIS_OPTIONS: ConfusionMatrixAxis[] = ["ENTITY_CLASS", "RELATION_TYPE"];

function isTerminalSuccess(run: EvaluationRun): boolean {
  return run.status === "SUCCEEDED" || run.status === "SUCCESS";
}

export function BenchmarkComparisonPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const projectQuery = useProject(projectId);
  const runsQuery = useEvaluationRuns(projectId);
  const listQuery = useBenchmarkComparisons(projectId);
  const createComparison = useCreateBenchmarkComparison(projectId);

  const runs = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);
  const eligibleRuns = useMemo(() => runs.filter(isTerminalSuccess), [runs]);

  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<BenchmarkComparisonGroupBy>("MODEL");
  const [baselineRunId, setBaselineRunId] = useState<string>("");
  const [activeComparisonId, setActiveComparisonId] = useState<string | null>(null);

  // Default-select the first 2 eligible runs once they load.
  useEffect(() => {
    if (selectedRunIds.length === 0 && eligibleRuns.length >= 2) {
      const first = eligibleRuns.slice(0, 2).map((run) => run.id);
      setSelectedRunIds(first);
      setBaselineRunId(first[0]);
    }
  }, [eligibleRuns, selectedRunIds.length]);

  function toggleRun(runId: string) {
    setSelectedRunIds((current) => {
      const next = current.includes(runId) ? current.filter((id) => id !== runId) : [...current, runId];
      if (!next.includes(baselineRunId)) {
        setBaselineRunId(next[0] ?? "");
      }
      return next;
    });
  }

  function handleBuild() {
    if (selectedRunIds.length < 2) {
      return;
    }
    createComparison.mutate(
      {
        run_ids: selectedRunIds,
        group_by: groupBy,
        baseline_run_id: baselineRunId || selectedRunIds[0],
      },
      {
        onSuccess: (comparison) => setActiveComparisonId(comparison.id),
      },
    );
  }

  if (projectQuery.isLoading || runsQuery.isLoading) {
    return <PageState kind="loading" title="Benchmark comparison is loading" description="Evaluation runs and prior comparisons are being prepared." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="Benchmark comparison could not load" description="Retry from the selected project context." />;
  }

  const projectName = projectQuery.data.name;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectName, to: `/projects/${projectId}` },
          { label: "Benchmark" },
        ]}
      />
      <PageHeader title="벤치마크 비교" description={`${projectName} · Compare evaluation runs side by side`}>
        <PageActions>
          <HanaBadge tone="success">MVP6.3</HanaBadge>
          <HanaBadge tone="neutral">Read-only analysis</HanaBadge>
        </PageActions>
      </PageHeader>

      <SafetyNote>
        <ShieldCheck aria-hidden="true" size={16} />
        <span>
          Read-only aggregation over existing evaluation runs, metrics, and error cases. No run is executed, no gold set is
          authored, and no candidate or published graph is changed. Deltas are descriptive analysis only.
        </span>
      </SafetyNote>

      {runsQuery.isError ? (
        <PageState kind="error" title="Evaluation runs could not load" description="Retry from the project context." />
      ) : eligibleRuns.length === 0 ? (
        <PageState
          kind="empty"
          title="아직 평가 실행이 없습니다"
          description="비교하려면 먼저 평가 데이터셋 흐름에서 결정적 평가 실행을 만들어야 합니다."
          actionLabel="평가 데이터셋으로 이동"
          onAction={() => navigate(`/projects/${projectId}/evaluation-datasets`)}
        />
      ) : eligibleRuns.length < 2 ? (
        <PageState
          kind="empty"
          title="성공한 실행이 2개 이상 필요합니다"
          description="벤치마크 비교에는 같은 프로젝트에서 정상 종료된 평가 실행이 둘 이상 있어야 합니다. 비교할 결정적 실행을 하나 더 추가하세요."
          actionLabel="평가 데이터셋으로 이동"
          onAction={() => navigate(`/projects/${projectId}/evaluation-datasets`)}
        />
      ) : (
        <RunBuilder
          eligibleRuns={eligibleRuns}
          allRuns={runs}
          selectedRunIds={selectedRunIds}
          baselineRunId={baselineRunId}
          groupBy={groupBy}
          onToggleRun={toggleRun}
          onBaselineChange={setBaselineRunId}
          onGroupByChange={setGroupBy}
          onBuild={handleBuild}
          isBuilding={createComparison.isPending}
          buildError={createComparison.isError}
        />
      )}

      <PriorComparisons
        items={listQuery.data?.items ?? []}
        activeComparisonId={activeComparisonId}
        onSelect={setActiveComparisonId}
      />

      {activeComparisonId ? <ComparisonDetail comparisonId={activeComparisonId} /> : null}
    </>
  );
}

function RunBuilder({
  eligibleRuns,
  allRuns,
  selectedRunIds,
  baselineRunId,
  groupBy,
  onToggleRun,
  onBaselineChange,
  onGroupByChange,
  onBuild,
  isBuilding,
  buildError,
}: {
  eligibleRuns: EvaluationRun[];
  allRuns: EvaluationRun[];
  selectedRunIds: string[];
  baselineRunId: string;
  groupBy: BenchmarkComparisonGroupBy;
  onToggleRun: (runId: string) => void;
  onBaselineChange: (runId: string) => void;
  onGroupByChange: (groupBy: BenchmarkComparisonGroupBy) => void;
  onBuild: () => void;
  isBuilding: boolean;
  buildError: boolean;
}) {
  const ineligibleRuns = allRuns.filter((run) => !eligibleRuns.some((eligible) => eligible.id === run.id));

  return (
    <HanaCard
      eyebrow="비교 준비"
      title="비교할 실행 선택"
      description="정상 종료된 실행 2개 이상을 고르고 기준 실행을 정한 뒤, 읽기 전용 비교를 실행하세요."
    >
      <CardBody>
        <RunList>
          {eligibleRuns.map((run) => {
            const selected = selectedRunIds.includes(run.id);
            return (
              <RunRow key={run.id} data-selected={selected}>
                <label>
                  <input type="checkbox" checked={selected} onChange={() => onToggleRun(run.id)} aria-label={`Select run ${run.id}`} />
                  <RunMeta>
                    <strong>{run.model_name ?? run.id}</strong>
                    <span>{run.id}</span>
                    <RunChips>
                      <StatusBadge token={run.status} tone="success" />
                      <HanaBadge tone="neutral">{run.model_provider ?? "provider n/a"}</HanaBadge>
                      <span>{run.prompt_version_id ?? "prompt n/a"}</span>
                      <span>{run.ontology_version_id ?? "ontology n/a"}</span>
                      <span>
                        {run.dataset_id ?? "dataset n/a"} · {run.dataset_version_id ?? "version n/a"}
                      </span>
                    </RunChips>
                  </RunMeta>
                </label>
              </RunRow>
            );
          })}
          {ineligibleRuns.map((run) => (
            <RunRow key={run.id} data-disabled="true">
              <label>
                <input type="checkbox" disabled aria-label={`Run ${run.id} is not eligible`} />
                <RunMeta>
                  <strong>{run.model_name ?? run.id}</strong>
                  <span>{run.id}</span>
                  <RunChips>
                    <StatusBadge token={run.status} tone="danger" />
                    <span>Not eligible — only terminal-success runs can be compared</span>
                  </RunChips>
                </RunMeta>
              </label>
            </RunRow>
          ))}
        </RunList>

        <BuilderControls>
          <ControlField>
            <label htmlFor="benchmark-group-by">Group by</label>
            <HanaSelect
              id="benchmark-group-by"
              value={groupBy}
              onChange={(event) => onGroupByChange(event.target.value as BenchmarkComparisonGroupBy)}
            >
              {GROUP_BY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </HanaSelect>
          </ControlField>
          <ControlField>
            <label htmlFor="benchmark-baseline">Baseline run</label>
            <HanaSelect
              id="benchmark-baseline"
              value={baselineRunId}
              onChange={(event) => onBaselineChange(event.target.value)}
            >
              {selectedRunIds.map((runId) => (
                <option key={runId} value={runId}>
                  {runId}
                </option>
              ))}
            </HanaSelect>
          </ControlField>
          <HanaButton type="button" variant="primary" onClick={onBuild} disabled={selectedRunIds.length < 2 || isBuilding}>
            <GitCompareArrows aria-hidden="true" size={16} />
            {isBuilding ? "비교 실행 중" : "비교 실행"}
          </HanaButton>
        </BuilderControls>

        {selectedRunIds.length < 2 ? (
          <Muted>비교를 실행하려면 실행을 2개 이상 선택하세요.</Muted>
        ) : null}
        {buildError ? <Muted>비교를 실행하지 못했습니다. 선택한 실행을 조정한 뒤 다시 시도하세요.</Muted> : null}
      </CardBody>
    </HanaCard>
  );
}

function PriorComparisons({
  items,
  activeComparisonId,
  onSelect,
}: {
  items: Array<{ id: string; group_by: string; baseline_run_id: string; run_count: number; comparability_flags: ComparisonComparabilityFlag[]; generated_at: string }>;
  activeComparisonId: string | null;
  onSelect: (comparisonId: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Stack>
      <SectionTitle>
        <Layers aria-hidden="true" size={18} />
        <h2>Comparisons</h2>
      </SectionTitle>
      <Mvp4Grid>
        {items.map((item) => (
          // Wave 65 (PM6-042 follow-up): whole-card click (hover lift +
          // keyboard), matching the treatment already applied to the
          // Ontology Packs / Connectors catalog cards. The nested button
          // keeps its own independent onClick (stopping propagation so it
          // doesn't double-fire the same select through the card handler).
          <HanaCard
            key={item.id}
            title={item.id}
            description={`${item.run_count} runs · grouped by ${item.group_by}`}
            onClick={() => onSelect(item.id)}
          >
            <CardBody>
              <Muted>Baseline {item.baseline_run_id}</Muted>
              <FlagRow>
                {item.comparability_flags.map((flag) => (
                  <ComparabilityBadge key={flag} flag={flag} />
                ))}
              </FlagRow>
              <HanaButton
                type="button"
                variant={item.id === activeComparisonId ? "primary" : "secondary"}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(item.id);
                }}
              >
                {item.id === activeComparisonId ? "Viewing" : "Open comparison"}
              </HanaButton>
            </CardBody>
          </HanaCard>
        ))}
      </Mvp4Grid>
    </Stack>
  );
}

function ComparisonDetail({ comparisonId }: { comparisonId: string }) {
  const comparisonQuery = useBenchmarkComparison(comparisonId);

  if (comparisonQuery.isLoading) {
    return <PageState kind="loading" title="Comparison is loading" description="Metric rows and deltas are being prepared." />;
  }

  if (comparisonQuery.isError || !comparisonQuery.data) {
    return <PageState kind="error" title="Comparison could not load" description="Retry, or rebuild the comparison from the run selector." />;
  }

  const comparison = comparisonQuery.data;
  const nonSameDatasetFlags = comparison.comparability_summary.flags.filter((flag) => flag !== "SAME_DATASET");

  return (
    <Stack>
      <ComparisonSummaryCard comparison={comparison} />

      <SectionTitle>
        <GitCompareArrows aria-hidden="true" size={18} />
        <h2>Side-by-side metrics</h2>
      </SectionTitle>

      {nonSameDatasetFlags.length > 0 ? <ComparabilityBand comparison={comparison} /> : <SameDatasetBand />}

      <RunHeaderRow>
        {comparison.runs.map((run) => (
          <RunHeaderChip key={run.run_id} data-baseline={run.is_baseline}>
            <strong>{run.label}</strong>
            <span>{run.group_value}</span>
            <FlagRow>
              {run.is_baseline ? <HanaBadge tone="neutral">baseline</HanaBadge> : null}
              {run.comparability_flags.map((flag) => (
                <ComparabilityBadge key={flag} flag={flag} />
              ))}
            </FlagRow>
          </RunHeaderChip>
        ))}
      </RunHeaderRow>

      <MetricComparisonTable comparison={comparison} />

      {comparison.excluded_runs.length > 0 ? (
        <HanaCard title="Excluded runs" description="Requested runs that were not eligible for this comparison">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Reason</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {comparison.excluded_runs.map((excluded) => (
                  <tr key={excluded.run_id}>
                    <td>{excluded.run_id}</td>
                    <td>
                      <StatusBadge token={excluded.exclusion_reason} tone="warning" />
                    </td>
                    <td>{excluded.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>
      ) : null}

      <ConfusionMatrixSection comparison={comparison} />
    </Stack>
  );
}

// Wave 37 (FE6-044 / §4.3 P6): summary-first strong Section answering "what did
// this comparison decide" before the dense matrix. Counts are derived from the
// existing per-run delta_status; absent/NOT_APPLICABLE sides stay honest (they
// land in "비교 불가", never a fabricated 0%).
function ComparisonSummaryCard({ comparison }: { comparison: BenchmarkComparison }) {
  const baseline = comparison.runs.find((run) => run.is_baseline);
  let improved = 0;
  let regressed = 0;
  let flat = 0;
  let notComparable = 0;
  comparison.metric_rows.forEach((row) => {
    row.per_run.forEach((cell) => {
      if (comparison.runs.find((run) => run.run_id === cell.run_id)?.is_baseline) {
        return;
      }
      switch (cell.delta_status) {
        case "IMPROVED":
          improved += 1;
          break;
        case "REGRESSED":
          regressed += 1;
          break;
        case "NOT_COMPARABLE":
          notComparable += 1;
          break;
        default:
          flat += 1;
      }
    });
  });
  const nonBaselineRunCount = comparison.runs.filter((run) => !run.is_baseline).length;

  return (
    <HanaCard
      emphasis="summary"
      eyebrow="비교 결과"
      title="기준 실행 대비 어떤 지표가 좋아지고 나빠졌는지 확인합니다"
      description={`${comparison.runs.length}개 실행 · 기준 ${baseline?.label ?? comparison.baseline_run_id} · ${comparison.group_by} 기준 그룹화 · 허용 오차 ${comparison.delta_epsilon}`}
    >
      <SummaryStripBody>
        <SummaryStat data-tone="up">
          <strong>{improved}</strong>
          <span>향상</span>
        </SummaryStat>
        <SummaryStat data-tone="down">
          <strong>{regressed}</strong>
          <span>저하</span>
        </SummaryStat>
        <SummaryStat data-tone="flat">
          <strong>{flat}</strong>
          <span>허용 오차 내</span>
        </SummaryStat>
        <SummaryStat data-tone="muted">
          <strong>{notComparable}</strong>
          <span>비교 불가</span>
        </SummaryStat>
        <SummaryStat data-tone="muted">
          <strong>{nonBaselineRunCount}</strong>
          <span>기준 외 실행</span>
        </SummaryStat>
      </SummaryStripBody>
    </HanaCard>
  );
}

function MetricComparisonTable({ comparison }: { comparison: BenchmarkComparison }) {
  const measurableRows = comparison.metric_rows.filter(
    (row) => row.baseline_metric_status === "MEASURED" || row.per_run.some((cell) => cell.metric_status === "MEASURED"),
  );

  if (comparison.metric_rows.length === 0 || measurableRows.length === 0) {
    return (
      <PageState
        kind="empty"
        title="No measurable metrics"
        description="The compared runs have no MEASURED metric rows, so there is nothing to compare. Metric values remain N/A rather than a fabricated 0%."
      />
    );
  }

  return (
    <HanaCard title="Metric deltas vs baseline" description={`Epsilon ${comparison.delta_epsilon} · signed deltas against the baseline run`}>
      <CompactTable>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              {comparison.runs.map((run) => (
                <th key={run.run_id}>{run.is_baseline ? `${run.label} (baseline)` : run.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.metric_rows.map((row) => (
              <MetricRowCells key={row.metric_name} row={row} comparison={comparison} />
            ))}
          </tbody>
        </table>
      </CompactTable>
    </HanaCard>
  );
}

function MetricRowCells({ row, comparison }: { row: BenchmarkMetricRow; comparison: BenchmarkComparison }) {
  const isMissingMetric = row.row_comparability_flags.includes("MISSING_METRIC");
  return (
    <tr data-missing={isMissingMetric}>
      <td>
        <MetricNameCell>
          <span>{metricLabel(row.metric_name)}</span>
          {isMissingMetric ? <HanaBadge tone="warning">MISSING_METRIC</HanaBadge> : null}
        </MetricNameCell>
      </td>
      {comparison.runs.map((run) => {
        const cell = row.per_run.find((entry) => entry.run_id === run.run_id);
        return <MetricValueCell key={run.run_id} cell={cell} isBaseline={run.is_baseline} />;
      })}
    </tr>
  );
}

function MetricValueCell({ cell, isBaseline }: { cell?: BenchmarkMetricCell; isBaseline: boolean }) {
  if (!cell) {
    return <td>—</td>;
  }

  const value = cell.metric_status === "NOT_APPLICABLE" || cell.value === null || cell.value === undefined ? "N/A" : `${Math.round(cell.value * 100)}%`;

  if (isBaseline) {
    return (
      <td>
        <ValueStack>
          <strong>{value}</strong>
          <Muted>baseline</Muted>
        </ValueStack>
      </td>
    );
  }

  return (
    <td>
      <ValueStack>
        <strong>{value}</strong>
        <DeltaBadge cell={cell} />
      </ValueStack>
    </td>
  );
}

function DeltaBadge({ cell }: { cell: BenchmarkMetricCell }) {
  if (cell.delta_status === "NOT_COMPARABLE") {
    return (
      <NotComparable title="A side is NOT_APPLICABLE / absent, so no numeric delta is shown.">
        <AlertTriangle aria-hidden="true" size={13} /> Not comparable
      </NotComparable>
    );
  }

  const sign = cell.delta != null && cell.delta > 0 ? "+" : "";
  const deltaText = cell.delta != null ? `${sign}${(cell.delta * 100).toFixed(1)} pts` : "";

  if (cell.delta_status === "IMPROVED") {
    return (
      <Delta data-tone="up">
        <ArrowUpRight aria-hidden="true" size={13} /> {deltaText} <span>higher than baseline</span>
      </Delta>
    );
  }
  if (cell.delta_status === "REGRESSED") {
    return (
      <Delta data-tone="down">
        <ArrowDownRight aria-hidden="true" size={13} /> {deltaText} <span>lower than baseline</span>
      </Delta>
    );
  }
  return (
    <Delta data-tone="flat">
      <Minus aria-hidden="true" size={13} /> within tolerance of baseline
    </Delta>
  );
}

function ComparabilityBand({ comparison }: { comparison: BenchmarkComparison }) {
  return (
    <WarningBand role="status">
      <AlertTriangle aria-hidden="true" size={18} />
      <div>
        <strong>Compare with care — these runs are not a like-for-like comparison.</strong>
        <FlagRow>
          {comparison.comparability_summary.flags.map((flag) => (
            <ComparabilityBadge key={flag} flag={flag} />
          ))}
        </FlagRow>
        <ul>
          {comparison.comparability_summary.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </WarningBand>
  );
}

function SameDatasetBand() {
  return (
    <InfoBand role="status">
      <Info aria-hidden="true" size={16} />
      <span>All compared runs share the same dataset and dataset version. Deltas are fully comparable.</span>
    </InfoBand>
  );
}

function ConfusionMatrixSection({ comparison }: { comparison: BenchmarkComparison }) {
  const [runId, setRunId] = useState<string>(comparison.runs[0]?.run_id ?? "");
  const [axis, setAxis] = useState<ConfusionMatrixAxis>("ENTITY_CLASS");
  const [activeCellId, setActiveCellId] = useState<string | null>(null);

  const matrixQuery = useBenchmarkConfusionMatrix(comparison.id, runId, axis);

  function handleAxisChange(nextAxis: ConfusionMatrixAxis) {
    setAxis(nextAxis);
    setActiveCellId(null);
  }
  function handleRunChange(nextRun: string) {
    setRunId(nextRun);
    setActiveCellId(null);
  }

  return (
    <MatrixDisclosure>
      <summary>
        <Grid3x3 aria-hidden="true" size={18} />
        <span>혼동 행렬 자세히 보기</span>
      </summary>

      <MatrixControls>
        <ControlField>
          <label htmlFor="confusion-run">Run</label>
          <HanaSelect id="confusion-run" value={runId} onChange={(event) => handleRunChange(event.target.value)}>
            {comparison.runs.map((run) => (
              <option key={run.run_id} value={run.run_id}>
                {run.label}
              </option>
            ))}
          </HanaSelect>
        </ControlField>
        <AxisToggle role="tablist" aria-label="Confusion matrix axis">
          {AXIS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={axis === option}
              data-active={axis === option}
              onClick={() => handleAxisChange(option)}
            >
              {option}
            </button>
          ))}
        </AxisToggle>
      </MatrixControls>

      {matrixQuery.isLoading ? (
        <PageState kind="loading" title="Confusion matrix is loading" description="Cell counts are being prepared." />
      ) : matrixQuery.isError || !matrixQuery.data ? (
        <PageState kind="error" title="Confusion matrix could not load" description="Retry, or switch run/axis." />
      ) : (
        <ConfusionMatrixGrid matrix={matrixQuery.data} activeCellId={activeCellId} onCellSelect={setActiveCellId} />
      )}

      {activeCellId && matrixQuery.data ? (
        <CellDrilldown comparisonId={comparison.id} runId={runId} axis={axis} cellId={activeCellId} matrix={matrixQuery.data} />
      ) : null}
    </MatrixDisclosure>
  );
}

function ConfusionMatrixGrid({
  matrix,
  activeCellId,
  onCellSelect,
}: {
  matrix: ConfusionMatrix;
  activeCellId: string | null;
  onCellSelect: (cellId: string) => void;
}) {
  const cellByKey = new Map<string, ConfusionMatrixCell>();
  matrix.cells.forEach((cell) => cellByKey.set(`${cell.gold_label}|${cell.candidate_label}`, cell));

  if (matrix.labels.length === 0 || (matrix.labels.length === 1 && matrix.labels[0] === CONFUSION_NONE_LABEL)) {
    return (
      <PageState
        kind="empty"
        title="No comparison data for this axis"
        description="This run has no buckets for the selected axis. Totals are N/A, not a fabricated 0%."
      />
    );
  }

  const label = (raw: string) =>
    raw === CONFUSION_NONE_LABEL ? "(no match)" : matrix.label_display_names?.[raw] ?? raw;

  return (
    <>
      <CompactTable>
        <MatrixTable>
          <table>
            <thead>
              <tr>
                <th>gold ↓ / candidate →</th>
                {matrix.labels.map((col) => (
                  <th key={col} title={col === CONFUSION_NONE_LABEL ? "no candidate = false positive column source" : col}>
                    {label(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.labels.map((rowLabel) => (
                <tr key={rowLabel}>
                  <th scope="row" title={rowLabel === CONFUSION_NONE_LABEL ? "no gold = false positive source" : rowLabel}>
                    {label(rowLabel)}
                  </th>
                  {matrix.labels.map((colLabel) => {
                    const cell = cellByKey.get(`${rowLabel}|${colLabel}`);
                    const count = cell?.count ?? 0;
                    const drillable = Boolean(cell) && count > 0 && (cell!.contributing_error_case_ref.error_case_count > 0);
                    const isDiagonal = cell?.is_diagonal ?? rowLabel === colLabel;
                    if (!cell || count === 0) {
                      return (
                        <MatrixCell key={colLabel} data-empty="true" data-diagonal={isDiagonal}>
                          <span>·</span>
                        </MatrixCell>
                      );
                    }
                    return (
                      <MatrixCell
                        key={colLabel}
                        data-diagonal={isDiagonal}
                        data-active={cell.id === activeCellId}
                        data-drillable={drillable}
                      >
                        {drillable ? (
                          <button type="button" onClick={() => onCellSelect(cell.id)} aria-label={`Drill ${rowLabel} to ${colLabel}, ${count} cases`}>
                            <strong>{count}</strong>
                            <em>{cell.contributing_error_case_ref.error_case_count} cases</em>
                          </button>
                        ) : (
                          <span>
                            <strong>{count}</strong>
                            {isDiagonal ? <em>matched</em> : null}
                          </span>
                        )}
                      </MatrixCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </MatrixTable>
      </CompactTable>

      <MatrixTotals>
        <KeyValue>
          <dt>Diagonal (matched)</dt>
          <dd>{matrix.totals.diagonal_count}</dd>
          <dt>Off-diagonal</dt>
          <dd>{matrix.totals.off_diagonal_count}</dd>
          <dt>Accuracy</dt>
          <dd>{matrix.totals.accuracy_status === "NOT_APPLICABLE" || matrix.totals.accuracy == null ? "N/A" : `${Math.round(matrix.totals.accuracy * 100)}%`}</dd>
        </KeyValue>
        <Muted>
          “(no match)” is the {CONFUSION_NONE_LABEL} sentinel: a no-gold column source marks false positives, a no-candidate row marks
          false negatives. It is never a real ontology id.
        </Muted>
      </MatrixTotals>
    </>
  );
}

function CellDrilldown({
  comparisonId,
  runId,
  axis,
  cellId,
  matrix,
}: {
  comparisonId: string;
  runId: string;
  axis: ConfusionMatrixAxis;
  cellId: string;
  matrix: ConfusionMatrix;
}) {
  const drillQuery = useBenchmarkCellErrorCases(comparisonId, runId, axis, cellId);
  const cell = matrix.cells.find((item) => item.id === cellId);
  const label = (raw?: string) => (raw === CONFUSION_NONE_LABEL ? "(no match)" : raw ?? "");

  return (
    <HanaCard
      title="Contributing error cases"
      description={`${axis} · ${label(cell?.gold_label)} → ${label(cell?.candidate_label)} · run ${runId}`}
    >
      <CardBody>
        {drillQuery.isLoading ? (
          <PageState kind="loading" title="Error cases are loading" description="Contributing comparison rows are being prepared." />
        ) : drillQuery.isError ? (
          <PageState kind="error" title="Error cases could not load" description="Retry from the confusion cell." />
        ) : (drillQuery.data?.error_cases.length ?? 0) === 0 ? (
          <PageState kind="empty" title="No contributing error cases for this cell" description="Matched / diagonal cells have no error cases." />
        ) : (
          drillQuery.data!.error_cases.map((errorCase) => <ErrorCaseCard key={errorCase.id} errorCase={errorCase} />)
        )}
      </CardBody>
    </HanaCard>
  );
}

function ErrorCaseCard({ errorCase }: { errorCase: EvaluationErrorCase }) {
  return (
    <Mvp4Panel>
      <FlagRow>
        <HanaBadge tone="danger">{errorCase.error_type}</HanaBadge>
        <span>Sample {errorCase.sample_id}</span>
      </FlagRow>
      <p>{errorCase.comparison_summary}</p>
      <EvidencePair>
        <div>
          <strong>Gold evidence</strong>
          <span>{evidenceLabel(errorCase.gold_evidence, "Gold evidence unavailable")}</span>
        </div>
        <div>
          <strong>Candidate evidence</strong>
          <span>{evidenceLabel(errorCase.candidate_evidence, "Candidate evidence unavailable")}</span>
        </div>
      </EvidencePair>
      {errorCase.candidate_ref ? (
        <Muted>
          {errorCase.candidate_ref.candidate_kind} · {errorCase.candidate_ref.ontology_class_id ?? errorCase.candidate_ref.ontology_relation_id ?? "context n/a"}
        </Muted>
      ) : null}
    </Mvp4Panel>
  );
}

function ComparabilityBadge({ flag }: { flag: ComparisonComparabilityFlag }) {
  const tone = flag === "SAME_DATASET" ? "neutral" : "warning";
  return <HanaBadge tone={tone}>{flag}</HanaBadge>;
}

function evidenceLabel(evidence?: GoldEvidenceRef | null, fallback = "Evidence unavailable") {
  if (!evidence) {
    return fallback;
  }
  return [evidence.locator, evidence.quote].filter(Boolean).join(" · ") || "Evidence ref";
}

function metricLabel(metricName: EvaluationMetricName) {
  return metricName
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

const SafetyNote = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};

  svg {
    color: ${({ theme }) => theme.color.primary};
    flex-shrink: 0;
  }
`;

// Wave 37 (FE6-044): KPI-style strip inside the summary Section card.
const SummaryStripBody = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
`;

const SummaryStat = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.lgPlus};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  &[data-tone="up"] strong {
    color: ${({ theme }) => theme.color.positive};
  }
  &[data-tone="down"] strong {
    color: ${({ theme }) => theme.color.danger};
  }
  &[data-tone="flat"] strong,
  &[data-tone="muted"] strong {
    color: ${({ theme }) => theme.color.text};
  }
`;

// Wave 37 (FE6-044 / P6): confusion matrix collapsed by default behind a
// native disclosure so the decision-critical summary + metric deltas read first.
const MatrixDisclosure = styled.details`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};

  > summary {
    display: flex;
    gap: ${({ theme }) => theme.spacing.sm};
    align-items: center;
    cursor: pointer;
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }

  > summary svg {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const RunList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RunRow = styled.div`
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};

  &[data-selected="true"] {
    border-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }

  &[data-disabled="true"] {
    opacity: 0.65;
  }

  label {
    display: flex;
    gap: ${({ theme }) => theme.spacing.sm};
    align-items: flex-start;
    padding: ${({ theme }) => theme.spacing.md};
    cursor: pointer;
  }

  input {
    margin-top: 4px;
  }
`;

const RunMeta = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;

  strong,
  span {
    overflow-wrap: anywhere;
  }

  > span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

const RunChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const BuilderControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-end;
  margin-top: ${({ theme }) => theme.spacing.md};

  button {
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

const ControlField = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 220px;

  label {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const SectionTitle = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
`;

const FlagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const RunHeaderRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const RunHeaderChip = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  &[data-baseline="true"] {
    border-color: ${({ theme }) => theme.color.primary};
  }

  strong,
  span {
    overflow-wrap: anywhere;
  }

  > span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

const MetricNameCell = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const ValueStack = styled.div`
  display: grid;
  gap: 2px;

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }
`;

const Delta = styled.span`
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  }

  &[data-tone="up"] {
    color: ${({ theme }) => theme.color.positive};
  }
  &[data-tone="down"] {
    color: ${({ theme }) => theme.color.danger};
  }
  &[data-tone="flat"] {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const NotComparable = styled.span`
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.color.textMuted};
  font-style: italic;
`;

const WarningBand = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warning};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  svg {
    color: ${({ theme }) => theme.color.warning};
    flex-shrink: 0;
  }

  div {
    display: grid;
    gap: ${({ theme }) => theme.spacing.xs};
  }

  ul {
    margin: 0;
    padding-left: ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const InfoBand = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.textMuted};

  svg {
    color: ${({ theme }) => theme.color.primary};
    flex-shrink: 0;
  }
`;

const MatrixControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-end;
`;

const AxisToggle = styled.div`
  display: inline-flex;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow: hidden;

  button {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border: none;
    background: ${({ theme }) => theme.color.surface};
    color: ${({ theme }) => theme.color.textMuted};
    cursor: pointer;
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  button[data-active="true"] {
    background: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.surfaceRaised};
  }
`;

const MatrixTable = styled.div`
  th[scope="row"] {
    text-align: left;
    white-space: nowrap;
  }
`;

const MatrixCell = styled.td`
  text-align: center;
  vertical-align: middle;

  span,
  button {
    display: inline-grid;
    gap: 2px;
    justify-items: center;
  }

  em {
    font-style: normal;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }

  &[data-diagonal="true"] {
    background: ${({ theme }) => theme.color.primarySoft};
  }

  &[data-empty="true"] {
    color: ${({ theme }) => theme.color.borderStrong};
  }

  button {
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    background: ${({ theme }) => theme.color.surface};
    cursor: pointer;
  }

  &[data-active="true"] button {
    border-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }
`;

const MatrixTotals = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const EvidencePair = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }

  div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    overflow-wrap: anywhere;
  }
`;
