import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Archive,
  Download,
  FileJson,
  GitBranch,
  History,
  Lock,
  PencilLine,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import styled from "styled-components";
import {
  useActivateDatasetRevision,
  useArchiveGoldEntity,
  useArchiveGoldRelation,
  useConfirmGoldSetImport,
  useCutDatasetRevision,
  useDatasetAuthoringOverview,
  useDatasetRevisions,
  useDryRunGoldSetImport,
  useEditGoldEntity,
  useEvaluationRuns,
  useGoldAuthoringAudit,
  useGoldEntities,
  useGoldEvidence,
  useGoldRelations,
  useProject,
  useRestoreGoldEntity,
  useRestoreGoldRelation,
} from "../shared/api/queries";
import {
  DatasetRevisionStatus,
  DatasetRevisionSummary,
  EvaluationRun,
  GoldAuthoringAuditEntry,
  GoldAuthoringCapabilities,
  GoldEntity,
  GoldEvidence,
  GoldEvidenceRef,
  GoldItemStatus,
  GoldRelation,
  GoldSetImportCompatibility,
  GoldSetImportReport,
  GoldSetImportStrategy,
  RunRevisionPin,
} from "../shared/api/types";
import { buildExportBundle } from "../shared/mocks/mvp6GoldsetFixtures";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { CardBody, Muted, SectionStack } from "../shared/ui/platform/Section";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CompactTable, KeyValue } from "./mvp3Shared";
import { PageActions } from "./mvp4Shared";

// MVP6.4 Gold Set Manager — expert-owned, candidate/analysis-layer authoring
// over the closed MVP6.1 evaluation surface. No publish/enforce/auto-merge/
// delete copy. FROZEN/ARCHIVED revisions are read-only/immutable. Import is
// honest dry-run-before-confirm. Every authoring response is non-mutating.

const importStateTone: Record<GoldSetImportCompatibility, "success" | "warning" | "danger"> = {
  COMPATIBLE: "success",
  WARNING: "warning",
  CONFLICT: "warning",
  INCOMPATIBLE: "danger",
};

export function GoldSetManagerPage() {
  const { projectId = "", datasetId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const overviewQuery = useDatasetAuthoringOverview(projectId, datasetId);
  const revisionsQuery = useDatasetRevisions(datasetId);
  const goldEntitiesQuery = useGoldEntities(datasetId);
  const goldRelationsQuery = useGoldRelations(datasetId);
  const evidenceQuery = useGoldEvidence(datasetId);
  const auditQuery = useGoldAuthoringAudit(datasetId);
  const runsQuery = useEvaluationRuns(projectId);

  const editEntity = useEditGoldEntity(datasetId);
  const archiveEntity = useArchiveGoldEntity(datasetId);
  const restoreEntity = useRestoreGoldEntity(datasetId);
  const archiveRelation = useArchiveGoldRelation(datasetId);
  const restoreRelation = useRestoreGoldRelation(datasetId);
  const cutRevision = useCutDatasetRevision(datasetId);
  const activateRevision = useActivateDatasetRevision(datasetId);
  const dryRunImport = useDryRunGoldSetImport(projectId);
  const confirmImport = useConfirmGoldSetImport(projectId);

  const [notice, setNotice] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<GoldSetImportReport | null>(null);
  const [importStrategy, setImportStrategy] = useState<GoldSetImportStrategy>("CREATE_NEW_DATASET");
  const [ackWarnings, setAckWarnings] = useState(false);

  const overview = overviewQuery.data;
  const capabilities = overview?.capabilities;
  const activeRevision = overview?.active_revision ?? null;
  const activeRevisionImmutable = activeRevision?.is_immutable ?? false;

  const revisions = useMemo(() => revisionsQuery.data?.items ?? [], [revisionsQuery.data]);
  const goldEntities = goldEntitiesQuery.data ?? [];
  const goldRelations = goldRelationsQuery.data ?? [];
  const evidence = evidenceQuery.data?.items ?? [];
  const auditEntries = auditQuery.data?.items ?? [];
  const pinnedRuns = overview?.pinned_runs ?? [];
  const runsById = useMemo(
    () => new Map((runsQuery.data ?? []).map((run) => [run.id, run])),
    [runsQuery.data],
  );

  if (projectQuery.isLoading || overviewQuery.isLoading) {
    return (
      <PageState
        kind="loading"
        title="정답셋 관리를 불러오는 중입니다"
        description="활성 리비전, 정답 항목, 실행 고정 상태를 준비하고 있습니다."
      />
    );
  }

  if (projectQuery.isError || overviewQuery.isError || !projectQuery.data || !overview) {
    return (
      <PageState
        kind="error"
        title="정답셋 관리를 불러오지 못했습니다"
        description="선택한 프로젝트와 데이터셋 컨텍스트에서 다시 시도하세요."
      />
    );
  }

  const canEdit = Boolean(capabilities?.can_edit_gold_item) && !activeRevisionImmutable;
  const canArchive = Boolean(capabilities?.can_archive_gold_item) && !activeRevisionImmutable;
  const canCutRevision = Boolean(capabilities?.can_cut_revision);
  const canImport = Boolean(capabilities?.can_import);

  const primaryActionLabel = activeRevisionImmutable ? "가져오기" : "리비전 생성";

  const handleEditFirstEntity = () => {
    const target = goldEntities.find((entity) => entity.id) ?? goldEntities[0];
    if (!target) {
      return;
    }
    editEntity.mutate(
      {
        goldEntityId: target.id,
        payload: {
          normalized_value: `${target.normalized_value ?? target.label} (검토됨)`,
          reason: "expert re-review normalized value",
        },
      },
      {
        onSuccess: () =>
          setNotice("이 편집은 게시 그래프·후보·기존 실행 결과를 변경하지 않습니다."),
      },
    );
  };

  const handleArchiveEntity = (entity: GoldEntity & { status?: GoldItemStatus }) => {
    archiveEntity.mutate(
      { goldEntityId: entity.id, payload: { reason: "stale gold item retired" } },
      {
        onSuccess: () =>
          setNotice("보관하면 새 평가에서 제외되지만 기존 실행과 근거는 그대로 유지됩니다."),
      },
    );
  };

  const handleRestoreEntity = (entity: GoldEntity & { status?: GoldItemStatus }) => {
    restoreEntity.mutate({ goldEntityId: entity.id, payload: { reason: "restore reviewed gold item" } });
  };

  const handleCutRevision = () => {
    cutRevision.mutate(
      { note: "Q3 expert re-review snapshot", activate: false },
      {
        onSuccess: (response) =>
          setNotice(
            `새 리비전 ${response.revision.id} (${response.revision.status})을 생성했습니다. 이전 리비전은 고정(FROZEN)되어 기존 실행을 변경하지 않습니다.`,
          ),
      },
    );
  };

  const handleActivateRevision = (revisionId: string) => {
    activateRevision.mutate(revisionId, {
      onSuccess: () =>
        setNotice("리비전을 활성화했습니다. 이전 활성 리비전은 고정(FROZEN)됩니다."),
    });
  };

  const handleExport = (revisionId: string) => {
    // Mock-friendly export: the same bundle the export GET returns. In actual
    // mode the apiClient.exportDatasetRevision GET would back a download.
    const bundle = buildExportBundle(revisionId);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${revisionId}.gold-set-bundle.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("선택한 리비전의 읽기 전용 스냅샷을 내보냈습니다. 공유·게시하지 않습니다.");
  };

  const handleDryRun = (state: DatasetRevisionStatus) => {
    // The mock derives the compatibility state from the bundle's revision_status
    // hint so every state can be exercised honestly before any confirm.
    const bundle = { ...buildExportBundle(activeRevision?.id ?? datasetId), revision_status: state };
    dryRunImport.mutate(
      { bundle },
      {
        onSuccess: (report) => {
          setImportReport(report);
          setAckWarnings(false);
          setImportStrategy(report.allowed_strategies[0] ?? "CREATE_NEW_DATASET");
        },
      },
    );
  };

  const handleConfirmImport = () => {
    if (!importReport || importReport.blocking) {
      return;
    }
    confirmImport.mutate(
      {
        importId: importReport.import_id,
        payload: {
          strategy: importStrategy,
          target_dataset_id:
            importStrategy === "NEW_REVISION_OF_EXISTING" ? datasetId : undefined,
          activate: false,
          acknowledge_warnings: importReport.compatibility === "WARNING" ? ackWarnings : true,
        },
      },
      {
        onSuccess: (response) => {
          setNotice(
            `가져오기를 확정했습니다. 새 ${response.created_revision_status} 리비전 ${response.created_revision_id}을 생성했습니다. 기존 실행은 변경되지 않습니다.`,
          );
          setImportReport(null);
        },
      },
    );
  };

  const confirmDisabled =
    confirmImport.isPending ||
    importReport?.blocking === true ||
    (importReport?.compatibility === "WARNING" && !ackWarnings);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Evaluation", to: `/projects/${projectId}/evaluation-datasets` },
          { label: overview.dataset.name, to: `/projects/${projectId}/evaluation-datasets/${datasetId}` },
          { label: "정답셋 관리" },
        ]}
      />
      <PageHeader title="정답셋 관리" description={`${overview.dataset.name} · 전문가 정답셋 편집 / 리비전`}>
        <PageActions>
          <HanaBadge tone="success">MVP6.4</HanaBadge>
          <StatusBadge token={overview.dataset.status} />
          {activeRevisionImmutable ? (
            <HanaButton type="button" variant="primary" onClick={() => handleDryRun("ACTIVE")} disabled={!canImport}>
              <Upload aria-hidden="true" size={16} /> {primaryActionLabel}
            </HanaButton>
          ) : (
            <HanaButton type="button" variant="primary" onClick={handleCutRevision} disabled={!canCutRevision || cutRevision.isPending}>
              <GitBranch aria-hidden="true" size={16} /> {primaryActionLabel}
            </HanaButton>
          )}
        </PageActions>
      </PageHeader>

      {notice ? (
        <NoticeBand role="status">
          <ShieldCheck aria-hidden="true" size={16} />
          <span>{notice}</span>
        </NoticeBand>
      ) : null}

      <PermissionBand capabilities={capabilities} />

      <SectionStack>
        <RevisionHeaderSection
          activeRevision={activeRevision}
          ontologyVersionId={overview.dataset.active_version_id ?? null}
          ownerId={overview.dataset.owner_id ?? null}
          immutable={activeRevisionImmutable}
        />

        <GoldItemSection
          goldEntities={goldEntities}
          goldRelations={goldRelations}
          evidence={evidence}
          canEdit={canEdit}
          canArchive={canArchive}
          immutable={activeRevisionImmutable}
          isLoading={goldEntitiesQuery.isLoading || goldRelationsQuery.isLoading}
          isError={goldEntitiesQuery.isError || goldRelationsQuery.isError}
          onEditFirst={handleEditFirstEntity}
          onArchiveEntity={handleArchiveEntity}
          onRestoreEntity={handleRestoreEntity}
          onArchiveRelation={(relation) =>
            archiveRelation.mutate({ goldRelationId: relation.id, payload: { reason: "stale relation retired" } })
          }
          onRestoreRelation={(relation) =>
            restoreRelation.mutate({ goldRelationId: relation.id })
          }
        />

        <RevisionListSection
          revisions={revisions}
          activeVersionId={overview.dataset.active_version_id ?? null}
          canActivate={Boolean(capabilities?.can_activate_revision)}
          canExport={true}
          isLoading={revisionsQuery.isLoading}
          isError={revisionsQuery.isError}
          onActivate={handleActivateRevision}
          onExport={handleExport}
        />

        <RunPinSection
          pinnedRuns={pinnedRuns}
          runsById={runsById}
          isLoading={runsQuery.isLoading}
        />

        <ImportSection
          canImport={canImport}
          report={importReport}
          strategy={importStrategy}
          ackWarnings={ackWarnings}
          confirmDisabled={confirmDisabled}
          isDryRunning={dryRunImport.isPending}
          onDryRun={handleDryRun}
          onStrategyChange={setImportStrategy}
          onAckChange={setAckWarnings}
          onConfirm={handleConfirmImport}
        />

        <AuditSection entries={auditEntries} isLoading={auditQuery.isLoading} />
      </SectionStack>
    </>
  );
}

function PermissionBand({ capabilities }: { capabilities?: GoldAuthoringCapabilities }) {
  const readOnly = !capabilities?.can_edit_gold_item && !capabilities?.can_cut_revision;
  if (!readOnly) {
    return (
      <PermissionRow data-tone="owner">
        <ShieldCheck aria-hidden="true" size={16} />
        <span>소유 전문가 권한 — 정답 항목 편집·보관·리비전 생성·가져오기가 가능합니다.</span>
      </PermissionRow>
    );
  }
  return (
    <PermissionRow data-tone="limited">
      <StatusBadge token="PERMISSION_LIMITED" />
      <span>정답셋 편집은 데이터셋 소유 전문가와 관리자만 가능합니다. 읽기 전용으로 표시됩니다.</span>
    </PermissionRow>
  );
}

function RevisionHeaderSection({
  activeRevision,
  ontologyVersionId,
  ownerId,
  immutable,
}: {
  activeRevision: GoldSetManagerActiveRevision | null;
  ontologyVersionId: string | null;
  ownerId: string | null;
  immutable: boolean;
}) {
  if (!activeRevision) {
    return (
      <HanaCard title="활성 리비전" emphasis="info">
        <CardBody>
          <Muted>
            현재 활성 리비전이 없습니다. 현재 샘플·정답 항목으로 새 리비전을 생성하면 활성 리비전이 만들어집니다.
          </Muted>
        </CardBody>
      </HanaCard>
    );
  }

  return (
    <HanaCard
      title={`활성 리비전 · #${activeRevision.revision_number}`}
      description={activeRevision.id}
      eyebrow="REVISION"
      emphasis="summary"
      action={<StatusBadge token={activeRevision.status} />}
    >
      <CardBody>
        {immutable ? (
          <ImmutableBanner role="note">
            <Lock aria-hidden="true" size={16} />
            <span>이 리비전은 고정되어 변경할 수 없습니다. 변경하려면 새 리비전을 생성하세요.</span>
          </ImmutableBanner>
        ) : null}
        <KeyValue>
          <dt>샘플</dt>
          <dd>{activeRevision.sample_count}</dd>
          <dt>정답 엔티티</dt>
          <dd>{activeRevision.gold_entity_count}</dd>
          <dt>정답 관계</dt>
          <dd>{activeRevision.gold_relation_count}</dd>
          <dt>정답 근거</dt>
          <dd>{activeRevision.gold_evidence_count}</dd>
          <dt>고정 실행 수</dt>
          <dd>{activeRevision.pinned_run_count}</dd>
          <dt>온톨로지 버전</dt>
          <dd>{ontologyVersionId ?? activeRevision.ontology_version_id ?? "미지정"}</dd>
          <dt>소유자</dt>
          <dd>{ownerId ?? "미지정"}</dd>
        </KeyValue>
      </CardBody>
    </HanaCard>
  );
}

function GoldItemSection({
  goldEntities,
  goldRelations,
  evidence,
  canEdit,
  canArchive,
  immutable,
  isLoading,
  isError,
  onEditFirst,
  onArchiveEntity,
  onRestoreEntity,
  onArchiveRelation,
  onRestoreRelation,
}: {
  goldEntities: GoldEntity[];
  goldRelations: GoldRelation[];
  evidence: GoldEvidence[];
  canEdit: boolean;
  canArchive: boolean;
  immutable: boolean;
  isLoading: boolean;
  isError: boolean;
  onEditFirst: () => void;
  onArchiveEntity: (entity: GoldEntity & { status?: GoldItemStatus }) => void;
  onRestoreEntity: (entity: GoldEntity & { status?: GoldItemStatus }) => void;
  onArchiveRelation: (relation: GoldRelation & { status?: GoldItemStatus }) => void;
  onRestoreRelation: (relation: GoldRelation & { status?: GoldItemStatus }) => void;
}) {
  if (isLoading) {
    return <PageState kind="loading" title="정답 항목을 불러오는 중입니다" description="엔티티·관계·근거를 준비하고 있습니다." />;
  }
  if (isError) {
    return <PageState kind="error" title="정답 항목을 불러오지 못했습니다" description="데이터셋 컨텍스트에서 다시 시도하세요." />;
  }
  if (goldEntities.length === 0 && goldRelations.length === 0) {
    return (
      <PageState
        kind="empty"
        title="이 데이터셋에는 아직 정답 항목이 없습니다."
        description="MVP6.1 Evaluation 화면에서 샘플과 정답 항목을 먼저 추가하세요."
      />
    );
  }

  return (
    <HanaCard
      title="정답 항목"
      description="엔티티 · 관계 · 근거 (편집·보관은 소유 전문가만)"
      emphasis="default"
      action={
        <HanaButton type="button" onClick={onEditFirst} disabled={!canEdit}>
          <PencilLine aria-hidden="true" size={16} /> 편집
        </HanaButton>
      }
    >
      <CardBody>
        <SubLabel>정답 엔티티</SubLabel>
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>상태</th>
                <th>레이블</th>
                <th>클래스</th>
                <th>근거</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {goldEntities.map((entity) => {
                const status = (entity as { status?: GoldItemStatus }).status ?? "ACTIVE";
                return (
                  <tr key={entity.id}>
                    <td><StatusBadge token={status} /></td>
                    <td>{entity.label}</td>
                    <td>{entity.ontology_class_id}</td>
                    <td>{evidenceLabel(entity.evidence)}</td>
                    <td>
                      <GoldItemActions
                        status={status}
                        canArchive={canArchive}
                        immutable={immutable}
                        onArchive={() => onArchiveEntity(entity)}
                        onRestore={() => onRestoreEntity(entity)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CompactTable>

        <SubLabel>정답 관계</SubLabel>
        <CompactTable>
          <table>
            <thead>
              <tr>
                <th>상태</th>
                <th>관계</th>
                <th>방향</th>
                <th>근거</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {goldRelations.map((relation) => {
                const status = (relation as { status?: GoldItemStatus }).status ?? "ACTIVE";
                return (
                  <tr key={relation.id}>
                    <td><StatusBadge token={status} /></td>
                    <td>{relation.ontology_relation_id}</td>
                    <td>{relation.source_gold_entity_id} → {relation.target_gold_entity_id}</td>
                    <td>{evidenceLabel(relation.evidence)}</td>
                    <td>
                      <GoldItemActions
                        status={status}
                        canArchive={canArchive}
                        immutable={immutable}
                        onArchive={() => onArchiveRelation(relation)}
                        onRestore={() => onRestoreRelation(relation)}
                      />
                    </td>
                  </tr>
                );
              })}
              {goldRelations.length === 0 ? (
                <tr><td colSpan={5}>정답 관계가 없습니다.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CompactTable>

        <SubLabel>독립 정답 근거 (Gold Evidence)</SubLabel>
        {evidence.length === 0 ? (
          <Muted>독립 근거 객체가 아직 없습니다. 정답 항목의 내장 근거는 위 표에 함께 표시됩니다.</Muted>
        ) : (
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>상태</th>
                  <th>인용</th>
                  <th>로케이터</th>
                  <th>대상 항목</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((item) => (
                  <tr key={item.id}>
                    <td><StatusBadge token={item.status} /></td>
                    <td>{item.quote ?? "인용 없음"}</td>
                    <td>{item.locator ?? item.source_segment_id ?? "—"}</td>
                    <td>{item.gold_entity_id ?? item.gold_relation_id ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        )}
      </CardBody>
    </HanaCard>
  );
}

function GoldItemActions({
  status,
  canArchive,
  immutable,
  onArchive,
  onRestore,
}: {
  status: GoldItemStatus;
  canArchive: boolean;
  immutable: boolean;
  onArchive: () => void;
  onRestore: () => void;
}) {
  if (immutable) {
    return <Muted as="span">읽기 전용</Muted>;
  }
  if (status === "ARCHIVED") {
    return (
      <HanaButton type="button" onClick={onRestore} disabled={!canArchive}>
        <RotateCcw aria-hidden="true" size={14} /> 복원
      </HanaButton>
    );
  }
  return (
    <HanaButton type="button" onClick={onArchive} disabled={!canArchive}>
      <Archive aria-hidden="true" size={14} /> 보관
    </HanaButton>
  );
}

function RevisionListSection({
  revisions,
  activeVersionId,
  canActivate,
  canExport,
  isLoading,
  isError,
  onActivate,
  onExport,
}: {
  revisions: DatasetRevisionSummary[];
  activeVersionId: string | null;
  canActivate: boolean;
  canExport: boolean;
  isLoading: boolean;
  isError: boolean;
  onActivate: (revisionId: string) => void;
  onExport: (revisionId: string) => void;
}) {
  if (isLoading) {
    return <PageState kind="loading" title="리비전을 불러오는 중입니다" description="리비전 생애주기를 준비하고 있습니다." />;
  }
  if (isError) {
    return <PageState kind="error" title="리비전을 불러오지 못했습니다" description="다시 시도하세요." />;
  }
  if (revisions.length === 0) {
    return (
      <PageState
        kind="empty"
        title="아직 리비전이 없습니다."
        description="현재 샘플과 정답 항목으로 새 리비전을 생성하세요."
      />
    );
  }

  return (
    <HanaCard
      title="리비전"
      description="DRAFT / ACTIVE / FROZEN / ARCHIVED — 데이터셋당 ACTIVE는 1개"
      emphasis="default"
    >
      <CompactTable>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>상태</th>
              <th>고정 사유</th>
              <th>고정 실행</th>
              <th>생성</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((revision) => {
              const immutable = revision.is_immutable;
              return (
                <tr key={revision.id}>
                  <td>#{revision.revision_number}</td>
                  <td>
                    <StatusBadge token={revision.status} />
                    {revision.id === activeVersionId ? <ActiveTag>현재 활성</ActiveTag> : null}
                  </td>
                  <td>{revision.frozen_reason ? <StatusBadge token={revision.frozen_reason === "PINNED_BY_RUN" ? "WARNING" : "INFO"} koLabel={revision.frozen_reason === "PINNED_BY_RUN" ? "실행이 고정" : "새 리비전 활성화"} /> : "—"}</td>
                  <td>{revision.pinned_run_count}</td>
                  <td>{formatDate(revision.created_at)}</td>
                  <td>
                    <RowActions>
                      {revision.status === "DRAFT" ? (
                        <HanaButton type="button" onClick={() => onActivate(revision.id)} disabled={!canActivate}>
                          활성화
                        </HanaButton>
                      ) : null}
                      <HanaButton type="button" onClick={() => onExport(revision.id)} disabled={!canExport}>
                        <Download aria-hidden="true" size={14} /> 내보내기
                      </HanaButton>
                      {immutable ? <Muted as="span">읽기 전용</Muted> : null}
                    </RowActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CompactTable>
    </HanaCard>
  );
}

function RunPinSection({
  pinnedRuns,
  runsById,
  isLoading,
}: {
  pinnedRuns: RunRevisionPin[];
  runsById: Map<string, EvaluationRun>;
  isLoading: boolean;
}) {
  return (
    <HanaCard title="실행 → 리비전 고정" description="재현성: 정답 편집·리비전 생성·보관·가져오기는 기존 실행을 변경하지 않습니다" emphasis="default">
      <CardBody>
        <Muted>
          정답 항목 편집·리비전 생성·보관·가져오기는 기존 실행의 지표나 고정된 리비전을 변경하지 않습니다.
        </Muted>
        {isLoading ? (
          <Muted>실행 고정 정보를 불러오는 중입니다.</Muted>
        ) : pinnedRuns.length === 0 ? (
          <Muted>이 데이터셋을 사용한 평가 실행이 아직 없습니다.</Muted>
        ) : (
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>실행</th>
                  <th>고정된 리비전</th>
                  <th>리비전 상태</th>
                  <th>불변 기준</th>
                </tr>
              </thead>
              <tbody>
                {pinnedRuns.map((pin) => {
                  const run = runsById.get(pin.run_id);
                  return (
                    <tr key={pin.run_id}>
                      <td>{pin.run_id}{run ? ` · ${run.model_name ?? ""}` : ""}</td>
                      <td>{pin.dataset_version_id ?? "—"}</td>
                      <td>{pin.revision_status ? <StatusBadge token={pin.revision_status} /> : "—"}</td>
                      <td>
                        {pin.pin_immutable ? (
                          <StatusBadge token="FROZEN" koLabel="고정됨 — 기준이 바뀌지 않았습니다" />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CompactTable>
        )}
      </CardBody>
    </HanaCard>
  );
}

function ImportSection({
  canImport,
  report,
  strategy,
  ackWarnings,
  confirmDisabled,
  isDryRunning,
  onDryRun,
  onStrategyChange,
  onAckChange,
  onConfirm,
}: {
  canImport: boolean;
  report: GoldSetImportReport | null;
  strategy: GoldSetImportStrategy;
  ackWarnings: boolean;
  confirmDisabled: boolean;
  isDryRunning: boolean;
  onDryRun: (state: DatasetRevisionStatus) => void;
  onStrategyChange: (strategy: GoldSetImportStrategy) => void;
  onAckChange: (value: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <HanaCard
      title="가져오기 (Import)"
      description="드라이런 호환성 보고서를 먼저 확인한 뒤 전략을 선택해 확정합니다 — 자동 병합 없음"
      emphasis="default"
    >
      <CardBody>
        <Muted>
          드라이런은 아무것도 변경하지 않습니다. 확정 시 항상 새 데이터셋 또는 새 리비전을 생성하며, 고정된 리비전을 편집하지 않습니다.
        </Muted>
        <DryRunRail>
          <span>드라이런 상태 예시:</span>
          {(["COMPATIBLE", "WARNING", "CONFLICT", "INCOMPATIBLE"] as DatasetRevisionStatus[] | GoldSetImportCompatibility[]).map(
            (state) => (
              <HanaButton
                key={state}
                type="button"
                onClick={() => onDryRun(state as DatasetRevisionStatus)}
                disabled={!canImport || isDryRunning}
              >
                <FileJson aria-hidden="true" size={14} /> {state}
              </HanaButton>
            ),
          )}
        </DryRunRail>

        {report ? (
          <ImportReportPanel data-compat={report.compatibility}>
            <ReportHeader>
              <StatusBadge token={report.compatibility} tone={importStateToHana(report.compatibility)} />
              <strong>{report.import_id}</strong>
            </ReportHeader>
            <KeyValue>
              <dt>번들 소스 리비전</dt>
              <dd>{report.bundle_summary.source_revision_id ?? "—"}</dd>
              <dt>대상 온톨로지</dt>
              <dd>{report.target_ontology_version_id ?? "—"}</dd>
              <dt>샘플 / 엔티티 / 관계 / 근거</dt>
              <dd>
                {report.bundle_summary.sample_count} / {report.bundle_summary.gold_entity_count} /{" "}
                {report.bundle_summary.gold_relation_count} / {report.bundle_summary.gold_evidence_count}
              </dd>
            </KeyValue>

            <SubLabel>호환성 항목</SubLabel>
            <CompactTable>
              <table>
                <thead>
                  <tr>
                    <th>심각도</th>
                    <th>코드</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  {report.issues.map((issue, index) => (
                    <tr key={`${issue.code}-${index}`}>
                      <td><StatusBadge token={issue.severity} tone={importStateToHana(issue.severity)} /></td>
                      <td>{issue.code}</td>
                      <td>{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CompactTable>

            {report.blocking ? (
              <BlockedBanner role="alert">
                <Lock aria-hidden="true" size={16} />
                <span>
                  INCOMPATIBLE — 대상 온톨로지에 없는 클래스/관계를 참조합니다. 가져오기가 차단되며, 대상 온톨로지를 맞추거나 호환되는 번들을 선택해야 합니다.
                </span>
              </BlockedBanner>
            ) : (
              <ConfirmControls>
                <label>
                  전략
                  <select
                    value={strategy}
                    onChange={(event) => onStrategyChange(event.target.value as GoldSetImportStrategy)}
                  >
                    {report.allowed_strategies.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                {report.compatibility === "WARNING" ? (
                  <label>
                    <input type="checkbox" checked={ackWarnings} onChange={(event) => onAckChange(event.target.checked)} />
                    경고를 확인했습니다
                  </label>
                ) : null}
                {report.compatibility === "CONFLICT" ? (
                  <Muted as="span">id 충돌 — 자동 병합하지 않습니다. 전략을 명시적으로 선택하세요.</Muted>
                ) : null}
                <HanaButton type="button" variant="primary" onClick={onConfirm} disabled={confirmDisabled}>
                  가져오기 확정
                </HanaButton>
              </ConfirmControls>
            )}
          </ImportReportPanel>
        ) : (
          <Muted>가져올 번들을 선택해 드라이런을 실행하면 호환성 보고서가 표시됩니다.</Muted>
        )}
      </CardBody>
    </HanaCard>
  );
}

function AuditSection({ entries, isLoading }: { entries: GoldAuthoringAuditEntry[]; isLoading: boolean }) {
  return (
    <HanaCard title="작성 감사 로그" description="actor · action · 대상 · 변경 전/후 · 사유 · 시각" emphasis="default">
      <details>
        <summary>감사 로그 자세히 보기 ({entries.length})</summary>
        {isLoading ? (
          <CardBody><Muted>감사 로그를 불러오는 중입니다.</Muted></CardBody>
        ) : entries.length === 0 ? (
          <CardBody><Muted>아직 작성 감사 항목이 없습니다.</Muted></CardBody>
        ) : (
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>시각</th>
                  <th>액션</th>
                  <th>대상</th>
                  <th>사유</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.created_at)}</td>
                    <td><HanaBadge tone="neutral">{entry.action}</HanaBadge></td>
                    <td>{entry.target_kind} · {entry.target_id}</td>
                    <td>{entry.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        )}
      </details>
    </HanaCard>
  );
}

type GoldSetManagerActiveRevision = NonNullable<
  ReturnType<typeof useDatasetAuthoringOverview>["data"]
>["active_revision"];

function importStateToHana(state: GoldSetImportCompatibility) {
  return importStateTone[state];
}

function evidenceLabel(evidence?: GoldEvidenceRef | null) {
  if (!evidence) {
    return "근거 없음";
  }
  return [evidence.locator, evidence.quote].filter(Boolean).join(" · ") || "근거";
}

function formatDate(value: string) {
  return value.replace("T", " ").replace(/\..*$/, "");
}

const NoticeBand = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};
  color: ${({ theme }) => theme.color.text};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const PermissionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  &[data-tone="limited"] {
    background: ${({ theme }) => theme.color.surface};
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const ImmutableBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warning ?? theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const SubLabel = styled.h3`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
`;

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const ActiveTag = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.color.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const DryRunRail = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const ImportReportPanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
`;

const ReportHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  strong {
    overflow-wrap: anywhere;
  }
`;

const BlockedBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.danger};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.color.danger};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const ConfirmControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;

  label {
    display: inline-flex;
    gap: ${({ theme }) => theme.spacing.xs};
    align-items: center;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  select {
    min-height: 34px;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surfaceRaised};
    color: ${({ theme }) => theme.color.text};
  }
`;
