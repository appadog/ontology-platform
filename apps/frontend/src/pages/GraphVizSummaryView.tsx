import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import styled from "styled-components";
import { GraphVizError } from "../shared/api/client";
import { useProjectGraphViz } from "../shared/api/queries";
import {
  GraphVizEdge,
  GraphVizMutationGuard,
  GraphVizNode,
  GraphVizResponse,
} from "../shared/api/types";
import { CLASS_LABELS, RELATION_LABELS } from "../shared/mocks/mvp6GraphVizFixtures";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CardBody, KeyValue, Muted, Stack } from "./mvp3Shared";
import { versionLabel } from "./mvp4Shared";
import { formatDateTime } from "../shared/lib/format";

// MVP6.12 Advanced Visualization — Published Graph "시각화 · 요약" sub-view (FE6-106/
// FE6-107). READ-ONLY whole-graph viz data + graph-level summary over the PUBLISHED
// graph. This surface MUTATES NOTHING, PUBLISHES NOTHING, SAVES NOTHING: there is NO
// save-layout / apply / publish / snapshot / export / "저장" / "게시" affordance
// anywhere. Rendered node positions are EPHEMERAL client-side layout computed from
// the response layout HINTS (degree / component_id / class_id) — the response carries
// NO x/y and the FE never sends a layout back. The summary is EXACT over the full
// published graph in every status. Every response carries an all-false 6-flag
// GraphVizMutationGuard, rendered as a live proof line read FROM the response.

const GUARD_FLAGS: (keyof GraphVizMutationGuard)[] = [
  "published_graph_mutated",
  "candidate_graph_mutated",
  "ontology_draft_mutated",
  "published_version_created",
  "graph_snapshot_created",
  "layout_persisted",
];

/** All-false invariant: MVP6.12 turns NO flag true, ever. */
function guardAllFalse(guard: GraphVizMutationGuard): boolean {
  return GUARD_FLAGS.every((flag) => guard[flag] === false);
}

function classLabel(classId: string): string {
  return CLASS_LABELS[classId] ?? classId;
}

function relationLabel(relationId: string): string {
  return RELATION_LABELS[relationId] ?? relationId;
}

/** Deterministic HSL fill per class id (stable across renders; not a coordinate). */
function classColor(classId: string): string {
  let hash = 0;
  for (let i = 0; i < classId.length; i += 1) {
    hash = (hash * 31 + classId.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 62%, 52%)`;
}

export function GraphVizSummaryView({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  // Read-only filter hints (G1): bound the ELEMENT view only. The summary is ALWAYS
  // over the full published graph, so the filter controls (derived from the summary
  // buckets) never change the summary numbers.
  const [classIds, setClassIds] = useState<string[]>([]);
  const [relationIds, setRelationIds] = useState<string[]>([]);

  const params = useMemo(
    () => ({
      ...(classIds.length ? { class_ids: classIds } : {}),
      ...(relationIds.length ? { relation_ids: relationIds } : {}),
    }),
    [classIds, relationIds],
  );

  const vizQuery = useProjectGraphViz(projectId, params);
  const viz = vizQuery.data ?? null;

  const liveGuard = viz?.mutation_guard ?? null;
  const guardViolation = liveGuard ? !guardAllFalse(liveGuard) : false;

  const toggleClass = (classId: string) =>
    setClassIds((prev) => (prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]));
  const toggleRelation = (relationId: string) =>
    setRelationIds((prev) =>
      prev.includes(relationId) ? prev.filter((r) => r !== relationId) : [...prev, relationId],
    );

  return (
    <Stack>
      {/* §2.1 Safety spine: persistent read-only banner + boundary chips. Renders
          immediately, independent of the data load. */}
      <BoundaryBanner role="note">
        <Info aria-hidden="true" size={18} />
        <div>
          <strong>읽기 전용 시각화입니다. 그래프를 변경하지 않습니다.</strong>
          <p>
            게시 그래프를 읽기 전용으로 시각화하고 요약 통계를 보여줄 뿐입니다. 후보/게시/DRAFT 그래프를 변경하지
            않고, 게시 버전이나 스냅샷을 만들지 않으며, 화면에 그려진 레이아웃은 클라이언트에서만 계산되어 서버에
            저장·캐시되지 않습니다. 게시는 별도의 게시 경로로만 이루어집니다.
          </p>
          <ChipRow>
            <HanaBadge tone="progress">READ_ONLY · 읽기 전용</HanaBadge>
            <HanaBadge tone="progress">NOTHING_CHANGES · 변경 없음</HanaBadge>
            <HanaBadge tone="progress">NO_PUBLISH · 게시 없음</HanaBadge>
            <HanaBadge tone="progress">NO_LAYOUT_SAVED · 레이아웃 저장 없음</HanaBadge>
            <HanaBadge tone="progress">PUBLISHED_ONLY · 게시 전용</HanaBadge>
          </ChipRow>
        </div>
      </BoundaryBanner>

      {liveGuard ? (
        guardViolation ? (
          <ErrorRow role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>
              예상치 못한 상태: mutation 플래그가 감지되었습니다. 이는 결함이며 시각화를 신뢰할 수 있는 읽기 전용
              결과로 표시하지 않습니다.
            </span>
          </ErrorRow>
        ) : (
          <GuardProof guard={liveGuard} />
        )
      ) : null}

      <VizBody
        projectId={projectId}
        projectName={projectName}
        vizQuery={vizQuery}
        viz={viz}
        classIds={classIds}
        relationIds={relationIds}
        onToggleClass={toggleClass}
        onToggleRelation={toggleRelation}
        onResetFilters={() => {
          setClassIds([]);
          setRelationIds([]);
        }}
      />
    </Stack>
  );
}

function VizBody({
  projectId,
  projectName,
  vizQuery,
  viz,
  classIds,
  relationIds,
  onToggleClass,
  onToggleRelation,
  onResetFilters,
}: {
  projectId: string;
  projectName: string;
  vizQuery: ReturnType<typeof useProjectGraphViz>;
  viz: GraphVizResponse | null;
  classIds: string[];
  relationIds: string[];
  onToggleClass: (classId: string) => void;
  onToggleRelation: (relationId: string) => void;
  onResetFilters: () => void;
}) {
  void projectName;
  if (vizQuery.isLoading) {
    return (
      <>
        <SkeletonRow aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonTile key={i} />
          ))}
        </SkeletonRow>
        <SkeletonCanvas aria-hidden="true" />
      </>
    );
  }

  if (vizQuery.isError) {
    const err = vizQuery.error;
    if (err instanceof GraphVizError && err.status === 403) {
      return (
        <PageState
          kind="permission"
          title="권한이 제한되어 있습니다"
          description="이 프로젝트를 볼 수 있는 구성원만 게시 그래프 시각화를 조회할 수 있습니다."
        />
      );
    }
    const invalidCap = err instanceof GraphVizError && err.code === "INVALID_CAP";
    return (
      <PageState
        kind="error"
        title={invalidCap ? "허용 범위를 벗어난 상한입니다" : "그래프 시각화를 불러오지 못했습니다"}
        description={
          err instanceof GraphVizError
            ? err.message
            : "서비스에서 오류가 반환되었습니다. 이 화면은 아무것도 변경하지 않으므로 안전하게 다시 시도할 수 있습니다."
        }
        actionLabel="다시 시도"
        onAction={() => void vizQuery.refetch()}
      />
    );
  }

  if (!viz) {
    return <PageState kind="empty" title="시각화 데이터 없음" description="표시할 게시 그래프 데이터가 없습니다." />;
  }

  return (
    <>
      <StatusRow>
        <StatusBadge token={viz.status} />
        <StatusBadge token={viz.scope} koLabel="게시 전용" />
        <Muted as="span">{versionLabel(viz.published_graph_version_ref)} · 요약은 항상 전체 그래프 기준</Muted>
        <Muted as="span">생성 시각: {formatDateTime(viz.generated_at)}</Muted>
      </StatusRow>

      {/* §2.2 Summary-stats panel — always shown, exact in every status. */}
      <SummaryPanel viz={viz} />

      {/* Status-driven body. */}
      {viz.status === "READY" ? (
        <ReadyBody
          viz={viz}
          classIds={classIds}
          relationIds={relationIds}
          onToggleClass={onToggleClass}
          onToggleRelation={onToggleRelation}
          onResetFilters={onResetFilters}
        />
      ) : viz.status === "TOO_LARGE_SUMMARY_ONLY" ? (
        <TooLargeBody viz={viz} />
      ) : (
        <EmptyBody projectId={projectId} />
      )}
    </>
  );
}

// ---- §2.2 Summary-stats panel (exact in every status; density 3-dp) ----

function SummaryPanel({ viz }: { viz: GraphVizResponse }) {
  const s = viz.summary;
  return (
    <HanaCard
      title="그래프 요약 통계"
      description="전체 게시 그래프 기준의 정확한 통계입니다 (필터를 적용해도 이 숫자는 바뀌지 않습니다)."
      eyebrow="SUMMARY · 전체 그래프 기준"
      emphasis="default"
    >
      <CardBody>
        <TotalsRow>
          <MetricCard label="노드 (nodes)" value={String(s.total_node_count)} />
          <MetricCard label="엣지 (edges)" value={String(s.total_edge_count)} />
          <MetricCard label="밀도 · density" value={s.density.toFixed(3)} />
          <MetricCard label="컴포넌트 수 · components" value={String(s.component_count)} />
          <MetricCard label="최대 컴포넌트 크기" value={String(s.largest_component_size)} />
          <MetricCard label="고립 노드 수" value={String(s.isolated_node_count)} />
          <MetricCard label="최대 차수 · max degree" value={String(s.max_degree)} />
        </TotalsRow>

        <BucketGrid>
          <BucketBlock>
            <BucketHead>클래스별 노드 수 (node counts by class)</BucketHead>
            {s.node_counts_by_class.length === 0 ? (
              <Muted>표시할 클래스가 없습니다.</Muted>
            ) : (
              <BucketList>
                {s.node_counts_by_class.map((b) => (
                  <BucketRow key={b.class_id}>
                    <Swatch style={{ background: classColor(b.class_id) }} aria-hidden="true" />
                    <BucketLabel>{classLabel(b.class_id)}</BucketLabel>
                    <code>{b.class_id}</code>
                    <b>{b.count}</b>
                  </BucketRow>
                ))}
              </BucketList>
            )}
          </BucketBlock>

          <BucketBlock>
            <BucketHead>관계별 엣지 수 (edge counts by relation)</BucketHead>
            {s.edge_counts_by_relation.length === 0 ? (
              <Muted>표시할 관계가 없습니다.</Muted>
            ) : (
              <BucketList>
                {s.edge_counts_by_relation.map((b) => (
                  <BucketRow key={b.relation_id}>
                    <BucketLabel>{relationLabel(b.relation_id)}</BucketLabel>
                    <code>{b.relation_id}</code>
                    <b>{b.count}</b>
                  </BucketRow>
                ))}
              </BucketList>
            )}
          </BucketBlock>
        </BucketGrid>
      </CardBody>
    </HanaCard>
  );
}

// ---- §2.3 READY — bounded whole-graph view (client-side layout from hints) ----

interface Positioned {
  node: GraphVizNode;
  x: number;
  y: number;
  r: number;
}

const CANVAS_W = 960;
const CANVAS_H = 560;

/**
 * Deterministic CLIENT-SIDE layout from the response layout HINTS. The response
 * carries NO x/y: positions are computed here from component_id (cluster) + degree
 * (node size) + published_entity_id order (stable seed). Nothing is persisted or
 * sent back. Same input -> same positions (no reshuffle on re-render).
 */
function layoutFromHints(nodes: GraphVizNode[]): Positioned[] {
  const components = new Map<string, GraphVizNode[]>();
  for (const node of nodes) {
    const bucket = components.get(node.component_id) ?? [];
    bucket.push(node);
    components.set(node.component_id, bucket);
  }
  const componentIds = [...components.keys()].sort();
  const cols = Math.max(1, Math.ceil(Math.sqrt(componentIds.length)));
  const rows = Math.max(1, Math.ceil(componentIds.length / cols));
  const cellW = CANVAS_W / cols;
  const cellH = CANVAS_H / rows;
  const maxDegree = nodes.reduce((max, n) => Math.max(max, n.degree), 0) || 1;

  const positioned: Positioned[] = [];
  componentIds.forEach((componentId, index) => {
    const members = components.get(componentId) ?? [];
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cx = col * cellW + cellW / 2;
    const cy = row * cellH + cellH / 2;
    const clusterR = Math.min(cellW, cellH) / 2 - 44;
    members.forEach((node, mi) => {
      const r = 8 + (node.degree / maxDegree) * 14;
      if (members.length === 1) {
        positioned.push({ node, x: cx, y: cy, r });
        return;
      }
      const angle = (mi / members.length) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.max(24, clusterR);
      positioned.push({
        node,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        r,
      });
    });
  });
  return positioned;
}

function ReadyBody({
  viz,
  classIds,
  relationIds,
  onToggleClass,
  onToggleRelation,
  onResetFilters,
}: {
  viz: GraphVizResponse;
  classIds: string[];
  relationIds: string[];
  onToggleClass: (classId: string) => void;
  onToggleRelation: (relationId: string) => void;
  onResetFilters: () => void;
}) {
  const positions = useMemo(() => layoutFromHints(viz.nodes), [viz.nodes]);
  const posById = useMemo(() => {
    const map = new Map<string, Positioned>();
    for (const p of positions) map.set(p.node.id, p);
    return map;
  }, [positions]);

  const [hovered, setHovered] = useState<GraphVizNode | null>(null);
  const filtersActive = classIds.length > 0 || relationIds.length > 0;

  return (
    <>
      <HanaCard
        title="필터 (읽기 전용)"
        description="클래스/관계를 선택해 그려지는 요소 범위를 좁힙니다. 요약 통계는 항상 전체 그래프 기준으로 바뀌지 않습니다."
        eyebrow="FILTERS · 요소 뷰 한정"
        emphasis="default"
      >
        <CardBody>
          <FilterGroup>
            <FilterHead>클래스</FilterHead>
            <ChipRow>
              {viz.summary.node_counts_by_class.map((b) => (
                <FilterChip
                  key={b.class_id}
                  type="button"
                  data-active={classIds.includes(b.class_id) ? "true" : "false"}
                  onClick={() => onToggleClass(b.class_id)}
                >
                  <Swatch style={{ background: classColor(b.class_id) }} aria-hidden="true" />
                  {classLabel(b.class_id)} · {b.count}
                </FilterChip>
              ))}
            </ChipRow>
          </FilterGroup>
          <FilterGroup>
            <FilterHead>관계</FilterHead>
            <ChipRow>
              {viz.summary.edge_counts_by_relation.map((b) => (
                <FilterChip
                  key={b.relation_id}
                  type="button"
                  data-active={relationIds.includes(b.relation_id) ? "true" : "false"}
                  onClick={() => onToggleRelation(b.relation_id)}
                >
                  {relationLabel(b.relation_id)} · {b.count}
                </FilterChip>
              ))}
            </ChipRow>
          </FilterGroup>
          {filtersActive ? (
            <FilterFooter>
              <HanaButton type="button" variant="secondary" onClick={onResetFilters}>
                필터 초기화
              </HanaButton>
              <Muted as="span">
                필터는 그려지는 요소만 한정합니다 — 요약 통계는 전체 그래프 기준으로 유지됩니다.
              </Muted>
            </FilterFooter>
          ) : null}
        </CardBody>
      </HanaCard>

      <HanaCard
        title="전체 그래프 뷰"
        description="레이아웃은 응답의 힌트(degree / component_id / class)에서 클라이언트가 계산합니다. 서버 좌표(x/y) 없음 · 저장 없음."
        eyebrow={`WHOLE GRAPH · 상한 ${viz.node_cap} 노드 / ${viz.edge_cap} 엣지 이내`}
        emphasis="default"
      >
        <CardBody>
          <CanvasMeta>
            <HanaBadge tone="neutral">노드 {viz.nodes.length}</HanaBadge>
            <HanaBadge tone="neutral">엣지 {viz.edges.length}</HanaBadge>
            <HanaBadge tone="progress">truncated: {String(viz.truncated)}</HanaBadge>
            <HanaBadge tone="progress">CLIENT_LAYOUT · 서버 좌표 없음</HanaBadge>
          </CanvasMeta>
          {viz.nodes.length === 0 ? (
            <Muted>선택한 필터에 해당하는 요소가 없습니다. 필터를 조정해 보세요.</Muted>
          ) : (
            <CanvasWrap>
              <svg
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                role="img"
                aria-label="게시 그래프 전체 뷰 (읽기 전용)"
                preserveAspectRatio="xMidYMid meet"
              >
                {viz.edges.map((edge: GraphVizEdge) => {
                  const from = posById.get(edge.source_node_id);
                  const to = posById.get(edge.target_node_id);
                  if (!from || !to) return null;
                  return (
                    <line
                      key={edge.id}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="currentColor"
                      strokeOpacity={0.28}
                      strokeWidth={1.2}
                    />
                  );
                })}
                {positions.map((p) => (
                  <g
                    key={p.node.id}
                    onMouseEnter={() => setHovered(p.node)}
                    onMouseLeave={() => setHovered((h) => (h?.id === p.node.id ? null : h))}
                    style={{ cursor: "default" }}
                  >
                    <circle cx={p.x} cy={p.y} r={p.r} fill={classColor(p.node.class_id)} fillOpacity={0.85} />
                    <text x={p.x} y={p.y + p.r + 12} textAnchor="middle" fontSize={11} fill="currentColor">
                      {p.node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </CanvasWrap>
          )}
          {hovered ? (
            <NodeMeta>
              <strong>{hovered.label}</strong>
              <KeyValue>
                <dt>클래스</dt>
                <dd>
                  {classLabel(hovered.class_id)} <code>{hovered.class_id}</code>
                </dd>
                <dt>차수 (degree · 힌트)</dt>
                <dd>{hovered.degree}</dd>
                <dt>컴포넌트 (component_id · 힌트)</dt>
                <dd>
                  <code>{hovered.component_id}</code>
                </dd>
                <dt>출처 · 근거</dt>
                <dd>
                  출처 {hovered.source_count ?? 0} · 근거 {hovered.evidence_count ?? 0} · lineage{" "}
                  {String(hovered.lineage_available ?? false)}
                </dd>
              </KeyValue>
            </NodeMeta>
          ) : (
            <Muted as="p">노드에 마우스를 올리면 재사용된 메타데이터(클래스 · degree · component · 출처/근거)를 봅니다.</Muted>
          )}
        </CardBody>
      </HanaCard>
    </>
  );
}

// ---- §2.4 TOO_LARGE_SUMMARY_ONLY — summary + notice (NO fabricated nodes) ----

function TooLargeBody({ viz }: { viz: GraphVizResponse }) {
  const tl = viz.too_large ?? null;
  return (
    <HanaCard
      title="그래프가 너무 큽니다 — 요약만 표시"
      description="전체를 그리기에 너무 커서 요약 통계만 표시합니다. 요소는 그리지 않습니다 (가짜 노드 없음)."
      eyebrow="TOO_LARGE_SUMMARY_ONLY · 요약 전용"
      emphasis="default"
    >
      <CardBody>
        <NoticeRow>
          <StatusBadge token="TOO_LARGE_SUMMARY_ONLY" />
          <span>그래프가 너무 커서 전체를 그릴 수 없습니다 — 요약 통계만 표시합니다. 필터로 범위를 좁혀 보세요.</span>
        </NoticeRow>
        {tl ? (
          <>
            <KeyValue>
              <dt>전체 노드 수 (exact)</dt>
              <dd>
                {tl.estimated_nodes} <Muted as="span">· 예산 {tl.node_budget}</Muted>
              </dd>
              <dt>전체 엣지 수 (exact)</dt>
              <dd>
                {tl.estimated_edges} <Muted as="span">· 예산 {tl.edge_budget}</Muted>
              </dd>
            </KeyValue>
            <Muted as="p">{tl.message}</Muted>
            {tl.suggested_filters && tl.suggested_filters.length > 0 ? (
              <SuggestedRow>
                <SuggestHead>제안 필터</SuggestHead>
                <ChipRow>
                  {tl.suggested_filters.map((f) => (
                    <HanaBadge key={f} tone="progress">
                      {f}
                    </HanaBadge>
                  ))}
                </ChipRow>
              </SuggestedRow>
            ) : null}
          </>
        ) : null}
      </CardBody>
    </HanaCard>
  );
}

// ---- §3 EMPTY (no published version) — zeroed summary + publish-first guidance ----

function EmptyBody({ projectId }: { projectId: string }) {
  return (
    <HanaCard title="게시된 그래프 없음" eyebrow="EMPTY · 데이터 없음" emphasis="default">
      <CardBody>
        <NoticeRow>
          <StatusBadge token="EMPTY" />
          <span>게시된 그래프가 아직 없습니다 — 먼저 버전을 게시하세요.</span>
        </NoticeRow>
        <Muted as="p">
          이 프로젝트에는 현재 게시된 그래프 버전이 없습니다. 위 요약 통계는 모두 0으로 표시됩니다 (가짜 데이터
          없음). 먼저 <Link to={`/projects/${projectId}/publish`}>게시</Link>에서 버전을 게시한 뒤 다시 시각화를
          확인하세요.
        </Muted>
      </CardBody>
    </HanaCard>
  );
}

// ---- §2.1 Guard proof line (reads flags FROM the response, never hardcoded) ----

function GuardProof({ guard }: { guard: GraphVizMutationGuard }) {
  const [open, setOpen] = useState(false);
  return (
    <ProofBlock>
      <ProofHead type="button" onClick={() => setOpen((v) => !v)}>
        <ShieldCheck aria-hidden="true" size={14} />
        <span>이 응답은 그래프를 변경/게시/저장하지 않았습니다 — 6개 mutation 플래그 모두 false</span>
        <em>{open ? "접기" : "증거 보기"}</em>
      </ProofHead>
      {open ? (
        <ProofGrid>
          {GUARD_FLAGS.map((flag) => (
            <ProofFlag key={flag}>
              <code>{flag}</code>
              <b>{String(guard[flag])}</b>
            </ProofFlag>
          ))}
        </ProofGrid>
      ) : null}
    </ProofBlock>
  );
}

// ---- styled ----

const BoundaryBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.primary};
    margin-top: 2px;
  }

  strong {
    display: block;
  }

  p {
    margin: ${({ theme }) => theme.spacing.xs} 0 ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    overflow-wrap: anywhere;
  }

  > div {
    min-width: 0;
  }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TotalsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const BucketGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const BucketBlock = styled.div`
  min-width: 0;
`;

const BucketHead = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const BucketList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const BucketRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  code {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    overflow-wrap: anywhere;
  }

  b {
    margin-left: auto;
    color: ${({ theme }) => theme.color.primary};
  }
`;

const BucketLabel = styled.span`
  overflow-wrap: anywhere;
`;

const Swatch = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
`;

const FilterGroup = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FilterHead = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const FilterChip = styled.button`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.text};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;

  &[data-active="true"] {
    border-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
    color: ${({ theme }) => theme.color.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const FilterFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const CanvasMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CanvasWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background:
    linear-gradient(90deg, ${({ theme }) => theme.color.surfaceMuted} 1px, transparent 1px),
    linear-gradient(${({ theme }) => theme.color.surfaceMuted} 1px, transparent 1px);
  background-size: 28px 28px;
  color: ${({ theme }) => theme.color.textMuted};

  svg {
    display: block;
    width: 100%;
    height: auto;
    min-width: 640px;
  }
`;

const NodeMeta = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  strong {
    overflow-wrap: anywhere;
  }

  code {
    overflow-wrap: anywhere;
  }
`;

const NoticeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const SuggestedRow = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const SuggestHead = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SkeletonRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SkeletonTile = styled.div`
  min-height: 84px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const SkeletonCanvas = styled.div`
  min-height: 320px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const ErrorRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.danger};
  border-radius: ${({ theme }) => theme.radius.sm};

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color.danger};
  }
`;

const ProofBlock = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const ProofHead = styled.button`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: left;
  cursor: pointer;

  span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  em {
    font-style: normal;
    color: ${({ theme }) => theme.color.primary};
  }

  svg {
    flex-shrink: 0;
  }
`;

const ProofGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const ProofFlag = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  code {
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.color.textMuted};
  }

  b {
    color: ${({ theme }) => theme.color.positive};
  }
`;
