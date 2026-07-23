import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Info,
  ShieldCheck,
} from "lucide-react";
import styled from "styled-components";
import { ConnectorError } from "../shared/api/client";
import {
  useConnectorCatalog,
  useConnectorConfigSchema,
  useProject,
  useRunConnectorImportPreview,
} from "../shared/api/queries";
import {
  ConnectorCatalogItem,
  ConnectorConfigField,
  ConnectorImportPreviewResponse,
  ConnectorKind,
  ConnectorMutationGuard,
  ConnectorPreviewItem,
  ConnectorPreviewNotice,
} from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CardBody, KeyValue, Muted, Stack } from "./mvp3Shared";

// MVP6.9 Connectors (FE6-090..093). READ-ONLY catalog + deterministic DRY-RUN
// import preview. The surface CONNECTS TO NOTHING, IMPORTS NOTHING, WRITES
// NOTHING: there is NO connect / import / sync / apply / execute / confirm-and-
// ingest affordance anywhere. The only actionable button is "미리보기 실행" (dry-run
// preview). SECRET fields are masked and never required in P0; no raw secret is
// entered, echoed, persisted, or exported. Preview items are WOULD-BE candidate-
// layer items; preview_ref is opaque (not a candidate id); target_layer is always
// CANDIDATE. Every response carries an all-false 9-flag ConnectorMutationGuard,
// rendered as a live proof line read FROM the response (never hardcoded).

const GUARD_FLAGS: (keyof ConnectorMutationGuard)[] = [
  "external_system_read",
  "external_system_write",
  "real_network_call_made",
  "credential_persisted",
  "connector_instance_persisted",
  "source_created",
  "candidate_graph_mutated",
  "published_graph_mutated",
  "extraction_job_started",
];

/** All-false invariant: MVP6.9 turns NO flag true, ever. */
function guardAllFalse(guard: ConnectorMutationGuard): boolean {
  return GUARD_FLAGS.every((flag) => guard[flag] === false);
}

const CONNECTOR_KINDS: ConnectorKind[] = ["FILE_SOURCE", "REST_SOURCE", "KNOWLEDGE_BASE_SOURCE"];

const kindKo: Record<ConnectorKind, string> = {
  FILE_SOURCE: "파일 소스",
  REST_SOURCE: "REST API 소스",
  KNOWLEDGE_BASE_SOURCE: "지식베이스 소스",
};

function isConnectorKind(value: string | undefined): value is ConnectorKind {
  return value !== undefined && (CONNECTOR_KINDS as string[]).includes(value);
}

type FormValue = string | boolean;

/** Build the initial (non-secret placeholder) form values for a config schema. */
function initialFormValues(fields: ConnectorConfigField[]): Record<string, FormValue> {
  const values: Record<string, FormValue> = {};
  for (const field of fields) {
    if (field.field_kind === "BOOLEAN") {
      values[field.name] = false;
    } else if (field.field_kind === "ENUM") {
      values[field.name] = field.enum_values?.[0] ?? "";
    } else {
      // STRING / URL / INTEGER / SECRET: seed with the non-secret placeholder so
      // the preview is runnable without the user typing anything (and, for SECRET,
      // WITHOUT entering any real secret — the placeholder is non-secret).
      values[field.name] = field.placeholder ?? "";
    }
  }
  return values;
}

export function ConnectorsPage() {
  const { projectId = "", connectorKind } = useParams();
  const projectQuery = useProject(projectId);
  const catalogQuery = useConnectorCatalog(projectId);

  const activeKind = isConnectorKind(connectorKind) ? connectorKind : null;

  // The live guard is read FROM the response (never hardcoded). Any true flag ->
  // guard-violation state. This can never happen in P0; the guard is live
  // evidence, not decorative copy.
  const liveGuard = catalogQuery.data?.mutation_guard ?? null;
  const guardViolation = liveGuard ? !guardAllFalse(liveGuard) : false;

  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="커넥터를 불러오는 중" description="프로젝트 커넥터 카탈로그를 준비하고 있습니다." />;
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="프로젝트 컨텍스트를 사용할 수 없음" description="커넥터는 선택된 유효한 프로젝트가 필요합니다." />;
  }

  const projectName = projectQuery.data.name;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectName, to: `/projects/${projectId}` },
          activeKind
            ? { label: "Connectors", to: `/projects/${projectId}/connectors` }
            : { label: "Connectors" },
          ...(activeKind ? [{ label: kindKo[activeKind] }] : []),
        ]}
      />
      <PageHeader
        title="커넥터"
        description={`${projectName} · 읽기 전용 카탈로그 · dry-run 미리보기 전용`}
        eyebrow="CONNECTORS · 미리보기 전용 (가져오기 없음)"
      >
        <PageActions>
          <HanaBadge tone="neutral">MVP6.9</HanaBadge>
          <HanaBadge tone="warning">Preview-only · 읽기 전용</HanaBadge>
        </PageActions>
      </PageHeader>

      {/* Safety spine: persistent preview-only banner + boundary chips. */}
      <BoundaryBanner role="note">
        <Info aria-hidden="true" size={18} />
        <div>
          <strong>커넥터는 미리보기 전용입니다. 아무것도 가져오거나 저장하지 않습니다.</strong>
          <p>
            카탈로그 조회와 dry-run 미리보기만 제공합니다. 외부 시스템에 연결하거나 네트워크를 호출하지 않고,
            비밀값을 저장하지 않으며, 후보/게시 그래프를 만들거나 변경하지 않습니다. 실제 가져오기는 이후 기존의
            추출 → 후보 → 검토 → 게시 게이트를 거칩니다.
          </p>
          <ChipRow>
            <HanaBadge tone="warning">PREVIEW_ONLY · 미리보기 전용</HanaBadge>
            <HanaBadge tone="progress">NO_EXTERNAL_CALL · 외부 호출 없음</HanaBadge>
            <HanaBadge tone="progress">NO_SECRET_STORED · 비밀값 저장 없음</HanaBadge>
            <HanaBadge tone="progress">NOTHING_IMPORTED · 가져오기 없음</HanaBadge>
          </ChipRow>
        </div>
      </BoundaryBanner>

      {liveGuard ? (
        guardViolation ? (
          <ErrorRow role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>예상치 못한 상태: mutation 플래그가 감지되었습니다. 이는 결함이며 미리보기가 비활성화됩니다.</span>
          </ErrorRow>
        ) : (
          <GuardProof guard={liveGuard} />
        )
      ) : null}

      {activeKind ? (
        <ConnectorDetail
          projectId={projectId}
          connectorKind={activeKind}
          guardViolation={guardViolation}
        />
      ) : (
        <ConnectorCatalog projectId={projectId} catalogQuery={catalogQuery} />
      )}
    </>
  );
}

// ---- Catalog (3 ConnectorKind cards; no add/register affordance) ----

function ConnectorCatalog({
  projectId,
  catalogQuery,
}: {
  projectId: string;
  catalogQuery: ReturnType<typeof useConnectorCatalog>;
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
    if (err instanceof ConnectorError && err.status === 403) {
      return (
        <PageState
          kind="permission"
          title="권한이 제한되어 있습니다"
          description="이 프로젝트를 볼 수 있는 구성원만 커넥터 카탈로그를 조회할 수 있습니다."
        />
      );
    }
    return (
      <PageState
        kind="error"
        title="커넥터 카탈로그를 불러오지 못했습니다"
        description="서비스에서 오류가 반환되었습니다. 이 화면은 아무것도 변경하지 않으므로 안전하게 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => void catalogQuery.refetch()}
      />
    );
  }

  const items = catalogQuery.data?.items ?? [];
  if (items.length === 0) {
    return <PageState kind="empty" title="등록된 커넥터 없음" description="이 프로젝트에서 미리보기할 수 있는 커넥터 종류가 없습니다." />;
  }

  return (
    <Stack>
      <MarkerRow>
        <HanaBadge tone="neutral">DETERMINISTIC_MOCK · 실제 연동 아님</HanaBadge>
        <Muted as="span">총 {catalogQuery.data?.total_count ?? items.length}종 · 미리보기 전용</Muted>
      </MarkerRow>
      <CatalogGrid>
        {items.map((item) => (
          <CatalogCard
            key={item.connector_kind}
            item={item}
            onOpen={() => navigate(`/projects/${projectId}/connectors/${item.connector_kind}`)}
          />
        ))}
      </CatalogGrid>
    </Stack>
  );
}

function CatalogCard({ item, onOpen }: { item: ConnectorCatalogItem; onOpen: () => void }) {
  return (
    // Wave 65 (PM6-042 follow-up): whole-card click (hover lift + keyboard),
    // matching the card-list feel already applied to Projects/Review. The
    // nested button keeps its own independent onClick (stopping propagation
    // so it doesn't double-fire the same navigate through the card handler).
    <HanaCard title={item.display_name} eyebrow={`${item.connector_kind} · ${kindKo[item.connector_kind]}`} emphasis="default" onClick={onOpen}>
      <CardBody>
        <BadgeRow>
          <StatusBadge token={item.connector_kind} koLabel={kindKo[item.connector_kind]} tone="muted" />
          <StatusBadge token={item.target_layer} />
          {item.mock ? <HanaBadge tone="neutral">MOCK</HanaBadge> : null}
        </BadgeRow>
        <Muted>{item.description}</Muted>
        <KeyValue>
          <dt>설정 항목</dt>
          <dd>{item.config_field_count}개</dd>
          <dt>비밀 항목</dt>
          <dd>
            {item.has_secret_fields ? (
              <HanaBadge tone="warning">SECRET 필드 있음 · 마스킹됨</HanaBadge>
            ) : (
              <HanaBadge tone="neutral">없음</HanaBadge>
            )}
          </dd>
        </KeyValue>
        <CardActions>
          <HanaButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            설정 및 미리보기 <ArrowRight aria-hidden="true" size={14} />
          </HanaButton>
        </CardActions>
      </CardBody>
    </HanaCard>
  );
}

// ---- Detail: masked config schema + config form + dry-run preview ----

function ConnectorDetail({
  projectId,
  connectorKind,
  guardViolation,
}: {
  projectId: string;
  connectorKind: ConnectorKind;
  guardViolation: boolean;
}) {
  const schemaQuery = useConnectorConfigSchema(projectId, connectorKind);
  const previewMutation = useRunConnectorImportPreview(projectId, connectorKind);
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [seeded, setSeeded] = useState(false);
  const [itemCap, setItemCap] = useState(50);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

  const fields = useMemo(() => schemaQuery.data?.fields ?? [], [schemaQuery.data]);

  useEffect(() => {
    if (fields.length > 0 && !seeded) {
      setValues(initialFormValues(fields));
      setSeeded(true);
    }
  }, [fields, seeded]);

  const backLink = `/projects/${projectId}/connectors`;

  if (schemaQuery.isLoading) {
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
  if (schemaQuery.isError) {
    const err = schemaQuery.error;
    if (err instanceof ConnectorError && err.status === 403) {
      return <PageState kind="permission" title="권한이 제한되어 있습니다" description="이 프로젝트를 볼 수 있는 구성원만 커넥터 설정을 조회할 수 있습니다." />;
    }
    if (err instanceof ConnectorError && err.status === 404) {
      return <PageState kind="error" title="알 수 없는 커넥터 종류" description="요청한 커넥터 종류를 찾을 수 없습니다." actionLabel="카탈로그로" onAction={() => void schemaQuery.refetch()} />;
    }
    return (
      <PageState
        kind="error"
        title="설정 스키마를 불러오지 못했습니다"
        description="서비스에서 오류가 반환되었습니다. 안전하게 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => void schemaQuery.refetch()}
      />
    );
  }

  const schema = schemaQuery.data!;

  const setValue = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.secret || field.field_kind === "SECRET") continue; // never validate/enter a secret
      const raw = values[field.name];
      const str = typeof raw === "string" ? raw.trim() : "";
      if (field.field_kind === "URL" && str.length > 0 && !/^https?:\/\/\S+$/i.test(str)) {
        errors[field.name] = "올바른 URL 형식이 아닙니다 (예: https://example.invalid/api).";
      }
    }
    setUrlErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const runPreview = () => {
    if (guardViolation) return;
    if (!validate()) return;
    // Build the config map from NON-SECRET placeholders only. SECRET fields carry
    // their masked non-secret placeholder; NO raw secret is ever sent.
    const config: Record<string, string | number | boolean | null> = {};
    for (const field of fields) {
      const raw = values[field.name];
      if (field.field_kind === "BOOLEAN") {
        config[field.name] = Boolean(raw);
      } else {
        config[field.name] = typeof raw === "string" ? raw : String(raw ?? "");
      }
    }
    previewMutation.mutate({ config, item_cap: itemCap });
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
        <HanaCard title={schema.display_name} eyebrow={`${schema.connector_kind} · ${kindKo[schema.connector_kind]}`} emphasis="default">
          <CardBody>
            <BadgeRow>
              <StatusBadge token={schema.connector_kind} koLabel={kindKo[schema.connector_kind]} tone="muted" />
              <HanaBadge tone="progress">raw_secret_present: false</HanaBadge>
            </BadgeRow>
            <Muted>
              마스킹된 설정 스키마입니다. SECRET 항목은 마스킹되어 있으며 P0 미리보기는 비밀값 없이 동작합니다.
              값을 입력하지 않아도 예시(비밀값 아님) 값으로 미리보기를 실행할 수 있습니다.
            </Muted>

            <FormFields>
              {fields.map((field) => (
                <ConfigFieldControl
                  key={field.name}
                  field={field}
                  value={values[field.name]}
                  error={urlErrors[field.name]}
                  onChange={(v) => setValue(field.name, v)}
                />
              ))}
            </FormFields>

            <CapRow>
              <label htmlFor="connector-item-cap">
                <span>표시 개수 상한 (item_cap · 최대 50)</span>
                <HanaInput
                  id="connector-item-cap"
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
                {previewMutation.isPending ? "미리보기 계산 중…" : "미리보기 실행"}
              </HanaButton>
              <Muted as="span">가져오기/연결/동기화 없음 — 읽기 전용 dry-run 계산</Muted>
            </FormActions>
          </CardBody>
        </HanaCard>

        <div>
          {previewMutation.isError ? (
            <ErrorRow role="alert">
              <AlertTriangle aria-hidden="true" size={16} />
              <span>
                {previewMutation.error instanceof ConnectorError
                  ? previewMutation.error.message
                  : "미리보기를 계산하지 못했습니다. 아무것도 변경되지 않았으므로 다시 시도할 수 있습니다."}
              </span>
            </ErrorRow>
          ) : null}

          {previewMutation.isPending ? (
            <SkeletonCard style={{ height: 200 }} aria-hidden="true" />
          ) : preview ? (
            <PreviewResult preview={preview} projectId={projectId} />
          ) : (
            <PlaceholderCard>
              <Muted>"미리보기 실행"을 누르면 이 설정으로 후보 레이어에 매핑될 would-be 항목이 여기에 표시됩니다. 아무것도 가져오지 않습니다.</Muted>
            </PlaceholderCard>
          )}
        </div>
      </DetailGrid>
    </>
  );
}

function ConfigFieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: ConnectorConfigField;
  value: FormValue | undefined;
  error?: string;
  onChange: (value: FormValue) => void;
}) {
  const isSecret = field.secret || field.field_kind === "SECRET";
  const labelText = `${field.label}${field.required ? " *" : ""}`;

  return (
    <FieldRow>
      <FieldLabelText>
        {labelText}
        {isSecret ? <HanaBadge tone="warning">SECRET · 마스킹됨</HanaBadge> : null}
      </FieldLabelText>
      {isSecret ? (
        // Masked-secret rule (mirror MVP5): type=password, disabled/read-only with a
        // NON-SECRET placeholder demonstrating the future config shape. No raw secret
        // is required or entered in P0; the preview runs without it.
        <HanaInput
          type="password"
          value={field.placeholder ?? ""}
          placeholder={field.placeholder ?? ""}
          readOnly
          disabled
          aria-label={`${field.label} (마스킹됨, 입력 불필요)`}
        />
      ) : field.field_kind === "BOOLEAN" ? (
        <ToggleRow>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            aria-label={field.label}
          />
          <span>{Boolean(value) ? "true" : "false"}</span>
        </ToggleRow>
      ) : field.field_kind === "ENUM" ? (
        <HanaSelect value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)}>
          {(field.enum_values ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </HanaSelect>
      ) : (
        <HanaInput
          type={field.field_kind === "URL" ? "url" : field.field_kind === "INTEGER" ? "number" : "text"}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.help_text ? <FieldHelp>{field.help_text}</FieldHelp> : null}
      {error ? <FieldError role="alert">{error}</FieldError> : null}
    </FieldRow>
  );
}

// ---- Preview result ----

function PreviewResult({ preview, projectId }: { preview: ConnectorImportPreviewResponse; projectId: string }) {
  const blocked = preview.status === "BLOCKED";
  return (
    <Stack>
      <HanaCard
        title="미리보기 결과 (dry-run)"
        eyebrow="PREVIEW RESULT · 가져오기 없음"
        emphasis="default"
      >
        <CardBody>
          <BadgeRow>
            <StatusBadge token={preview.status} />
            <StatusBadge token={preview.compatibility} />
            <StatusBadge token={preview.target_layer} />
            <HanaBadge tone="progress">preview_only: {String(preview.preview_only)}</HanaBadge>
            <HanaBadge tone="progress">raw_secret_present: {String(preview.raw_secret_present)}</HanaBadge>
          </BadgeRow>

          <Summary>
            <MetricCard label="원천 레코드 (would-be 기준)" value={String(preview.summary.source_record_count)} />
            <MetricCard label="would-be 후보 엔터티" value={String(preview.summary.would_be_candidate_entity_count)} />
            <MetricCard label="would-be 후보 관계" value={String(preview.summary.would_be_candidate_relation_count)} />
            <MetricCard label="미매핑 레코드" value={String(preview.summary.unmapped_record_count)} />
            <MetricCard label="경고 수" value={String(preview.summary.warning_count)} />
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
            이 설정으로는 후보 레이어에 매핑되는 항목을 만들 수 없습니다 (차단됨). 설정을 수정한 뒤 다시
            미리보기를 실행하세요. 아무것도 가져오거나 변경하지 않았습니다.
          </Muted>
        </PlaceholderCard>
      ) : preview.sample_items.length === 0 ? (
        <PlaceholderCard>
          <Muted>이 설정으로 후보 레이어에 매핑되는 레코드가 없습니다. 가져오기가 일어나지 않았습니다.</Muted>
        </PlaceholderCard>
      ) : (
        <HanaCard title="would-be 후보 항목" description="생성된 행이 아니라, 실제 실행 시 후보 레이어에 매핑될 예상 항목입니다." eyebrow="WOULD-BE CANDIDATES" emphasis="default">
          <CardBody>
            <ItemList>
              {preview.sample_items.map((item) => (
                <PreviewItemRow key={item.preview_ref} item={item} projectId={projectId} />
              ))}
            </ItemList>
          </CardBody>
        </HanaCard>
      )}

      <RoutingNote>{preview.routing_note}</RoutingNote>
      <RoutingNoteKo>
        미리보기 전용입니다 — 아무것도 가져오지 않았습니다. 실제 실행은 기존 추출 → 후보 → 검토 → 게시 게이트를 거칩니다.
      </RoutingNoteKo>

      <GuardProof guard={preview.mutation_guard} compact />
    </Stack>
  );
}

function PreviewItemRow({ item, projectId }: { item: ConnectorPreviewItem; projectId: string }) {
  const ref = item.mapped_ontology_class_ref;
  return (
    <ItemCard>
      <ItemHead>
        <strong>{item.label}</strong>
        <StatusBadge token={item.compatibility} />
        <StatusBadge token={item.target_layer} />
      </ItemHead>
      <KeyValue>
        <dt>미리보기 참조</dt>
        <dd>
          <code>{item.preview_ref}</code> <Muted as="span">— 생성된 후보 ID 아님</Muted>
        </dd>
        <dt>매핑 온톨로지 클래스</dt>
        <dd>
          {ref ? (
            <Link to={`/projects/${projectId}/ontology`}>
              <HanaBadge tone="progress">
                {ref.element_kind} · {ref.label ?? ref.element_id}
              </HanaBadge>
            </Link>
          ) : (
            <HanaBadge tone="warning">미매핑 (unmapped)</HanaBadge>
          )}
        </dd>
        <dt>소스 위치 (mock)</dt>
        <dd>
          <code>{item.source_locator ?? "—"}</code>
        </dd>
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
  notices: ConnectorPreviewNotice[];
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

function GuardProof({ guard, compact }: { guard: ConnectorMutationGuard; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <ProofBlock data-compact={compact ? "true" : "false"}>
      <ProofHead type="button" onClick={() => setOpen((v) => !v)}>
        <ShieldCheck aria-hidden="true" size={14} />
        <span>이 응답은 아무것도 연결/가져오기/변경하지 않았습니다 — 9개 mutation 플래그 모두 false</span>
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
  grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`;

const FieldLabelText = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ToggleRow = styled.label`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const FieldHelp = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  overflow-wrap: anywhere;
`;

const FieldError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.danger};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
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
