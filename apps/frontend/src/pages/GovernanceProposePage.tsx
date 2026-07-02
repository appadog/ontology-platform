import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Send, ShieldCheck, Trash2 } from "lucide-react";
import styled from "styled-components";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../shared/api/client";
import { useProject, useProposeOntologyChangeRequest } from "../shared/api/queries";
import {
  ChangeRequestChangeType,
  ChangeRequestTargetKind,
  OntologyChangeItemRequest,
} from "../shared/api/types";
import { MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID } from "../shared/mocks/mvp6GovernanceFixtures";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect } from "../shared/ui/hana";
import { CardBody, Muted, SectionStack } from "../shared/ui/platform/Section";
import { PageState } from "../shared/ui/platform/PageState";
import { CompactTable } from "./mvp3Shared";
import { PageActions } from "./mvp4Shared";
import { changeTypeKo, targetKindKo } from "./governanceShared";

// MVP6.5 Propose — author a change request with one or more change items. One
// primary action: 제출. `임시저장`(draft) is secondary. Client validation: ADD
// must have no element ref; MODIFY/DEPRECATE must have one. The primary action
// is never 적용/게시.

interface DraftItem {
  key: string;
  target_kind: ChangeRequestTargetKind;
  change_type: ChangeRequestChangeType;
  element_ref: string;
  proposed_change: string;
}

const TARGET_KINDS: ChangeRequestTargetKind[] = ["CLASS", "PROPERTY", "RELATION"];
const CHANGE_TYPES: ChangeRequestChangeType[] = ["ADD", "MODIFY", "DEPRECATE"];

let draftKeyCounter = 0;
function newDraftItem(): DraftItem {
  draftKeyCounter += 1;
  return {
    key: `draft-item-${draftKeyCounter}`,
    target_kind: "CLASS",
    change_type: "ADD",
    element_ref: "",
    proposed_change: "",
  };
}

function elementRefField(kind: ChangeRequestTargetKind): keyof OntologyChangeItemRequest {
  if (kind === "CLASS") return "ontology_class_id";
  if (kind === "PROPERTY") return "ontology_property_id";
  return "ontology_relation_id";
}

function itemError(item: DraftItem): string | null {
  const needsRef = item.change_type === "MODIFY" || item.change_type === "DEPRECATE";
  if (needsRef && !item.element_ref.trim()) {
    return "수정/폐기 제안에는 대상 온톨로지 요소를 지정해야 합니다.";
  }
  if (item.change_type === "ADD" && item.element_ref.trim()) {
    return "추가(ADD) 항목에는 대상 요소를 지정할 수 없습니다.";
  }
  return null;
}

export function GovernanceProposePage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const projectQuery = useProject(projectId);
  const propose = useProposeOntologyChangeRequest(projectId);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<DraftItem[]>([newDraftItem()]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const busy = propose.isPending || submitting;

  const canSubmit =
    title.trim().length > 0 &&
    summary.trim().length > 0 &&
    items.length > 0 &&
    items.every((item) => itemError(item) === null);

  const buildRequestItems = (): OntologyChangeItemRequest[] =>
    items.map((item) => {
      const base: OntologyChangeItemRequest = {
        target_kind: item.target_kind,
        change_type: item.change_type,
        ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID,
        ontology_class_id: null,
        ontology_property_id: null,
        ontology_relation_id: null,
        proposed_change: item.proposed_change.trim() ? { note: item.proposed_change.trim() } : {},
      };
      if (item.change_type !== "ADD" && item.element_ref.trim()) {
        (base[elementRefField(item.target_kind)] as string | null) = item.element_ref.trim();
      }
      return base;
    });

  const handleSubmit = () => {
    setError(null);
    if (!canSubmit) {
      setError("제목·요약과 모든 변경 항목의 유효성을 확인하세요.");
      return;
    }
    // Create the DRAFT with its items, then submit (DRAFT -> OPEN). The submit
    // call needs the freshly created id, so it goes through the apiClient
    // directly rather than an id-bound hook whose id is not yet known at render.
    setSubmitting(true);
    propose.mutate(
      { title: title.trim(), summary: summary.trim(), ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID, items: buildRequestItems() },
      {
        onSuccess: async (response) => {
          const id = response.change_request.id;
          try {
            await apiClient.submitOntologyChangeRequest(id);
            setNotice("이 요청은 제안 기록이며 온톨로지·게시 그래프를 변경하지 않습니다.");
          } finally {
            void queryClient.invalidateQueries({ queryKey: ["governance", "change-requests"] });
            setSubmitting(false);
            navigate(`/projects/${projectId}/governance/${id}`);
          }
        },
        onError: () => {
          setSubmitting(false);
          setError("변경 요청을 생성하지 못했습니다. 다시 시도하세요.");
        },
      },
    );
  };

  const handleSaveDraft = () => {
    setError(null);
    if (title.trim().length === 0) {
      setError("임시저장하려면 제목이 필요합니다.");
      return;
    }
    propose.mutate(
      { title: title.trim(), summary: summary.trim() || null, ontology_version_id: MVP6_GOVERNANCE_ONTOLOGY_VERSION_ID, items: buildRequestItems() },
      {
        onSuccess: (response) => {
          setNotice("초안을 저장했습니다. 제출하기 전까지 검토 대상에 표시되지 않습니다.");
          navigate(`/projects/${projectId}/governance/${response.change_request.id}`);
        },
        onError: () => setError("초안을 저장하지 못했습니다."),
      },
    );
  };

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  if (!projectId) {
    return <PageState kind="empty" title="프로젝트를 선택하세요" description="프로젝트를 선택하면 작업 메뉴가 표시됩니다." />;
  }
  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="불러오는 중입니다" description="프로젝트 컨텍스트를 준비하고 있습니다." />;
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="프로젝트를 불러오지 못했습니다" description="다시 시도하세요." />;
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Governance", to: `/projects/${projectId}/governance` },
          { label: "새 변경 요청" },
        ]}
      />
      <PageHeader title="새 변경 요청" description="온톨로지 변경 제안 (제안 기록 — 온톨로지·게시 그래프에 적용되지 않음)" eyebrow="GOVERNANCE">
        <PageActions>
          <HanaBadge tone="neutral">DRAFT</HanaBadge>
          <HanaButton type="button" onClick={handleSaveDraft} disabled={busy}>
            임시저장
          </HanaButton>
          <HanaButton type="button" variant="primary" onClick={handleSubmit} disabled={!canSubmit || busy}>
            <Send aria-hidden="true" size={16} /> 제출
          </HanaButton>
        </PageActions>
      </PageHeader>

      {notice ? (
        <NoticeBand role="status">
          <ShieldCheck aria-hidden="true" size={16} />
          <span>{notice}</span>
        </NoticeBand>
      ) : null}
      {error ? (
        <ErrorBand role="alert">
          <span>{error}</span>
        </ErrorBand>
      ) : null}

      <SectionStack>
        <HanaCard title="요청 정보" description="제목과 요약을 입력하세요" emphasis="summary">
          <CardBody>
            <FieldGrid>
              <label>
                <span>제목 (필수)</span>
                <HanaInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 고객 클래스에 위험등급 속성 추가" />
              </label>
              <label>
                <span>요약 (필수)</span>
                <TextArea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="변경 제안의 배경과 의도를 요약하세요." />
              </label>
            </FieldGrid>
            <Muted>제안 내용은 의도로만 저장되며 온톨로지에 적용되지 않습니다.</Muted>
          </CardBody>
        </HanaCard>

        <HanaCard
          title="변경 항목"
          description="대상 종류 × 변경 유형 + 대상 요소 참조 + 제안 내용 (ADD는 대상 요소 없음)"
          emphasis="default"
          action={
            <HanaButton type="button" onClick={() => setItems((prev) => [...prev, newDraftItem()])}>
              <Plus aria-hidden="true" size={14} /> 항목 추가
            </HanaButton>
          }
        >
          <CardBody>
            <CompactTable>
              <table>
                <thead>
                  <tr>
                    <th>대상 종류</th>
                    <th>변경 유형</th>
                    <th>대상 요소 참조</th>
                    <th>제안 내용 (의도)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const err = itemError(item);
                    const addMode = item.change_type === "ADD";
                    return (
                      <tr key={item.key}>
                        <td>
                          <HanaSelect
                            value={item.target_kind}
                            onChange={(e) => updateItem(item.key, { target_kind: e.target.value as ChangeRequestTargetKind })}
                          >
                            {TARGET_KINDS.map((kind) => (
                              <option key={kind} value={kind}>
                                {kind} · {targetKindKo[kind]}
                              </option>
                            ))}
                          </HanaSelect>
                        </td>
                        <td>
                          <HanaSelect
                            value={item.change_type}
                            onChange={(e) => updateItem(item.key, { change_type: e.target.value as ChangeRequestChangeType, element_ref: e.target.value === "ADD" ? "" : item.element_ref })}
                          >
                            {CHANGE_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type} · {changeTypeKo[type]}
                              </option>
                            ))}
                          </HanaSelect>
                        </td>
                        <td>
                          {addMode ? (
                            <Muted as="span">추가 — 대상 요소 없음</Muted>
                          ) : (
                            <HanaInput
                              value={item.element_ref}
                              onChange={(e) => updateItem(item.key, { element_ref: e.target.value })}
                              placeholder={`${targetKindKo[item.target_kind]} 요소 ID`}
                            />
                          )}
                          {err ? <ItemError>{err}</ItemError> : null}
                        </td>
                        <td>
                          <HanaInput
                            value={item.proposed_change}
                            onChange={(e) => updateItem(item.key, { proposed_change: e.target.value })}
                            placeholder="제안 내용 메모"
                          />
                        </td>
                        <td>
                          <HanaButton
                            type="button"
                            onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== item.key) : prev))}
                            disabled={items.length <= 1}
                          >
                            <Trash2 aria-hidden="true" size={14} />
                          </HanaButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CompactTable>
          </CardBody>
        </HanaCard>
      </SectionStack>
    </>
  );
}

const FieldGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};

  label {
    display: grid;
    gap: ${({ theme }) => theme.spacing.xs};
  }

  span {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
  font: inherit;
  resize: vertical;
`;

const NoticeBand = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const ErrorBand = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.danger};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.color.danger};

  span {
    overflow-wrap: anywhere;
  }
`;

const ItemError = styled.span`
  display: block;
  margin-top: 2px;
  color: ${({ theme }) => theme.color.danger};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;
