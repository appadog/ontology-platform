import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Factory, Info, Scale, ShieldCheck } from "lucide-react";
import styled from "styled-components";
import { OntologyPackError } from "../shared/api/client";
import {
  useOntologyPackCatalog,
  useOntologyPackDetail,
  useProject,
  useRunOntologyPackApplyPreview,
} from "../shared/api/queries";
import {
  OntologyPackCatalogItem,
  OntologyPackDetailResponse,
  OntologyPackMutationGuard,
  PackApplyPreviewResponse,
  PackElementDescriptor,
  PackElementKind,
  PackPreviewItem,
  PackPreviewNotice,
} from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CardBody, KeyValue, Muted, Stack } from "./mvp3Shared";

// MVP6.11 Ontology Packs (FE6-100..103). READ-ONLY pack catalog + deterministic
// DRY-RUN apply-preview. The surface INSTALLS NOTHING, APPLIES NOTHING, WRITES
// NOTHING: there is NO install / apply / execute / confirm-and-apply / add-to-draft
// / "설치" / "적용" affordance anywhere. The only actionable button is "적용
// 미리보기 실행" (dry-run apply-preview). Preview items are WOULD-BE DRAFT-layer
// items; preview_ref is opaque (not a created ontology element id); target_layer is
// always DRAFT (never candidate, never published); mapped_ontology_ref is null for
// NEW. Every response carries an all-false 8-flag OntologyPackMutationGuard,
// rendered as a live proof line read FROM the response (never hardcoded).

const GUARD_FLAGS: (keyof OntologyPackMutationGuard)[] = [
  "pack_installed",
  "ontology_draft_mutated",
  "ontology_class_created",
  "ontology_property_created",
  "ontology_relation_created",
  "candidate_graph_mutated",
  "published_graph_mutated",
  "change_request_created",
];

/** All-false invariant: MVP6.11 turns NO flag true, ever. */
function guardAllFalse(guard: OntologyPackMutationGuard): boolean {
  return GUARD_FLAGS.every((flag) => guard[flag] === false);
}

const ELEMENT_KIND_ORDER: PackElementKind[] = ["CLASS", "PROPERTY", "RELATION"];

const elementKindKo: Record<PackElementKind, string> = {
  CLASS: "클래스",
  PROPERTY: "속성",
  RELATION: "관계",
};

const domainKo: Record<string, string> = {
  insurance: "보험",
  manufacturing: "제조",
  legal: "법률/규정",
};

const domainIcon: Record<string, typeof ShieldCheck> = {
  insurance: ShieldCheck,
  manufacturing: Factory,
  legal: Scale,
};

function DomainChip({ domain }: { domain: string }) {
  const Icon = domainIcon[domain] ?? Info;
  const ko = domainKo[domain] ?? domain;
  return (
    <HanaBadge tone="progress">
      <ChipIcon>
        <Icon aria-hidden="true" size={12} />
      </ChipIcon>
      {domain} · {ko}
    </HanaBadge>
  );
}

export function OntologyPacksPage() {
  const { projectId = "", packId } = useParams();
  const projectQuery = useProject(projectId);
  const catalogQuery = useOntologyPackCatalog();

  // The live guard is read FROM the response (never hardcoded). Any true flag ->
  // guard-violation state. This can never happen in P0; the guard is live evidence.
  const liveGuard = catalogQuery.data?.mutation_guard ?? null;
  const guardViolation = liveGuard ? !guardAllFalse(liveGuard) : false;

  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="온톨로지 팩을 불러오는 중" description="팩 카탈로그를 준비하고 있습니다." />;
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="프로젝트 컨텍스트를 사용할 수 없음" description="온톨로지 팩은 선택된 유효한 프로젝트가 필요합니다." />;
  }

  const projectName = projectQuery.data.name;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectName, to: `/projects/${projectId}` },
          packId
            ? { label: "Ontology Packs", to: `/projects/${projectId}/ontology-packs` }
            : { label: "Ontology Packs" },
          ...(packId ? [{ label: "팩 상세" }] : []),
        ]}
      />
      <PageHeader
        title="온톨로지 팩"
        description={`${projectName} · 읽기 전용 카탈로그 · dry-run 적용 미리보기 전용`}
        eyebrow="ONTOLOGY PACKS · 미리보기 전용 (설치/적용 없음)"
      >
        <PageActions>
          <HanaBadge tone="neutral">MVP6.11</HanaBadge>
          <HanaBadge tone="warning">Preview-only · 읽기 전용</HanaBadge>
        </PageActions>
      </PageHeader>

      {/* Safety spine: persistent preview-only banner + boundary chips. */}
      <BoundaryBanner role="note">
        <Info aria-hidden="true" size={18} />
        <div>
          <strong>온톨로지 팩은 미리보기 전용입니다. 아무것도 설치하거나 적용하지 않습니다.</strong>
          <p>
            카탈로그 조회와 dry-run 적용 미리보기만 제공합니다. 팩은 이 프로젝트의 현재 DRAFT 온톨로지와 read-only로
            비교만 하며, DRAFT나 게시 그래프를 만들거나 변경하지 않습니다. 실제 적용은 이후 기존 MVP1 온톨로지 편집 /
            MVP6.6 거버넌스 적용(DRAFT 전용, 사람이 직접 시작) 경로를 거칩니다.
          </p>
          <ChipRow>
            <HanaBadge tone="warning">PREVIEW_ONLY · 미리보기 전용</HanaBadge>
            <HanaBadge tone="progress">NOTHING_INSTALLED · 설치 없음</HanaBadge>
            <HanaBadge tone="progress">NOTHING_APPLIED · 적용 없음</HanaBadge>
            <HanaBadge tone="progress">NO_DRAFT_WRITE · DRAFT 변경 없음</HanaBadge>
            <HanaBadge tone="progress">NO_PUBLISHED_WRITE · 게시 변경 없음</HanaBadge>
          </ChipRow>
        </div>
      </BoundaryBanner>

      {liveGuard ? (
        guardViolation ? (
          <ErrorRow role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>예상치 못한 상태: mutation 플래그가 감지되었습니다. 이는 결함이며 적용 미리보기가 비활성화됩니다.</span>
          </ErrorRow>
        ) : (
          <GuardProof guard={liveGuard} />
        )
      ) : null}

      {packId ? (
        <PackDetail projectId={projectId} packId={packId} guardViolation={guardViolation} />
      ) : (
        <PackCatalog projectId={projectId} catalogQuery={catalogQuery} />
      )}
    </>
  );
}

// ---- Catalog (3 OntologyPack cards; no install/apply affordance) ----

function PackCatalog({
  projectId,
  catalogQuery,
}: {
  projectId: string;
  catalogQuery: ReturnType<typeof useOntologyPackCatalog>;
}) {
  const navigate = useNavigate();

  if (catalogQuery.isLoading) {
    return (
      <SkeletonGrid aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </SkeletonGrid>
    );
  }
  if (catalogQuery.isError) {
    const err = catalogQuery.error;
    if (err instanceof OntologyPackError && err.status === 403) {
      return (
        <PageState
          kind="permission"
          title="권한이 제한되어 있습니다"
          description="이 프로젝트를 볼 수 있는 구성원만 온톨로지 팩 카탈로그를 조회할 수 있습니다."
        />
      );
    }
    return (
      <PageState
        kind="error"
        title="팩 카탈로그를 불러오지 못했습니다"
        description="서비스에서 오류가 반환되었습니다. 이 화면은 아무것도 변경하지 않으므로 안전하게 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => void catalogQuery.refetch()}
      />
    );
  }

  const items = catalogQuery.data?.items ?? [];
  if (items.length === 0) {
    return <PageState kind="empty" title="등록된 온톨로지 팩 없음" description="미리보기할 수 있는 온톨로지 팩이 없습니다." />;
  }

  return (
    <Stack>
      <MarkerRow>
        <HanaBadge tone="neutral">DETERMINISTIC_MOCK · 실제 설치 아님</HanaBadge>
        <Muted as="span">총 {catalogQuery.data?.total_count ?? items.length}개 · 미리보기 전용</Muted>
      </MarkerRow>
      <CatalogGrid>
        {items.map((item) => (
          <CatalogCard
            key={item.pack_id}
            item={item}
            onOpen={() => navigate(`/projects/${projectId}/ontology-packs/${item.pack_id}`)}
          />
        ))}
      </CatalogGrid>
    </Stack>
  );
}

function CatalogCard({ item, onOpen }: { item: OntologyPackCatalogItem; onOpen: () => void }) {
  const c = item.element_counts;
  return (
    // Wave 65 (PM6-042 follow-up): whole-card click (hover lift + keyboard),
    // matching the card-list feel already applied to Projects/Review. The
    // nested button keeps its own independent onClick (stopping propagation
    // so it doesn't double-fire the same navigate through the card handler).
    <HanaCard title={item.name} eyebrow={`${item.pack_id}`} emphasis="default" onClick={onOpen}>
      <CardBody>
        <BadgeRow>
          <DomainChip domain={item.domain} />
          <HanaBadge tone="neutral">v{item.version}</HanaBadge>
          {item.mock ? <HanaBadge tone="neutral">MOCK</HanaBadge> : null}
        </BadgeRow>
        <Muted>{item.description}</Muted>
        <CountRow>
          클래스 {c.class_count} · 속성 {c.property_count} · 관계 {c.relation_count} · 총 {c.element_count}
        </CountRow>
        <CardActions>
          <HanaButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            상세 보기 <ArrowRight aria-hidden="true" size={14} />
          </HanaButton>
        </CardActions>
      </CardBody>
    </HanaCard>
  );
}

// ---- Detail: metadata + grouped bundled elements + dry-run apply-preview ----

function PackDetail({
  projectId,
  packId,
  guardViolation,
}: {
  projectId: string;
  packId: string;
  guardViolation: boolean;
}) {
  const detailQuery = useOntologyPackDetail(packId);
  const previewMutation = useRunOntologyPackApplyPreview(projectId, packId);
  const [itemCap, setItemCap] = useState(50);

  const backLink = `/projects/${projectId}/ontology-packs`;

  if (detailQuery.isLoading) {
    return (
      <>
        <BackRow>
          <Link to={backLink}>
            <ArrowLeft aria-hidden="true" size={14} /> 카탈로그로 돌아가기
          </Link>
        </BackRow>
        <SkeletonCard style={{ height: 220 }} aria-hidden="true" />
      </>
    );
  }
  if (detailQuery.isError) {
    const err = detailQuery.error;
    if (err instanceof OntologyPackError && err.status === 403) {
      return <PageState kind="permission" title="권한이 제한되어 있습니다" description="이 프로젝트를 볼 수 있는 구성원만 팩 상세를 조회할 수 있습니다." />;
    }
    if (err instanceof OntologyPackError && err.status === 404) {
      return <PageState kind="error" title="알 수 없는 온톨로지 팩" description="요청한 팩을 찾을 수 없습니다." actionLabel="카탈로그로" onAction={() => void detailQuery.refetch()} />;
    }
    return (
      <PageState
        kind="error"
        title="팩 상세를 불러오지 못했습니다"
        description="서비스에서 오류가 반환되었습니다. 안전하게 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => void detailQuery.refetch()}
      />
    );
  }

  const detail = detailQuery.data!;

  const runPreview = () => {
    if (guardViolation) return;
    previewMutation.mutate({ item_cap: itemCap });
  };

  const preview = previewMutation.data ?? null;

  return (
    <>
      <BackRow>
        <Link to={backLink}>
          <ArrowLeft aria-hidden="true" size={14} /> 카탈로그로 돌아가기
        </Link>
      </BackRow>

      <DetailGrid>
        <PackMetadataCard detail={detail} />

        <div>
          <HanaCard title="적용 미리보기 (dry-run)" eyebrow="APPLY-PREVIEW · 적용 없음" emphasis="default">
            <CardBody>
              <Muted>
                이 팩의 요소를 현재 DRAFT 온톨로지와 read-only로 비교합니다. 아무것도 적용/설치하지 않으며, DRAFT나
                게시 그래프를 만들거나 변경하지 않습니다.
              </Muted>
              <CapRow>
                <label htmlFor="pack-item-cap">
                  <span>표시 개수 상한 (item_cap · 최대 50)</span>
                  <HanaInput
                    id="pack-item-cap"
                    type="number"
                    min={1}
                    max={50}
                    value={itemCap}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setItemCap(Number.isFinite(n) ? Math.max(1, Math.min(50, Math.trunc(n))) : 50);
                    }}
                  />
                </label>
              </CapRow>
              <FormActions>
                <HanaButton type="button" onClick={runPreview} disabled={guardViolation || previewMutation.isPending}>
                  {previewMutation.isPending ? "미리보기 계산 중…" : "적용 미리보기 실행"}
                </HanaButton>
                <Muted as="span">적용/설치/실행 없음 — 읽기 전용 dry-run 계산</Muted>
              </FormActions>
            </CardBody>
          </HanaCard>

          {previewMutation.isError ? (
            <ErrorRow role="alert">
              <AlertTriangle aria-hidden="true" size={16} />
              <span>
                {previewMutation.error instanceof OntologyPackError
                  ? previewMutation.error.message
                  : "적용 미리보기를 계산하지 못했습니다. 아무것도 변경되지 않았으므로 다시 시도할 수 있습니다."}
              </span>
            </ErrorRow>
          ) : null}

          {previewMutation.isPending ? (
            <SkeletonCard style={{ height: 200, marginTop: 16 }} aria-hidden="true" />
          ) : preview ? (
            <PreviewResult preview={preview} projectId={projectId} />
          ) : (
            <PlaceholderCard>
              <Muted>
                "적용 미리보기 실행"을 누르면 이 팩이 현재 DRAFT 온톨로지에 추가/수정할 would-be 항목이 여기에
                표시됩니다. 아무것도 적용하지 않습니다.
              </Muted>
            </PlaceholderCard>
          )}
        </div>
      </DetailGrid>
    </>
  );
}

function PackMetadataCard({ detail }: { detail: OntologyPackDetailResponse }) {
  return (
    <HanaCard title={detail.name} eyebrow={detail.pack_id} emphasis="default">
      <CardBody>
        <BadgeRow>
          <DomainChip domain={detail.domain} />
          <HanaBadge tone="neutral">v{detail.version}</HanaBadge>
          {detail.mock ? <HanaBadge tone="neutral">MOCK</HanaBadge> : null}
        </BadgeRow>
        <Muted>{detail.description}</Muted>
        <CountRow>
          클래스 {detail.element_counts.class_count} · 속성 {detail.element_counts.property_count} · 관계{" "}
          {detail.element_counts.relation_count} · 총 {detail.element_counts.element_count}
        </CountRow>
        <Muted as="p" style={{ marginTop: 12 }}>
          아래는 실제 적용 시 이 팩이 기여할 <strong>would-be</strong> 요소 목록입니다 (생성된 온톨로지 행이 아님).
        </Muted>
        {ELEMENT_KIND_ORDER.map((kind) => {
          const group = detail.elements.filter((e) => e.element_kind === kind);
          return <ElementGroup key={kind} kind={kind} elements={group} />;
        })}
      </CardBody>
    </HanaCard>
  );
}

function ElementGroup({ kind, elements }: { kind: PackElementKind; elements: PackElementDescriptor[] }) {
  return (
    <GroupBlock>
      <GroupHead>
        <StatusBadge token={kind} koLabel={elementKindKo[kind]} />
        <Muted as="span">{elements.length}개</Muted>
      </GroupHead>
      {elements.length === 0 ? (
        <Muted>이 그룹에 요소가 없습니다.</Muted>
      ) : (
        <ElementList>
          {elements.map((el) => (
            <ElementRow key={el.element_key}>
              <div>
                <strong>{el.label}</strong>
                {el.description ? <ElementDesc>{el.description}</ElementDesc> : null}
              </div>
              <code>{el.element_key}</code>
            </ElementRow>
          ))}
        </ElementList>
      )}
    </GroupBlock>
  );
}

// ---- Preview result ----

function PreviewResult({ preview, projectId }: { preview: PackApplyPreviewResponse; projectId: string }) {
  const blocked = preview.status === "BLOCKED";
  return (
    <Stack style={{ marginTop: 16 }}>
      <HanaCard title="적용 미리보기 결과 (dry-run)" eyebrow="PREVIEW RESULT · 적용 없음" emphasis="default">
        <CardBody>
          <BadgeRow>
            <StatusBadge token={preview.status} />
            <StatusBadge token={preview.compatibility} />
            <StatusBadge token={preview.target_layer} koLabel="DRAFT 레이어" />
            <HanaBadge tone="progress">preview_only: {String(preview.preview_only)}</HanaBadge>
            <HanaBadge tone="neutral">v{preview.pack_version}</HanaBadge>
          </BadgeRow>
          <Muted as="span">생성 시각: {preview.generated_at}</Muted>

          <Summary>
            <MetricCard label="추가 예정 (NEW)" value={String(preview.summary.would_add_count)} />
            <MetricCard label="수정 예정 (CONFLICT)" value={String(preview.summary.would_modify_count)} />
            <MetricCard label="충돌 (conflict)" value={String(preview.summary.conflict_count)} />
            <MetricCard label="중복 (duplicate)" value={String(preview.summary.duplicate_count)} />
            <MetricCard label="총 요소" value={String(preview.summary.total_element_count)} />
          </Summary>

          {preview.truncated ? (
            <TruncationNote>
              <StatusBadge token="WARNING" koLabel="일부만 표시" />
              <span>
                상위 {preview.item_cap}개 표시 · 전체 {preview.total_item_count}개 (카운트는 항상 정확하며 목록만 상한 적용)
              </span>
            </TruncationNote>
          ) : null}

          {preview.warnings.length > 0 ? <NoticeList notices={preview.warnings} tone="warning" heading="경고" /> : null}
          {blocked ? <NoticeList notices={preview.blocked_reasons} tone="danger" heading="차단 사유" /> : null}
        </CardBody>
      </HanaCard>

      {blocked ? (
        <PlaceholderCard>
          <Muted>
            이 팩을 현재 프로젝트의 DRAFT 온톨로지와 비교할 수 없습니다 (차단됨 · 비호환). DRAFT 온톨로지가 없다면{" "}
            <Link to={`/projects/${projectId}/ontology`}>온톨로지 모델러</Link>에서 DRAFT를 먼저 시작한 뒤 다시
            미리보기를 실행하세요. 아무것도 적용하거나 변경하지 않았습니다.
          </Muted>
        </PlaceholderCard>
      ) : preview.items.length === 0 ? (
        <PlaceholderCard>
          <Muted>이 팩은 현재 DRAFT 온톨로지에 추가/수정할 요소가 없습니다. 적용이 일어나지 않았습니다.</Muted>
        </PlaceholderCard>
      ) : (
        <HanaCard
          title="would-add / would-modify 항목"
          description="생성된 행이 아니라, 실제 적용 시 DRAFT 레이어에 추가/수정될 예상 항목입니다."
          eyebrow="WOULD-BE DRAFT ITEMS"
          emphasis="default"
        >
          <CardBody>
            <ItemList>
              {preview.items.map((item) => (
                <PreviewItemRow key={item.preview_ref} item={item} projectId={projectId} />
              ))}
            </ItemList>
          </CardBody>
        </HanaCard>
      )}

      <RoutingNote>{preview.routing_note}</RoutingNote>
      <RoutingNoteKo>
        미리보기 전용입니다 — 아무것도 적용되지 않았습니다. 실제 적용은 기존 MVP1 온톨로지 편집 / MVP6.6 거버넌스
        적용(DRAFT 전용, 사람이 직접 시작) 경로를 거칩니다.
      </RoutingNoteKo>

      <GuardProof guard={preview.mutation_guard} compact />
    </Stack>
  );
}

function PreviewItemRow({ item, projectId }: { item: PackPreviewItem; projectId: string }) {
  const ref = item.mapped_ontology_ref ?? null;
  const refId = ref
    ? ref.ontology_class_id ?? ref.ontology_property_id ?? ref.ontology_relation_id ?? null
    : null;
  return (
    <ItemCard>
      <ItemHead>
        <strong>{item.pack_element_label}</strong>
        <StatusBadge token={item.disposition} />
        <StatusBadge token={item.element_kind} koLabel={elementKindKo[item.element_kind]} />
        <StatusBadge token={item.target_layer} koLabel="DRAFT 레이어" />
      </ItemHead>
      <KeyValue>
        <dt>미리보기 참조</dt>
        <dd>
          <code>{item.preview_ref}</code> <Muted as="span">— 생성된 온톨로지 요소 ID 아님</Muted>
        </dd>
        <dt>매핑 DRAFT 요소</dt>
        <dd>
          {ref ? (
            <Link to={`/projects/${projectId}/ontology`}>
              <HanaBadge tone="progress">
                {ref.target_kind} · {refId ?? item.existing_element_label ?? "기존 DRAFT 요소"}
              </HanaBadge>
            </Link>
          ) : (
            <HanaBadge tone="warning">신규 — 대응 DRAFT 요소 없음 (미매핑)</HanaBadge>
          )}
        </dd>
        {item.existing_element_label ? (
          <>
            <dt>기존 DRAFT 요소</dt>
            <dd>
              {item.existing_element_label}
              {item.disposition === "CONFLICT" ? (
                <Muted as="span"> · 정의 상이 — 사람 해소 필요</Muted>
              ) : item.disposition === "DUPLICATE" ? (
                <Muted as="span"> · 이미 존재 — 적용 시 no-op</Muted>
              ) : null}
            </dd>
          </>
        ) : null}
        {item.note ? (
          <>
            <dt>메모</dt>
            <dd>{item.note}</dd>
          </>
        ) : null}
      </KeyValue>
    </ItemCard>
  );
}

function NoticeList({
  notices,
  tone,
  heading,
}: {
  notices: PackPreviewNotice[];
  tone: "warning" | "danger";
  heading: string;
}) {
  return (
    <NoticeBlock>
      <DimTitle>{heading}</DimTitle>
      {notices.map((n, i) => (
        <NoticeItem key={`${n.code}-${i}`}>
          <StatusBadge token={n.code} tone={tone} koLabel="" />
          <span>{n.message}</span>
        </NoticeItem>
      ))}
    </NoticeBlock>
  );
}

// ---- Guard proof line (reads flags FROM the response, never hardcoded) ----

function GuardProof({ guard, compact }: { guard: OntologyPackMutationGuard; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <ProofBlock data-compact={compact ? "true" : "false"}>
      <ProofHead type="button" onClick={() => setOpen((v) => !v)}>
        <ShieldCheck aria-hidden="true" size={14} />
        <span>이 응답은 아무것도 설치/적용/변경하지 않았습니다 — 8개 mutation 플래그 모두 false</span>
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

const PageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ChipIcon = styled.span`
  display: inline-flex;
  margin-right: 4px;
`;

const BoundaryBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  margin: ${({ theme }) => theme.spacing.md} 0;
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

const MarkerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CatalogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonCard = styled.div`
  min-height: 200px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CountRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.color.textMuted};
  overflow-wrap: anywhere;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const BackRow = styled.div`
  margin: ${({ theme }) => theme.spacing.sm} 0 ${({ theme }) => theme.spacing.md};

  a {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};
    color: ${({ theme }) => theme.color.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 460px) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const GroupBlock = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const GroupHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ElementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ElementRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: baseline;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  strong {
    overflow-wrap: anywhere;
  }

  code {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    overflow-wrap: anywhere;
  }

  > div {
    min-width: 0;
  }
`;

const ElementDesc = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  overflow-wrap: anywhere;
`;

const CapRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};

  label {
    display: grid;
    gap: ${({ theme }) => theme.spacing.xs};
    max-width: 260px;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PlaceholderCard = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px dashed ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const TruncationNote = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warning};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const NoticeBlock = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const NoticeItem = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const DimTitle = styled.div`
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ItemCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  code {
    overflow-wrap: anywhere;
  }
`;

const ItemHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  strong {
    overflow-wrap: anywhere;
  }
`;

const RoutingNote = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-left: 3px solid ${({ theme }) => theme.color.primary};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  overflow-wrap: anywhere;
`;

const RoutingNoteKo = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;
`;

const ErrorRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin: ${({ theme }) => theme.spacing.sm} 0;
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
  margin: ${({ theme }) => theme.spacing.sm} 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};

  &[data-compact="true"] {
    background: transparent;
  }
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
