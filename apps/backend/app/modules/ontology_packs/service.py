from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone

from app.core.enums import Role
from app.core.errors import ApiException

from .schemas import (
    PackOntologyElementRef,
    OntologyElementStatus,
    OntologyPackCatalogItem,
    OntologyPackCatalogListResponse,
    OntologyPackDetailResponse,
    OntologyPackElementCounts,
    OntologyPackMutationGuard,
    PackApplyCompatibility,
    PackApplyPreviewResponse,
    PackApplyPreviewStatus,
    PackApplyPreviewSummary,
    PackApplyTargetLayer,
    PackElementDescriptor,
    PackElementKind,
    PackPreviewItem,
    PackPreviewItemDisposition,
    PackPreviewNotice,
)

# Hard server cap on returned items[] (P0). Counts remain exact regardless (G-bound).
ITEM_CAP_MAX = 50

# Constant boundary note (byte-stable) present on every apply-preview response.
ROUTING_NOTE = (
    "preview only - nothing applied; a real apply routes through the existing "
    "MVP1 ontology-edit / MVP6.6 governance-application (DRAFT-only, human-initiated) path."
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Identity + definition-signature helpers (G4, frozen).
#   match iff element_kind equal AND normalized identity key equal
#   (NFC + trim + casefold). PROPERTY key is owning-class-scoped, RELATION by name.
#   match + equal definition_signature -> DUPLICATE; match + differ -> CONFLICT;
#   no match -> NEW.
# ---------------------------------------------------------------------------


def _norm(value: str) -> str:
    return unicodedata.normalize("NFC", value).strip().casefold()


@dataclass(frozen=True)
class _Element:
    key: str
    kind: PackElementKind
    label: str
    description: str | None = None
    data_type: str | None = None          # PROPERTY
    owning_class_key: str | None = None    # PROPERTY
    domain_key: str | None = None          # RELATION
    range_key: str | None = None           # RELATION

    @property
    def identity(self) -> tuple[str, str]:
        return (self.kind.value, _norm(self.key))

    @property
    def signature(self) -> str:
        # Deterministic canonical string over the element's semantic definition,
        # computed identically on the pack side and the DRAFT side (G4).
        if self.kind is PackElementKind.CLASS:
            return f"CLASS|{self.label}|{self.description or ''}"
        if self.kind is PackElementKind.PROPERTY:
            return f"PROPERTY|{self.owning_class_key or ''}|{self.label}|{self.data_type or ''}"
        return f"RELATION|{self.domain_key or ''}|{self.range_key or ''}|{self.label}"


@dataclass(frozen=True)
class _DraftElement:
    key: str
    kind: PackElementKind
    label: str
    element_id: str
    signature: str
    status: OntologyElementStatus = OntologyElementStatus.DRAFT

    @property
    def identity(self) -> tuple[str, str]:
        return (self.kind.value, _norm(self.key))


@dataclass(frozen=True)
class _Pack:
    pack_id: str
    tag: str
    name: str
    domain: str
    version: str
    description: str
    elements: list[_Element]


@dataclass(frozen=True)
class _DraftSnapshot:
    version_id: str
    elements: list[_DraftElement]

    @property
    def by_identity(self) -> dict[tuple[str, str], _DraftElement]:
        return {e.identity: e for e in self.elements}


# ---------------------------------------------------------------------------
# Frozen pack fixtures (PM Wave54 fixture matrix, VERBATIM). Deterministic order:
# classes, then properties, then relations. Keys shown are the element_key /
# identity keys.
# ---------------------------------------------------------------------------


def _c(key: str, label: str, description: str | None) -> _Element:
    return _Element(key=key, kind=PackElementKind.CLASS, label=label, description=description)


def _p(key: str, label: str, owning: str, data_type: str) -> _Element:
    return _Element(
        key=key, kind=PackElementKind.PROPERTY, label=label,
        owning_class_key=owning, data_type=data_type,
    )


def _r(key: str, label: str, domain: str, rng: str) -> _Element:
    return _Element(
        key=key, kind=PackElementKind.RELATION, label=label,
        domain_key=domain, range_key=rng,
    )


_PACK_SEED: list[_Pack] = [
    _Pack(
        pack_id="pack-insurance-core",
        tag="ins",
        name="보험 코어 도메인 팩",
        domain="insurance",
        version="1.0.0",
        description="보험 코어 도메인 온톨로지 요소 번들 (mock).",
        elements=[
            _c("insurance.policy", "보험계약(Policy)", "보험 계약 엔티티."),
            _c("insurance.claim", "보험금청구(Claim)", "보험금 청구 엔티티."),
            _c("insurance.policyholder", "계약자(Policyholder)", "보험 계약자 엔티티."),
            _c("insurance.coverage", "담보(Coverage)", "보장 담보 엔티티."),
            _p("insurance.policy.premium", "보험료(premium)", "insurance.policy", "NUMBER"),
            _p("insurance.policy.policy_number", "증권번호(policyNumber)", "insurance.policy", "STRING"),
            _p("insurance.claim.claim_amount", "청구금액(claimAmount)", "insurance.claim", "NUMBER"),
            _r("insurance.policyholder_holds_policy", "계약자-계약 보유(holdsPolicy)",
               "insurance.policyholder", "insurance.policy"),
            _r("insurance.claim_against_policy", "청구-계약 대상(againstPolicy)",
               "insurance.claim", "insurance.policy"),
        ],
    ),
    _Pack(
        pack_id="pack-manufacturing-equipment",
        tag="mfg",
        name="제조 설비 도메인 팩",
        domain="manufacturing",
        version="1.0.0",
        description="제조 설비 도메인 온톨로지 요소 번들 (mock).",
        elements=[
            _c("mfg.equipment", "설비(Equipment)", "제조 설비 엔티티."),
            _c("mfg.work_order", "작업지시(WorkOrder)", "작업 지시 엔티티."),
            _c("mfg.sensor", "센서(Sensor)", "설비 센서 엔티티."),
            _c("mfg.maintenance_log", "정비이력(MaintenanceLog)", "정비 이력 엔티티."),
            _p("mfg.equipment.serial_no", "일련번호(serialNo)", "mfg.equipment", "STRING"),
            _p("mfg.equipment.status", "설비상태(status)", "mfg.equipment", "STRING"),
            _p("mfg.sensor.reading_unit", "측정단위(readingUnit)", "mfg.sensor", "STRING"),
            _r("mfg.sensor_monitors_equipment", "센서-설비 감시(monitors)",
               "mfg.sensor", "mfg.equipment"),
            _r("mfg.work_order_targets_equipment", "작업지시-설비 대상(targets)",
               "mfg.work_order", "mfg.equipment"),
        ],
    ),
    _Pack(
        pack_id="pack-legal-compliance",
        tag="legal",
        name="법률/규정 도메인 팩",
        domain="legal",
        version="1.0.0",
        description="법률/규정 도메인 온톨로지 요소 번들 (mock).",
        elements=[
            _c("legal.regulation", "규정(Regulation)", "법령/규정 엔티티."),
            _c("legal.obligation", "의무(Obligation)", "준수 의무 엔티티."),
            _c("legal.contract", "계약(Contract)", "법적 계약 엔티티."),
            _c("legal.party", "당사자(Party)", "계약 당사자 엔티티."),
            _p("legal.regulation.jurisdiction", "관할(jurisdiction)", "legal.regulation", "STRING"),
            _p("legal.obligation.due_date", "이행기한(dueDate)", "legal.obligation", "DATE"),
            _r("legal.contract_binds_party", "계약-당사자 구속(binds)",
               "legal.contract", "legal.party"),
            _r("legal.obligation_under_regulation", "의무-규정 근거(underRegulation)",
               "legal.obligation", "legal.regulation"),
        ],
    ),
]


# ---------------------------------------------------------------------------
# Deterministic process-local DRAFT-ontology snapshot fixtures (G3), keyed by
# project_id. Read-only diff basis; NEVER mutated. A project KEY present == the
# project is resolvable; its value None == a resolvable project with NO DRAFT
# ontology version (-> 200 BLOCKED). Unknown key == unknown project (-> 404).
# ---------------------------------------------------------------------------


def _pack_element(pack_id: str, key: str) -> _Element:
    for e in _pack_index()[pack_id].elements:
        if e.key == key:
            return e
    raise KeyError(key)  # pragma: no cover - fixture wiring guard


def _build_demo_snapshot() -> _DraftSnapshot:
    equipment = _pack_element("pack-manufacturing-equipment", "mfg.equipment")
    serial_no = _pack_element("pack-manufacturing-equipment", "mfg.equipment.serial_no")
    sensor = _pack_element("pack-manufacturing-equipment", "mfg.sensor")
    # CONFLICT: same identity as the pack's mfg.sensor but a DIFFERENT definition
    # (different description) -> the definition_signature differs.
    sensor_conflicting = _Element(
        key=sensor.key, kind=sensor.kind,
        label="센서 장치(Sensor Device)", description="설비에 부착된 센서 장치 (상이 정의).",
    )
    return _DraftSnapshot(
        version_id="otv-packs-demo-draft",
        elements=[
            _DraftElement(
                key=equipment.key, kind=PackElementKind.CLASS, label=equipment.label,
                element_id="cls_mfg_equipment_existing", signature=equipment.signature,
            ),
            _DraftElement(
                key=sensor.key, kind=PackElementKind.CLASS, label=sensor_conflicting.label,
                element_id="cls_mfg_sensor_existing", signature=sensor_conflicting.signature,
            ),
            _DraftElement(
                key=serial_no.key, kind=PackElementKind.PROPERTY, label=serial_no.label,
                element_id="prop_mfg_serial_no_existing", signature=serial_no.signature,
            ),
        ],
    )


# Live process-local tables (rebuilt by reset_runtime_store()).
_PACKS: dict[str, _Pack] = {}
_PACK_ORDER: list[str] = []
_PROJECT_DRAFTS: dict[str, _DraftSnapshot | None] = {}


def _pack_index() -> dict[str, _Pack]:
    if not _PACKS:
        for pack in _PACK_SEED:
            _PACKS[pack.pack_id] = pack
    return _PACKS


def reset_runtime_store() -> None:
    """Re-seed the deterministic read-only fixtures. P0 mutates nothing, so this is
    an idempotent re-seed kept for MVP6.1-6.10 seed/test parity."""
    _PACKS.clear()
    _PACK_ORDER.clear()
    _PROJECT_DRAFTS.clear()

    for pack in _PACK_SEED:
        _PACKS[pack.pack_id] = pack
        _PACK_ORDER.append(pack.pack_id)

    # proj-packs-demo: DRAFT version with a manufacturing overlap set only.
    _PROJECT_DRAFTS["proj-packs-demo"] = _build_demo_snapshot()
    # proj-packs-no-draft: resolvable project with NO DRAFT ontology version.
    _PROJECT_DRAFTS["proj-packs-no-draft"] = None
    # proj-packs-empty-draft: optional edge fixture -> a DRAFT with 0 elements
    # (every pack element all NEW -> COMPATIBLE).
    _PROJECT_DRAFTS["proj-packs-empty-draft"] = _DraftSnapshot(
        version_id="otv-packs-empty-draft", elements=[]
    )


# Seed at import time (module-load parity with the other MVP6 modules).
reset_runtime_store()


# ---------------------------------------------------------------------------
# Authz + resolution guards (G9). Authz = any project viewer; 403 / 404 only.
# ---------------------------------------------------------------------------

_VALID_ROLES = {r.value for r in Role}


def require_project_read(actor_role: str) -> None:
    # Any project-read member is allowed; an unrecognized role is denied (403).
    if actor_role not in _VALID_ROLES:
        raise ApiException(
            status_code=403,
            code="PERMISSION_DENIED",
            message="A project-read member role is required to view ontology packs.",
            details={"actor_role": actor_role},
        )


def pack_or_404(pack_id: str) -> _Pack:
    pack = _PACKS.get(pack_id)
    if pack is None:
        raise ApiException(
            status_code=404,
            code="ONTOLOGY_PACK_NOT_FOUND",
            message="요청한 온톨로지 팩을 찾을 수 없습니다.",
            details={"pack_id": pack_id},
        )
    return pack


def project_or_404(project_id: str) -> None:
    if project_id not in _PROJECT_DRAFTS:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="요청한 프로젝트를 찾을 수 없습니다.",
            details={"project_id": project_id},
        )


# ---------------------------------------------------------------------------
# Catalog + detail.
# ---------------------------------------------------------------------------


def _counts(pack: _Pack) -> OntologyPackElementCounts:
    cls = sum(1 for e in pack.elements if e.kind is PackElementKind.CLASS)
    prop = sum(1 for e in pack.elements if e.kind is PackElementKind.PROPERTY)
    rel = sum(1 for e in pack.elements if e.kind is PackElementKind.RELATION)
    return OntologyPackElementCounts(
        class_count=cls, property_count=prop, relation_count=rel,
        element_count=cls + prop + rel,
    )


def catalog() -> OntologyPackCatalogListResponse:
    items = [
        OntologyPackCatalogItem(
            pack_id=pack.pack_id,
            name=pack.name,
            domain=pack.domain,
            version=pack.version,
            description=pack.description,
            mock=True,
            element_counts=_counts(pack),
        )
        for pack in (_PACKS[pid] for pid in _PACK_ORDER)
    ]
    return OntologyPackCatalogListResponse(
        items=items,
        total_count=len(items),
        mutation_guard=OntologyPackMutationGuard(),
    )


def detail(pack: _Pack) -> OntologyPackDetailResponse:
    elements = [
        PackElementDescriptor(
            element_key=e.key,
            element_kind=e.kind,
            label=e.label,
            description=e.description,
        )
        for e in pack.elements
    ]
    return OntologyPackDetailResponse(
        pack_id=pack.pack_id,
        name=pack.name,
        domain=pack.domain,
        version=pack.version,
        description=pack.description,
        mock=True,
        element_counts=_counts(pack),
        elements=elements,
        mutation_guard=OntologyPackMutationGuard(),
    )


# ---------------------------------------------------------------------------
# Dry-run apply-preview (deterministic; reads DRAFT ONLY; creates nothing).
# ---------------------------------------------------------------------------

_NOTE_NEW = "DRAFT에 없음 -> 추가 대상."
_NOTE_CONFLICT = "동일 identity가 존재하나 정의가 상이 -> human 해소 필요; 자동 덮어쓰기 안 함."
_NOTE_DUPLICATE = "동일 요소가 이미 존재 -> no-op."


def _mapped_ref(
    kind: PackElementKind, version_id: str,
    element_id: str | None, status: OntologyElementStatus | None,
) -> PackOntologyElementRef:
    return PackOntologyElementRef(
        target_kind=kind,
        ontology_class_id=element_id if kind is PackElementKind.CLASS else None,
        ontology_property_id=element_id if kind is PackElementKind.PROPERTY else None,
        ontology_relation_id=element_id if kind is PackElementKind.RELATION else None,
        ontology_version_id=version_id,
        status=status,
    )


def _blocked_response(
    project_id: str, pack: _Pack, generated_at: datetime, item_cap: int, code: str, message: str,
) -> PackApplyPreviewResponse:
    return PackApplyPreviewResponse(
        preview_id=None,
        project_id=project_id,
        pack_id=pack.pack_id,
        pack_version=pack.version,
        generated_at=generated_at,
        preview_only=True,
        status=PackApplyPreviewStatus.BLOCKED,
        compatibility=PackApplyCompatibility.INCOMPATIBLE,
        target_layer=PackApplyTargetLayer.DRAFT,
        summary=PackApplyPreviewSummary(
            would_add_count=0, would_modify_count=0, conflict_count=0,
            duplicate_count=0, total_element_count=0,
        ),
        items=[],
        item_cap=item_cap,
        truncated=False,
        total_item_count=0,
        warnings=[],
        blocked_reasons=[PackPreviewNotice(code=code, message=message)],
        routing_note=ROUTING_NOTE,
        mutation_guard=OntologyPackMutationGuard(),
    )


def apply_preview(
    project_id: str, pack: _Pack, item_cap: int | None,
) -> PackApplyPreviewResponse:
    generated_at = utc_now()
    effective_cap = ITEM_CAP_MAX if item_cap is None else min(item_cap, ITEM_CAP_MAX)

    snapshot = _PROJECT_DRAFTS.get(project_id)
    # Resolvable project but NO DRAFT ontology version -> 200 BLOCKED (never a crash,
    # never fabricated items). NO_DRAFT_ONTOLOGY is the only BLOCKED code fired in P0.
    if snapshot is None:
        return _blocked_response(
            project_id, pack, generated_at, effective_cap,
            code="NO_DRAFT_ONTOLOGY",
            message="대상 프로젝트에 DRAFT 온톨로지 버전이 없어 미리보기를 계산할 수 없습니다.",
        )

    by_identity = snapshot.by_identity
    items: list[PackPreviewItem] = []
    would_add = conflict = duplicate = 0

    for seq, element in enumerate(pack.elements, start=1):
        existing = by_identity.get(element.identity)
        if existing is None:
            disposition = PackPreviewItemDisposition.NEW
            would_add += 1
            mapped = _mapped_ref(element.kind, snapshot.version_id, None, None)
            existing_label: str | None = None
            note = _NOTE_NEW
        elif existing.signature == element.signature:
            disposition = PackPreviewItemDisposition.DUPLICATE
            duplicate += 1
            mapped = _mapped_ref(
                element.kind, snapshot.version_id, existing.element_id, existing.status
            )
            existing_label = existing.label
            note = _NOTE_DUPLICATE
        else:
            disposition = PackPreviewItemDisposition.CONFLICT
            conflict += 1
            mapped = _mapped_ref(
                element.kind, snapshot.version_id, existing.element_id, existing.status
            )
            existing_label = existing.label
            note = _NOTE_CONFLICT

        items.append(
            PackPreviewItem(
                preview_ref=f"prev_{pack.tag}_{seq:04d}",
                element_kind=element.kind,
                disposition=disposition,
                target_layer=PackApplyTargetLayer.DRAFT,
                mapped_ontology_ref=mapped,
                pack_element_label=element.label,
                existing_element_label=existing_label,
                note=note,
            )
        )

    total = len(pack.elements)
    summary = PackApplyPreviewSummary(
        would_add_count=would_add,
        would_modify_count=conflict,          # CONFLICT only (G4)
        conflict_count=conflict,
        duplicate_count=duplicate,
        total_element_count=total,
    )
    compatibility = (
        PackApplyCompatibility.COMPATIBLE
        if conflict == 0 and duplicate == 0
        else PackApplyCompatibility.WARNING
    )

    warnings: list[PackPreviewNotice] = []
    if conflict > 0:
        warnings.append(
            PackPreviewNotice(
                code="NAME_CONFLICT_DIFFERENT_DEFINITION",
                message=(
                    f"동일 이름의 요소 {conflict}건이 DRAFT와 정의가 달라 "
                    "실제 적용 전 human 해소가 필요합니다."
                ),
            )
        )
    if duplicate > 0:
        warnings.append(
            PackPreviewNotice(
                code="EXISTING_DUPLICATE_ELEMENT",
                message=f"이미 존재하는 동일 요소 {duplicate}건은 적용 시 no-op 처리됩니다.",
            )
        )

    total_item_count = len(items)
    capped_items = items[:effective_cap]
    truncated = total_item_count > effective_cap

    return PackApplyPreviewResponse(
        preview_id=None,
        project_id=project_id,
        pack_id=pack.pack_id,
        pack_version=pack.version,
        generated_at=generated_at,
        preview_only=True,
        status=PackApplyPreviewStatus.READY,
        compatibility=compatibility,
        target_layer=PackApplyTargetLayer.DRAFT,
        summary=summary,
        items=capped_items,
        item_cap=effective_cap,
        truncated=truncated,
        total_item_count=total_item_count,
        warnings=warnings,
        blocked_reasons=[],
        routing_note=ROUTING_NOTE,
        mutation_guard=OntologyPackMutationGuard(),
    )
