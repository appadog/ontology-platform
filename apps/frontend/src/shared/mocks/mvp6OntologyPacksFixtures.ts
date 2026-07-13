import {
  OntologyElementRef,
  OntologyPackCatalogItem,
  OntologyPackDetailResponse,
  OntologyPackElementCounts,
  PackApplyCompatibility,
  PackApplyPreviewResponse,
  PackApplyPreviewStatus,
  PackElementDescriptor,
  PackElementKind,
  PackPreviewItem,
  PackPreviewItemDisposition,
  PackPreviewNotice,
  OntologyPackMutationGuard,
} from "../api/types";

// Deterministic MVP6.11 Ontology Packs fixtures. READ-ONLY catalog + deterministic
// DRY-RUN apply-preview. Field/enum names match docs/api/openapi-mvp6-11-draft.json
// EXACTLY (3 paths / 19 schemas / 5 enums). Nothing is installed, applied, or
// written: an apply-preview diffs a pack's elements against a process-local DRAFT
// snapshot and maps each to a WOULD-BE DRAFT-layer item, CREATING NOTHING (no
// class/property/relation/change-request; candidate/published never touched). Every
// response carries an ALL-FALSE 8-flag OntologyPackMutationGuard.
//
// The pack element sets + the diff matrix are FROZEN by PM6-036 (Wave54 PM_REPORT):
//   pack-insurance-core          = 4C / 3P / 2R / 9  -> vs demo DRAFT: all NEW -> COMPATIBLE
//   pack-manufacturing-equipment = 4C / 3P / 2R / 9  -> vs demo DRAFT: 6 NEW + 1 CONFLICT (mfg.sensor)
//                                                       + 2 DUPLICATE (mfg.equipment, mfg.equipment.serial_no) -> WARNING
//   pack-legal-compliance        = 4C / 2P / 2R / 8  -> vs demo DRAFT: all NEW -> COMPATIBLE
//   any pack vs a no-DRAFT project -> BLOCKED / INCOMPATIBLE (NO_DRAFT_ONTOLOGY, zero items)
// The demo (mfg-overlap) DRAFT snapshot is the DEFAULT diff basis for any resolvable
// project; a project id containing "no-draft" resolves to the no-DRAFT-ontology case.

/** ALL 8 FLAGS FALSE, on every response. MVP6.11 turns NO flag true, ever. */
export const allFalseOntologyPackGuard: OntologyPackMutationGuard = {
  pack_installed: false,
  ontology_draft_mutated: false,
  ontology_class_created: false,
  ontology_property_created: false,
  ontology_relation_created: false,
  candidate_graph_mutated: false,
  published_graph_mutated: false,
  change_request_created: false,
};

export const PACK_ROUTING_NOTE =
  "preview only - nothing applied; a real apply routes through the existing MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only, human-initiated) path.";

export const PACK_ITEM_CAP_MAX = 50;

/** The demo DRAFT-ontology version id the apply-preview diffs against (read-only). */
export const PACK_DRAFT_VERSION_ID = "otv-packs-demo-draft";

/** A resolvable project with no DRAFT ontology version -> every pack BLOCKED. */
export const PACK_NO_DRAFT_PROJECT_ID = "proj-packs-no-draft";

// ---- Frozen pack element sets (ordered CLASS -> PROPERTY -> RELATION) ----

interface PackFixture {
  pack_id: string;
  name: string;
  domain: string;
  version: string;
  description: string;
  elements: PackElementDescriptor[];
}

const INSURANCE_ELEMENTS: PackElementDescriptor[] = [
  { element_key: "insurance.policy", element_kind: "CLASS", label: "보험계약(Policy)", description: "보험 계약 엔티티." },
  { element_key: "insurance.claim", element_kind: "CLASS", label: "보험금청구(Claim)", description: "보험금 청구 엔티티." },
  { element_key: "insurance.policyholder", element_kind: "CLASS", label: "계약자(Policyholder)", description: "보험 계약자 엔티티." },
  { element_key: "insurance.coverage", element_kind: "CLASS", label: "보장(Coverage)", description: "보장 항목 엔티티." },
  { element_key: "insurance.policy.premium", element_kind: "PROPERTY", label: "보험료(premium)", description: "보험계약의 보험료." },
  { element_key: "insurance.policy.policy_number", element_kind: "PROPERTY", label: "증권번호(policyNumber)", description: "보험계약 식별 번호." },
  { element_key: "insurance.claim.claim_amount", element_kind: "PROPERTY", label: "청구금액(claimAmount)", description: "보험금 청구 금액." },
  { element_key: "insurance.policyholder_holds_policy", element_kind: "RELATION", label: "계약자-계약 보유(holdsPolicy)", description: "계약자와 보험계약의 관계." },
  { element_key: "insurance.claim_against_policy", element_kind: "RELATION", label: "청구-계약 대상(againstPolicy)", description: "보험금청구와 보험계약의 관계." },
];

const MANUFACTURING_ELEMENTS: PackElementDescriptor[] = [
  { element_key: "mfg.equipment", element_kind: "CLASS", label: "설비(Equipment)", description: "제조 설비 엔티티." },
  { element_key: "mfg.work_order", element_kind: "CLASS", label: "작업지시(WorkOrder)", description: "작업 지시 엔티티." },
  { element_key: "mfg.sensor", element_kind: "CLASS", label: "센서(Sensor)", description: "설비 센서 엔티티." },
  { element_key: "mfg.maintenance_log", element_kind: "CLASS", label: "정비이력(MaintenanceLog)", description: "설비 정비 이력 엔티티." },
  { element_key: "mfg.equipment.serial_no", element_kind: "PROPERTY", label: "시리얼번호(serialNo)", description: "설비 시리얼 번호." },
  { element_key: "mfg.equipment.status", element_kind: "PROPERTY", label: "설비상태(status)", description: "설비 가동 상태." },
  { element_key: "mfg.sensor.reading_unit", element_kind: "PROPERTY", label: "측정단위(readingUnit)", description: "센서 측정 단위." },
  { element_key: "mfg.sensor_monitors_equipment", element_kind: "RELATION", label: "센서-설비 모니터링(monitors)", description: "센서가 설비를 모니터링하는 관계." },
  { element_key: "mfg.work_order_targets_equipment", element_kind: "RELATION", label: "작업지시-설비 대상(targets)", description: "작업지시가 설비를 대상으로 하는 관계." },
];

const LEGAL_ELEMENTS: PackElementDescriptor[] = [
  { element_key: "legal.regulation", element_kind: "CLASS", label: "규정(Regulation)", description: "법률/규정 엔티티." },
  { element_key: "legal.obligation", element_kind: "CLASS", label: "의무(Obligation)", description: "규정상 의무 엔티티." },
  { element_key: "legal.contract", element_kind: "CLASS", label: "계약(Contract)", description: "계약 엔티티." },
  { element_key: "legal.party", element_kind: "CLASS", label: "당사자(Party)", description: "계약 당사자 엔티티." },
  { element_key: "legal.regulation.jurisdiction", element_kind: "PROPERTY", label: "관할(jurisdiction)", description: "규정의 관할." },
  { element_key: "legal.obligation.due_date", element_kind: "PROPERTY", label: "이행기한(dueDate)", description: "의무 이행 기한." },
  { element_key: "legal.contract_binds_party", element_kind: "RELATION", label: "계약-당사자 구속(binds)", description: "계약이 당사자를 구속하는 관계." },
  { element_key: "legal.obligation_under_regulation", element_kind: "RELATION", label: "의무-규정 근거(underRegulation)", description: "의무가 규정에 근거하는 관계." },
];

const PACK_FIXTURES: PackFixture[] = [
  {
    pack_id: "pack-insurance-core",
    name: "보험 코어 도메인 팩",
    domain: "insurance",
    version: "1.0.0",
    description: "보험 코어 도메인 온톨로지 요소 번들 (mock).",
    elements: INSURANCE_ELEMENTS,
  },
  {
    pack_id: "pack-manufacturing-equipment",
    name: "제조 설비 도메인 팩",
    domain: "manufacturing",
    version: "1.0.0",
    description: "제조 설비 도메인 온톨로지 요소 번들 (mock).",
    elements: MANUFACTURING_ELEMENTS,
  },
  {
    pack_id: "pack-legal-compliance",
    name: "법률/규정 도메인 팩",
    domain: "legal",
    version: "1.0.0",
    description: "법률/규정 도메인 온톨로지 요소 번들 (mock).",
    elements: LEGAL_ELEMENTS,
  },
];

export const PACK_ID_ORDER: string[] = PACK_FIXTURES.map((p) => p.pack_id);

export function isOntologyPackId(value: string): boolean {
  return PACK_ID_ORDER.includes(value);
}

function countElements(elements: PackElementDescriptor[]): OntologyPackElementCounts {
  const class_count = elements.filter((e) => e.element_kind === "CLASS").length;
  const property_count = elements.filter((e) => e.element_kind === "PROPERTY").length;
  const relation_count = elements.filter((e) => e.element_kind === "RELATION").length;
  return { class_count, property_count, relation_count, element_count: elements.length };
}

export function buildPackCatalog(): OntologyPackCatalogItem[] {
  return PACK_FIXTURES.map((pack) => ({
    pack_id: pack.pack_id,
    name: pack.name,
    domain: pack.domain,
    version: pack.version,
    description: pack.description,
    mock: true,
    element_counts: countElements(pack.elements),
  }));
}

export function buildPackDetail(packId: string): OntologyPackDetailResponse | null {
  const pack = PACK_FIXTURES.find((p) => p.pack_id === packId);
  if (!pack) return null;
  return {
    pack_id: pack.pack_id,
    name: pack.name,
    domain: pack.domain,
    version: pack.version,
    description: pack.description,
    mock: true,
    element_counts: countElements(pack.elements),
    elements: pack.elements.map((e) => ({ ...e })),
    mutation_guard: { ...allFalseOntologyPackGuard },
  };
}

// ---- DRAFT snapshot diff (process-local; read-only; mutated by nothing) ----
//
// The demo (mfg-overlap) DRAFT snapshot: element_key -> overlap outcome. A pack
// element not present here is NEW; DUPLICATE = identical definition (no-op);
// CONFLICT = same identity, definition differs (human resolution required).

interface DraftOverlap {
  disposition: Extract<PackPreviewItemDisposition, "CONFLICT" | "DUPLICATE">;
  /** Typed existing-element id in the DRAFT (opaque; NOT created by the preview). */
  existing_id: string;
  existing_label: string;
}

const DEMO_DRAFT_OVERLAP: Record<string, DraftOverlap> = {
  "mfg.equipment": { disposition: "DUPLICATE", existing_id: "cls_mfg_equipment_existing", existing_label: "설비(Equipment)" },
  "mfg.sensor": { disposition: "CONFLICT", existing_id: "cls_mfg_sensor_existing", existing_label: "센서(Sensor) [기존 정의 상이]" },
  "mfg.equipment.serial_no": { disposition: "DUPLICATE", existing_id: "prop_mfg_serial_no_existing", existing_label: "시리얼번호(serialNo)" },
};

function idFieldFor(kind: PackElementKind, id: string | null): Pick<OntologyElementRef, "ontology_class_id" | "ontology_property_id" | "ontology_relation_id"> {
  return {
    ontology_class_id: kind === "CLASS" ? id : null,
    ontology_property_id: kind === "PROPERTY" ? id : null,
    ontology_relation_id: kind === "RELATION" ? id : null,
  };
}

/** True when the project has no DRAFT ontology version (apply-preview -> BLOCKED). */
export function projectHasNoDraft(projectId: string): boolean {
  return projectId.includes("no-draft");
}

/**
 * Deterministic dry-run apply-preview. Byte-stable for the same pack + project
 * DRAFT (generated_at + preview_id are set/excluded by the caller). Creates
 * NOTHING; carries an all-false 8-flag guard.
 */
export function buildPackApplyPreview(
  projectId: string,
  packId: string,
  itemCap?: number | null,
): Omit<PackApplyPreviewResponse, "generated_at"> | null {
  const pack = PACK_FIXTURES.find((p) => p.pack_id === packId);
  if (!pack) return null; // caller maps to 404 ONTOLOGY_PACK_NOT_FOUND

  const cap = Math.max(1, Math.min(itemCap ?? PACK_ITEM_CAP_MAX, PACK_ITEM_CAP_MAX));

  // BLOCKED: no DRAFT ontology -> INCOMPATIBLE, zero fabricated items.
  if (projectHasNoDraft(projectId)) {
    const blockedStatus: PackApplyPreviewStatus = "BLOCKED";
    return {
      preview_id: null,
      project_id: projectId,
      pack_id: pack.pack_id,
      pack_version: pack.version,
      preview_only: true,
      status: blockedStatus,
      compatibility: "INCOMPATIBLE",
      target_layer: "DRAFT",
      summary: { would_add_count: 0, would_modify_count: 0, conflict_count: 0, duplicate_count: 0, total_element_count: 0 },
      items: [],
      item_cap: cap,
      truncated: false,
      total_item_count: 0,
      warnings: [],
      blocked_reasons: [
        {
          code: "NO_DRAFT_ONTOLOGY",
          message: "이 프로젝트에는 DRAFT 온톨로지가 없어 적용 미리보기를 계산할 수 없습니다. 온톨로지 모델러에서 DRAFT를 먼저 시작하세요.",
        },
      ],
      routing_note: PACK_ROUTING_NOTE,
      mutation_guard: { ...allFalseOntologyPackGuard },
    };
  }

  const packSlug = pack.pack_id.replace(/[^a-z0-9]+/gi, "_");
  const items: PackPreviewItem[] = pack.elements.map((el, index) => {
    const overlap = DEMO_DRAFT_OVERLAP[el.element_key];
    const disposition: PackPreviewItemDisposition = overlap ? overlap.disposition : "NEW";
    const preview_ref = `prev_${packSlug}_${String(index + 1).padStart(4, "0")}`;

    if (!overlap) {
      // NEW: unmapped -> mapped_ontology_ref null, no existing label.
      return {
        preview_ref,
        element_kind: el.element_kind,
        disposition,
        target_layer: "DRAFT",
        mapped_ontology_ref: null,
        pack_element_label: el.label,
        existing_element_label: null,
        note: "DRAFT에 없음 → 추가 대상.",
      };
    }

    const mapped_ontology_ref: OntologyElementRef = {
      target_kind: el.element_kind,
      ...idFieldFor(el.element_kind, overlap.existing_id),
      ontology_version_id: PACK_DRAFT_VERSION_ID,
      status: "DRAFT",
    };
    return {
      preview_ref,
      element_kind: el.element_kind,
      disposition,
      target_layer: "DRAFT",
      mapped_ontology_ref,
      pack_element_label: el.label,
      existing_element_label: overlap.existing_label,
      note:
        disposition === "CONFLICT"
          ? "동일 identity가 존재하나 정의가 상이 → human 해소 필요; 자동 덮어쓰기 안 함."
          : "동일 요소가 이미 존재 → 적용 시 no-op.",
    };
  });

  const conflictCount = items.filter((i) => i.disposition === "CONFLICT").length;
  const duplicateCount = items.filter((i) => i.disposition === "DUPLICATE").length;
  const newCount = items.filter((i) => i.disposition === "NEW").length;

  const warnings: PackPreviewNotice[] = [];
  if (conflictCount > 0) {
    warnings.push({
      code: "NAME_CONFLICT_DIFFERENT_DEFINITION",
      message: `동일 이름의 요소 ${conflictCount}건이 DRAFT와 정의가 달라 실제 적용 전 human 해소가 필요합니다.`,
    });
  }
  if (duplicateCount > 0) {
    warnings.push({
      code: "EXISTING_DUPLICATE_ELEMENT",
      message: `이미 존재하는 동일 요소 ${duplicateCount}건은 적용 시 no-op 처리됩니다.`,
    });
  }

  const compatibility: PackApplyCompatibility =
    conflictCount === 0 && duplicateCount === 0 ? "COMPATIBLE" : "WARNING";

  const totalItemCount = items.length;
  const truncated = totalItemCount > cap;
  const cappedItems = truncated ? items.slice(0, cap) : items;

  return {
    preview_id: null,
    project_id: projectId,
    pack_id: pack.pack_id,
    pack_version: pack.version,
    preview_only: true,
    status: "READY",
    compatibility,
    target_layer: "DRAFT",
    summary: {
      would_add_count: newCount,
      would_modify_count: conflictCount, // == conflict_count; DUPLICATE is its own bucket
      conflict_count: conflictCount,
      duplicate_count: duplicateCount,
      total_element_count: totalItemCount,
    },
    items: cappedItems,
    item_cap: cap,
    truncated,
    total_item_count: totalItemCount,
    warnings,
    blocked_reasons: [],
    routing_note: PACK_ROUTING_NOTE,
    mutation_guard: { ...allFalseOntologyPackGuard },
  };
}
