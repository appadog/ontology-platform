import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Edge, Node } from "react-flow-renderer";
import styled from "styled-components";
import { Plus, Search } from "lucide-react";
import { useOntologyGraph, useOntologyVersions } from "../shared/api/queries";
import { mockProjects } from "../shared/mocks/fixtures";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";

const currentProjectId = mockProjects[0].id;

export function OntologyModelerPage() {
  const [selectedClassId, setSelectedClassId] = useState("class-policy");
  const { data: versions, isLoading: isVersionsLoading, isError: isVersionsError } = useOntologyVersions(currentProjectId);
  const versionId = versions?.[0]?.id ?? "";
  const { data: graph, isLoading, isError, refetch } = useOntologyGraph(versionId);

  const nodes = useMemo<Node[]>(() => {
    if (!graph) {
      return [];
    }

    return graph.classes.map((ontologyClass) => ({
      id: ontologyClass.id,
      type: "default",
      position: ontologyClass.position,
      data: {
        label: (
          <GraphNodeLabel>
            <strong>{ontologyClass.label}</strong>
            <span>{ontologyClass.name}</span>
            <HanaBadge tone={statusToTone(ontologyClass.validation_status)}>{ontologyClass.validation_status}</HanaBadge>
          </GraphNodeLabel>
        ),
      },
      style: {
        borderColor: ontologyClass.validation_status === "WARNING" ? "#b45309" : "#1f5f8b",
        borderRadius: 8,
        borderWidth: 2,
        padding: 0,
        width: 178,
      },
    }));
  }, [graph]);

  const edges = useMemo<Edge[]>(() => {
    if (!graph) {
      return [];
    }

    return graph.relations.map((relation) => ({
      id: relation.id,
      source: relation.domain_class_id,
      target: relation.range_class_id,
      label: relation.label,
      animated: relation.validation_status === "WARNING",
      arrowHeadType: "arrowclosed",
      style: {
        stroke: relation.validation_status === "WARNING" ? "#b45309" : "#7c3aed",
        strokeWidth: 2,
      },
    }));
  }, [graph]);

  if (isVersionsLoading || isLoading) {
    return <PageState kind="loading" title="온톨로지 모델러를 불러오는 중" description="버전, 클래스, 관계, 속성 fixture를 그래프 데이터로 변환하고 있습니다." />;
  }

  if (isVersionsError || isError || !graph) {
    return (
      <PageState
        kind="error"
        title="온톨로지 그래프를 불러오지 못했습니다"
        description="OntologyVersion 또는 graph endpoint boundary를 확인하세요."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  if (graph.classes.length === 0) {
    return <PageState kind="empty" title="클래스가 없습니다" description="새 OntologyClass를 만들면 그래프에 node로 표시됩니다." />;
  }

  const selectedClass = graph.classes.find((ontologyClass) => ontologyClass.id === selectedClassId) ?? graph.classes[0];
  const selectedProperties = graph.properties.filter((property) => property.class_id === selectedClass.id);
  const selectedRelations = graph.relations.filter(
    (relation) => relation.domain_class_id === selectedClass.id || relation.range_class_id === selectedClass.id,
  );

  return (
    <>
      <PageHeader title="Ontology Modeler" description="클래스 node, 관계 edge, 속성 정의를 mock graph로 먼저 모델링합니다.">
        <HanaBadge tone={statusToTone(graph.version_status)}>{graph.version_status}</HanaBadge>
        <HanaButton variant="primary" type="button">
          <Plus aria-hidden="true" />
          Add Class
        </HanaButton>
      </PageHeader>
      <ModelerGrid>
        <LeftPanel>
          <PanelHeader>
            <h2>Classes</h2>
            <HanaBadge tone="neutral">{graph.classes.length}</HanaBadge>
          </PanelHeader>
          <SearchBox>
            <Search aria-hidden="true" />
            <HanaInput placeholder="Search class" />
          </SearchBox>
          <EntityList>
            {graph.classes.map((ontologyClass) => (
              <button
                key={ontologyClass.id}
                type="button"
                data-selected={ontologyClass.id === selectedClass.id}
                onClick={() => setSelectedClassId(ontologyClass.id)}
              >
                <strong>{ontologyClass.label}</strong>
                <span>{ontologyClass.name}</span>
                <HanaBadge tone={statusToTone(ontologyClass.validation_status)}>{ontologyClass.validation_status}</HanaBadge>
              </button>
            ))}
          </EntityList>
        </LeftPanel>
        <CanvasCard>
          <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable onNodeClick={(_, node) => setSelectedClassId(node.id)}>
            <Background gap={18} color="#d8e0ea" />
            <Controls />
          </ReactFlow>
        </CanvasCard>
        <RightPanel>
          <PanelHeader>
            <h2>{selectedClass.label}</h2>
            <HanaBadge tone={statusToTone(selectedClass.status)}>{selectedClass.status}</HanaBadge>
          </PanelHeader>
          <Description>{selectedClass.description}</Description>
          <DetailGroup>
            <h3>Properties</h3>
            {selectedProperties.length === 0 ? (
              <SmallEmpty>등록된 속성이 없습니다.</SmallEmpty>
            ) : (
              selectedProperties.map((property) => (
                <DetailRow key={property.id}>
                  <div>
                    <strong>{property.label}</strong>
                    <span>{property.name}</span>
                  </div>
                  <HanaBadge tone={statusToTone(property.validation_status)}>{property.validation_status}</HanaBadge>
                </DetailRow>
              ))
            )}
          </DetailGroup>
          <DetailGroup>
            <h3>Relations</h3>
            {selectedRelations.map((relation) => (
              <DetailRow key={relation.id}>
                <div>
                  <strong>{relation.label}</strong>
                  <span>
                    {relation.cardinality} · {relation.required ? "required" : "optional"}
                  </span>
                </div>
                <HanaBadge tone={statusToTone(relation.validation_status)}>{relation.validation_status}</HanaBadge>
              </DetailRow>
            ))}
          </DetailGroup>
        </RightPanel>
      </ModelerGrid>
    </>
  );
}

const ModelerGrid = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(420px, 1fr) 330px;
  gap: 14px;
  min-height: 680px;

  @media (max-width: 1180px) {
    grid-template-columns: 260px minmax(0, 1fr);

    > aside:last-child {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.aside`
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const RightPanel = styled(LeftPanel)``;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 17px;
  }
`;

const SearchBox = styled.div`
  position: relative;

  svg {
    position: absolute;
    top: 50%;
    left: 11px;
    width: 16px;
    height: 16px;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.color.textMuted};
  }

  input {
    padding-left: 34px;
  }
`;

const EntityList = styled.div`
  display: grid;
  gap: 8px;

  button {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surfaceRaised};
    color: ${({ theme }) => theme.color.text};
    text-align: left;
    cursor: pointer;

    &[data-selected="true"] {
      border-color: ${({ theme }) => theme.color.primary};
      background: ${({ theme }) => theme.color.primarySoft};
    }
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 13px;
  }
`;

const CanvasCard = styled(HanaCard)`
  min-height: 680px;
`;

const GraphNodeLabel = styled.div`
  display: grid;
  gap: 5px;
  min-width: 150px;
  padding: 10px;

  strong {
    font-size: 14px;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
  }
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  line-height: 1.55;
`;

const DetailGroup = styled.section`
  display: grid;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 13px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  div {
    display: grid;
    gap: 3px;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
  }
`;

const SmallEmpty = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
`;
