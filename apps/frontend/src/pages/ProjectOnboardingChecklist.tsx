import { useEffect, useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
import styled from "styled-components";
import { useCurrentPublishedGraph, useExtractionJobs, useOntologyGraph, useOntologyVersions } from "../shared/api/queries";

// Wave 63 (PM6-041 §2.3 / design doc P3): project-home activation checklist.
// Every item is derived from EXISTING data the app already fetches elsewhere
// (ontology graph, sources, extraction jobs, published graph) -- no new
// backend state, no new counts invented. Purely client-side derivation +
// localStorage for the dismiss flag, per the frozen design doc.
function dismissedStorageKey(projectId: string) {
  return `onboarding-checklist-dismissed:${projectId}`;
}

interface ProjectOnboardingChecklistProps {
  projectId: string;
  /** Already loaded by the project-home page via useProject -- reused, not refetched. */
  sourceCount: number;
}

export function ProjectOnboardingChecklist({ projectId, sourceCount }: ProjectOnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(dismissedStorageKey(projectId)) === "true";
  });

  useEffect(() => {
    setDismissed(window.localStorage.getItem(dismissedStorageKey(projectId)) === "true");
  }, [projectId]);

  const { data: versions } = useOntologyVersions(projectId);
  const latestVersionId = versions?.[0]?.id ?? "";
  const { data: graph } = useOntologyGraph(latestVersionId);
  const { data: extractionJobs } = useExtractionJobs(projectId);
  const { data: publishedGraph, isSuccess: hasPublishedGraph } = useCurrentPublishedGraph(projectId);

  const ontologyElementCount = graph ? (graph.classes?.length ?? graph.nodes.length) + (graph.relations?.length ?? graph.edges.length) : 0;

  const items = [
    { key: "ontology", label: "온톨로지 클래스/관계 1개 이상 정의됨", done: ontologyElementCount > 0 },
    { key: "source", label: "소스 1개 이상 업로드됨", done: sourceCount > 0 },
    { key: "extraction", label: "추출 잡 1개 이상 실행됨", done: (extractionJobs?.length ?? 0) > 0 },
    { key: "publish", label: "게시 그래프 버전 1개 이상 존재", done: hasPublishedGraph && Boolean(publishedGraph) },
  ];

  const allDone = items.every((item) => item.done);

  if (dismissed || allDone) {
    return null;
  }

  function handleDismiss() {
    window.localStorage.setItem(dismissedStorageKey(projectId), "true");
    setDismissed(true);
  }

  return (
    <ChecklistCard role="note" aria-label="온보딩 체크리스트">
      <ChecklistHeader>
        <strong>시작 체크리스트</strong>
        <DismissButton type="button" onClick={handleDismiss} aria-label="체크리스트 닫기">
          <X aria-hidden="true" />
        </DismissButton>
      </ChecklistHeader>
      <ChecklistList>
        {items.map((item) => (
          <ChecklistItem key={item.key} data-done={item.done}>
            {item.done ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}
            <span>{item.label}</span>
          </ChecklistItem>
        ))}
      </ChecklistList>
    </ChecklistCard>
  );
}

const ChecklistCard = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceAccentPanel};
`;

const ChecklistHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};

  strong {
    color: ${({ theme }) => theme.color.text};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const DismissButton = styled.button`
  display: inline-flex;
  padding: 4px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: none;
  color: ${({ theme }) => theme.color.textMuted};
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.surfaceOverlay};
  }
`;

const ChecklistList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ChecklistItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.color.borderStrong};
  }

  &[data-done="true"] {
    color: ${({ theme }) => theme.color.text};

    svg {
      color: ${({ theme }) => theme.color.positive};
    }
  }
`;
