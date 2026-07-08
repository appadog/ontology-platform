import {
  ConnectorCatalogItem,
  ConnectorConfigField,
  ConnectorConfigSchemaResponse,
  ConnectorImportPreviewResponse,
  ConnectorKind,
  ConnectorMutationGuard,
  ConnectorPreviewCompatibility,
  ConnectorPreviewItem,
  ConnectorPreviewNotice,
  CopilotOntologyElementRef,
} from "../api/types";
import { MVP6_GOVERNANCE_PROJECT_ID } from "./mvp6GovernanceFixtures";

// Deterministic MVP6.9 Connectors fixtures. READ-ONLY catalog + DRY-RUN import
// preview. Field/enum names match docs/api/openapi-mvp6-9-draft.json EXACTLY (3
// paths / 17 schemas). Nothing is connected, written, or imported: a preview maps
// fixture sample records to WOULD-BE candidate-layer items and CREATES NOTHING
// (no candidate/source/extraction; the published graph is never touched). No real
// network call, no credential execution; the preview is INDEPENDENT of any secret
// value and byte-stable for the same kind + non-secret config. Every response
// carries an ALL-FALSE 9-flag ConnectorMutationGuard; raw_secret_present=false.
//
// Per-kind fixture shape is FROZEN by PM6-032 (G5):
//   FILE_SOURCE = 6 records (-> COMPATIBLE)
//   REST_SOURCE = 5 records (>=1 unmapped -> WARNING)
//   KNOWLEDGE_BASE_SOURCE = 4 records (-> COMPATIBLE)
// source_locator is an opaque deterministic string derived from NON-SECRET config
// only: `fixture:<file|rest|kb>/<resource>#row=<n>`.

export const MVP6_CONNECTORS_PROJECT_ID = MVP6_GOVERNANCE_PROJECT_ID;

/** ALL 9 FLAGS FALSE, on every response. MVP6.9 turns NO flag true, ever. */
export const allFalseConnectorGuard: ConnectorMutationGuard = {
  external_system_read: false,
  external_system_write: false,
  real_network_call_made: false,
  credential_persisted: false,
  connector_instance_persisted: false,
  source_created: false,
  candidate_graph_mutated: false,
  published_graph_mutated: false,
  extraction_job_started: false,
};

export const CONNECTOR_ROUTING_NOTE =
  "preview only - nothing imported; a real run would route through the existing extraction -> candidate -> review -> publish gate.";

export const CONNECTOR_ITEM_CAP_MAX = 50;

// ---- Masked config schemas (ordered fields; SECRET fields masked) ----

const fileFields: ConnectorConfigField[] = [
  {
    name: "file_path",
    label: "파일 경로 (mock)",
    field_kind: "STRING",
    required: true,
    secret: false,
    placeholder: "/data/records.csv",
    help_text: "비밀값이 아닌 예시 경로입니다. 실제 파일을 읽지 않습니다.",
    enum_values: null,
  },
  {
    name: "format",
    label: "포맷",
    field_kind: "ENUM",
    required: true,
    secret: false,
    placeholder: "CSV",
    help_text: null,
    enum_values: ["CSV", "JSON"],
  },
  {
    name: "has_header",
    label: "헤더 포함",
    field_kind: "BOOLEAN",
    required: false,
    secret: false,
    placeholder: null,
    help_text: null,
    enum_values: null,
  },
];

const restFields: ConnectorConfigField[] = [
  {
    name: "base_url",
    label: "Base URL",
    field_kind: "URL",
    required: true,
    secret: false,
    placeholder: "https://example.invalid/api",
    help_text: "비밀값이 아닌 예시 URL입니다. 실제 요청을 보내지 않습니다.",
    enum_values: null,
  },
  {
    name: "resource_path",
    label: "리소스 경로",
    field_kind: "STRING",
    required: true,
    secret: false,
    placeholder: "/v1/items",
    help_text: null,
    enum_values: null,
  },
  {
    name: "api_key",
    label: "API 키",
    field_kind: "SECRET",
    required: false,
    secret: true,
    placeholder: "SECRET_PLACEHOLDER_NOT_A_REAL_SECRET",
    help_text:
      "마스킹됨 — 저장/전송/로그에 남지 않습니다. P0 미리보기는 비밀값 없이 동작합니다 (실제 자격증명은 저장/전송되지 않습니다).",
    enum_values: null,
  },
];

const kbFields: ConnectorConfigField[] = [
  {
    name: "workspace_url",
    label: "워크스페이스 URL",
    field_kind: "URL",
    required: true,
    secret: false,
    placeholder: "https://example.invalid/kb",
    help_text: "비밀값이 아닌 예시 URL입니다. 실제 연결을 시도하지 않습니다.",
    enum_values: null,
  },
  {
    name: "space_key",
    label: "스페이스 키",
    field_kind: "STRING",
    required: true,
    secret: false,
    placeholder: "KB",
    help_text: null,
    enum_values: null,
  },
  {
    name: "access_token",
    label: "액세스 토큰",
    field_kind: "SECRET",
    required: false,
    secret: true,
    placeholder: "SECRET_PLACEHOLDER_NOT_A_REAL_SECRET",
    help_text:
      "마스킹됨 — 저장/전송/로그에 남지 않습니다. P0 미리보기는 비밀값 없이 동작합니다.",
    enum_values: null,
  },
];

const configFieldsByKind: Record<ConnectorKind, ConnectorConfigField[]> = {
  FILE_SOURCE: fileFields,
  REST_SOURCE: restFields,
  KNOWLEDGE_BASE_SOURCE: kbFields,
};

const displayNameByKind: Record<ConnectorKind, string> = {
  FILE_SOURCE: "File Source (CSV/JSON)",
  REST_SOURCE: "REST Source",
  KNOWLEDGE_BASE_SOURCE: "Knowledge Base Source",
};

const descriptionByKind: Record<ConnectorKind, string> = {
  FILE_SOURCE: "CSV/JSON 파일형 소스 (mock). 결정적 고정 레코드에 대한 미리보기입니다.",
  REST_SOURCE: "일반 REST API형 소스 (mock). 실제 네트워크 호출 없이 미리보기합니다.",
  KNOWLEDGE_BASE_SOURCE: "지식베이스/문서 소스 (mock). 외부 연결 없이 미리보기합니다.",
};

export const CONNECTOR_KIND_ORDER: ConnectorKind[] = [
  "FILE_SOURCE",
  "REST_SOURCE",
  "KNOWLEDGE_BASE_SOURCE",
];

export function isConnectorKind(value: string): value is ConnectorKind {
  return (CONNECTOR_KIND_ORDER as string[]).includes(value);
}

export function connectorHasSecretFields(kind: ConnectorKind): boolean {
  return configFieldsByKind[kind].some((f) => f.secret || f.field_kind === "SECRET");
}

export function buildConnectorCatalog(): ConnectorCatalogItem[] {
  return CONNECTOR_KIND_ORDER.map((kind) => ({
    connector_kind: kind,
    display_name: displayNameByKind[kind],
    description: descriptionByKind[kind],
    mock: true,
    has_secret_fields: connectorHasSecretFields(kind),
    config_field_count: configFieldsByKind[kind].length,
    target_layer: "CANDIDATE",
  }));
}

export function buildConnectorConfigSchema(
  projectId: string,
  kind: ConnectorKind,
): ConnectorConfigSchemaResponse {
  return {
    project_id: projectId,
    connector_kind: kind,
    display_name: displayNameByKind[kind],
    // Clone field descriptors so a mock consumer cannot mutate the fixture.
    fields: configFieldsByKind[kind].map((f) => ({ ...f, enum_values: f.enum_values ? [...f.enum_values] : f.enum_values })),
    raw_secret_present: false,
    mutation_guard: { ...allFalseConnectorGuard },
  };
}

// ---- Deterministic fixture records -> WOULD-BE candidate-layer items ----

interface FixtureRecord {
  label: string;
  /** null -> unmapped record (renders "미매핑"). */
  classId: string | null;
  classLabel: string | null;
  compatibility: ConnectorPreviewCompatibility;
  note: string | null;
}

const fixtureRecordsByKind: Record<ConnectorKind, FixtureRecord[]> = {
  // FILE_SOURCE = 6 records, all mapped -> COMPATIBLE.
  FILE_SOURCE: [
    { label: "Ada Lovelace", classId: "cls_person", classLabel: "Person", compatibility: "COMPATIBLE", note: null },
    { label: "Alan Turing", classId: "cls_person", classLabel: "Person", compatibility: "COMPATIBLE", note: null },
    { label: "Acme Corp", classId: "cls_org", classLabel: "Organization", compatibility: "COMPATIBLE", note: null },
    { label: "Globex", classId: "cls_org", classLabel: "Organization", compatibility: "COMPATIBLE", note: null },
    { label: "Widget A", classId: "cls_product", classLabel: "Product", compatibility: "COMPATIBLE", note: null },
    { label: "Widget B", classId: "cls_product", classLabel: "Product", compatibility: "COMPATIBLE", note: null },
  ],
  // REST_SOURCE = 5 records, 1 unmapped -> WARNING.
  REST_SOURCE: [
    { label: "Grace Hopper", classId: "cls_person", classLabel: "Person", compatibility: "COMPATIBLE", note: null },
    { label: "Katherine Johnson", classId: "cls_person", classLabel: "Person", compatibility: "COMPATIBLE", note: null },
    { label: "Initech", classId: "cls_org", classLabel: "Organization", compatibility: "COMPATIBLE", note: null },
    {
      label: "(unmapped record)",
      classId: null,
      classLabel: null,
      compatibility: "WARNING",
      note: "일치하는 온톨로지 클래스가 없어 실제 실행 전 검토가 필요합니다.",
    },
    { label: "Gadget X", classId: "cls_product", classLabel: "Product", compatibility: "COMPATIBLE", note: null },
  ],
  // KNOWLEDGE_BASE_SOURCE = 4 records, all mapped -> COMPATIBLE.
  KNOWLEDGE_BASE_SOURCE: [
    { label: "Onboarding Guide", classId: "cls_document", classLabel: "Document", compatibility: "COMPATIBLE", note: null },
    { label: "Security Policy", classId: "cls_document", classLabel: "Document", compatibility: "COMPATIBLE", note: null },
    { label: "Data Retention", classId: "cls_policy", classLabel: "Policy", compatibility: "COMPATIBLE", note: null },
    { label: "Glossary", classId: "cls_document", classLabel: "Document", compatibility: "COMPATIBLE", note: null },
  ],
};

const relationCountByKind: Record<ConnectorKind, number> = {
  FILE_SOURCE: 2,
  REST_SOURCE: 2,
  KNOWLEDGE_BASE_SOURCE: 1,
};

const localePrefixByKind: Record<ConnectorKind, string> = {
  FILE_SOURCE: "file",
  REST_SOURCE: "rest",
  KNOWLEDGE_BASE_SOURCE: "kb",
};

const refPrefixByKind: Record<ConnectorKind, string> = {
  FILE_SOURCE: "prev_file",
  REST_SOURCE: "prev_rest",
  KNOWLEDGE_BASE_SOURCE: "prev_kb",
};

/** Deterministic, opaque resource token derived from NON-SECRET config only. */
function resourceToken(kind: ConnectorKind, config: Record<string, unknown>): string {
  const raw =
    kind === "FILE_SOURCE"
      ? String(config.file_path ?? "records")
      : kind === "REST_SOURCE"
        ? String(config.resource_path ?? "items")
        : String(config.space_key ?? "kb");
  const cleaned = raw.replace(/^\/+/, "").replace(/[^A-Za-z0-9_./-]/g, "").trim();
  return cleaned.length > 0 ? cleaned : "records";
}

interface BlockedReason {
  code: string;
  message: string;
}

/** Validate NON-SECRET required fields only; secret fields never gate the preview. */
function findBlockedReasons(
  kind: ConnectorKind,
  config: Record<string, unknown>,
): BlockedReason[] {
  const reasons: BlockedReason[] = [];
  for (const field of configFieldsByKind[kind]) {
    if (field.secret || field.field_kind === "SECRET") continue; // secret-independent
    const value = config[field.name];
    const missing = value === undefined || value === null || String(value).trim() === "";
    if (field.required && missing) {
      reasons.push({
        code: "MISSING_REQUIRED_FIELD",
        message: `필수 항목 '${field.label}'(${field.name})이(가) 비어 있어 미리보기를 계산할 수 없습니다.`,
      });
      continue;
    }
    if (!missing && field.field_kind === "URL" && !/^https?:\/\/\S+$/i.test(String(value))) {
      reasons.push({
        code: "INVALID_CONFIG_VALUE",
        message: `'${field.label}'(${field.name}) 값이 올바른 URL 형식이 아닙니다.`,
      });
    }
    if (!missing && field.field_kind === "ENUM" && field.enum_values && !field.enum_values.includes(String(value))) {
      reasons.push({
        code: "INVALID_CONFIG_VALUE",
        message: `'${field.label}'(${field.name}) 값이 허용된 값(${field.enum_values.join(", ")})이 아닙니다.`,
      });
    }
  }
  return reasons;
}

/**
 * Deterministic dry-run preview. Byte-stable for the same kind + non-secret
 * config (secret values never change the result). generated_at is set by the
 * caller (client) at response time and is excluded from the determinism
 * assertion. Creates NOTHING; carries an all-false guard.
 */
export function buildConnectorImportPreview(
  projectId: string,
  kind: ConnectorKind,
  config: Record<string, unknown>,
  itemCap?: number | null,
): Omit<ConnectorImportPreviewResponse, "generated_at"> {
  const cap = Math.max(1, Math.min(itemCap ?? CONNECTOR_ITEM_CAP_MAX, CONNECTOR_ITEM_CAP_MAX));

  const blocked = findBlockedReasons(kind, config);
  if (blocked.length > 0) {
    // BLOCKED: never a crash, never fabricated items, zero counts.
    return {
      preview_id: null,
      project_id: projectId,
      connector_kind: kind,
      preview_only: true,
      status: "BLOCKED",
      compatibility: "INCOMPATIBLE",
      target_layer: "CANDIDATE",
      summary: {
        source_record_count: 0,
        would_be_candidate_entity_count: 0,
        would_be_candidate_relation_count: 0,
        unmapped_record_count: 0,
        warning_count: 0,
      },
      sample_items: [],
      item_cap: cap,
      truncated: false,
      total_item_count: 0,
      warnings: [],
      blocked_reasons: blocked.map((b) => ({ ...b })),
      routing_note: CONNECTOR_ROUTING_NOTE,
      raw_secret_present: false,
      mutation_guard: { ...allFalseConnectorGuard },
    };
  }

  const records = fixtureRecordsByKind[kind];
  const resource = resourceToken(kind, config);
  const refPrefix = refPrefixByKind[kind];
  const localePrefix = localePrefixByKind[kind];

  const allItems: ConnectorPreviewItem[] = records.map((record, index) => {
    const rowNumber = index + 1;
    const mappedRef: CopilotOntologyElementRef | null =
      record.classId !== null
        ? { element_kind: "CLASS", element_id: record.classId, label: record.classLabel }
        : null;
    return {
      preview_ref: `${refPrefix}_${String(rowNumber).padStart(4, "0")}`,
      target_layer: "CANDIDATE",
      mapped_ontology_class_ref: mappedRef,
      label: record.label,
      source_locator: `fixture:${localePrefix}/${resource}#row=${rowNumber}`,
      compatibility: record.compatibility,
      note: record.note,
    };
  });

  const unmappedCount = records.filter((r) => r.classId === null).length;
  const entityCount = records.length - unmappedCount;
  const relationCount = relationCountByKind[kind];
  const warnings: ConnectorPreviewNotice[] =
    unmappedCount > 0
      ? [
          {
            code: "UNMAPPED_FIELDS",
            message: `${unmappedCount}건의 레코드가 실제 실행 전 검토가 필요합니다.`,
          },
        ]
      : [];
  const compatibility: ConnectorPreviewCompatibility = unmappedCount > 0 ? "WARNING" : "COMPATIBLE";

  const totalItemCount = allItems.length;
  const truncated = totalItemCount > cap;
  const sampleItems = truncated ? allItems.slice(0, cap) : allItems;

  return {
    preview_id: null,
    project_id: projectId,
    connector_kind: kind,
    preview_only: true,
    status: "READY",
    compatibility,
    target_layer: "CANDIDATE",
    summary: {
      source_record_count: records.length,
      would_be_candidate_entity_count: entityCount,
      would_be_candidate_relation_count: relationCount,
      unmapped_record_count: unmappedCount,
      warning_count: warnings.length,
    },
    sample_items: sampleItems,
    item_cap: cap,
    truncated,
    total_item_count: totalItemCount,
    warnings,
    blocked_reasons: [],
    routing_note: CONNECTOR_ROUTING_NOTE,
    raw_secret_present: false,
    mutation_guard: { ...allFalseConnectorGuard },
  };
}
