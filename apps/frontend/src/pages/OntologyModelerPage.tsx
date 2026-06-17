import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Edge, Node } from "react-flow-renderer";
import styled from "styled-components";
import { Plus, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  useCreateOntologyClass,
  useCreateOntologyProperty,
  useCreateOntologyRelation,
  useCreateOntologyVersion,
  useOntologyGraph,
  useOntologyVersions,
} from "../shared/api/queries";
import { Cardinality, PropertyDataType } from "../shared/api/types";
import { mockProjects } from "../shared/mocks/fixtures";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";

const currentProjectId = mockProjects[0].id;
const dataTypeOptions: PropertyDataType[] = ["STRING", "TEXT", "INTEGER", "FLOAT", "BOOLEAN", "DATE", "DATETIME", "URI"];
const cardinalityOptions: Cardinality[] = ["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", "MANY_TO_MANY", "OPTIONAL", "REQUIRED", "MULTIPLE"];

export function OntologyModelerPage() {
  const [selectedClassId, setSelectedClassId] = useState("class-policy");
  const [className, setClassName] = useState("Company");
  const [propertyName, setPropertyName] = useState("company_name");
  const [propertyDataType, setPropertyDataType] = useState<PropertyDataType>("STRING");
  const [propertyCardinality, setPropertyCardinality] = useState<Cardinality>("OPTIONAL");
  const [relationName, setRelationName] = useState("RELATED_TO");
  const [relationCardinality, setRelationCardinality] = useState<Cardinality>("MANY_TO_MANY");
  const [relationTargetClassId, setRelationTargetClassId] = useState("");
  const { projectId = currentProjectId } = useParams();
  const { data: versions, isLoading: isVersionsLoading, isError: isVersionsError } = useOntologyVersions(projectId);
  const versionId = versions?.[0]?.id ?? "";
  const { data: graph, isLoading, isError, refetch } = useOntologyGraph(versionId);
  const createVersion = useCreateOntologyVersion(projectId);
  const createClass = useCreateOntologyClass(versionId);
  const createProperty = useCreateOntologyProperty(versionId);
  const createRelation = useCreateOntologyRelation(versionId);

  const nodes = useMemo<Node[]>(() => {
    if (!graph) {
      return [];
    }

    return graph.nodes.map((graphNode) => ({
      id: graphNode.class_id,
      type: "default",
      position: graphNode.position,
      data: {
        label: (
          <GraphNodeLabel>
            <strong>{graphNode.label}</strong>
            <span>{graphNode.class_id}</span>
            <HanaBadge tone={statusToTone(graphNode.status)}>{graphNode.status}</HanaBadge>
          </GraphNodeLabel>
        ),
      },
      style: {
        borderColor: graphNode.status === "ACTIVE" ? "#1f5f8b" : "#475569",
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

    return graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source_class_id,
      target: edge.target_class_id,
      label: edge.label,
      animated: edge.status === "DRAFT",
      arrowHeadType: "arrowclosed",
      style: {
        stroke: edge.status === "ACTIVE" ? "#7c3aed" : "#475569",
        strokeWidth: 2,
      },
    }));
  }, [graph]);

  if (isVersionsLoading || (versionId && isLoading)) {
    return <PageState kind="loading" title="온톨로지 모델러를 불러오는 중" description="버전, 클래스, 관계, 속성 fixture를 그래프 데이터로 변환하고 있습니다." />;
  }

  if (isVersionsError) {
    return (
      <PageState
        kind="error"
        title="온톨로지 버전을 불러오지 못했습니다"
        description="Project ontology version endpoint boundary를 확인하세요."
      />
    );
  }

  if (!versionId) {
    return (
      <>
        <PageHeader title="Ontology Modeler" description="MVP 1 P0 흐름을 시작하려면 먼저 draft ontology version을 생성합니다.">
          <HanaButton
            variant="primary"
            type="button"
            disabled={createVersion.isPending}
            onClick={() => createVersion.mutate({ created_by: "dev-admin" })}
          >
            <Plus aria-hidden="true" />
            {createVersion.isPending ? "Creating" : "Create Draft Version"}
          </HanaButton>
        </PageHeader>
        <PageState
          kind="empty"
          title="Draft ontology version이 없습니다"
          description="새 draft version을 만들면 class, property, relation authoring을 시작할 수 있습니다."
          actionLabel={createVersion.isPending ? "Creating" : "Create draft version"}
          onAction={() => createVersion.mutate({ created_by: "dev-admin" })}
        />
        {createVersion.isError && <InlineError>{(createVersion.error as Error).message}</InlineError>}
      </>
    );
  }

  if (isError || !graph) {
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

  const selectedNode = graph.nodes.find((node) => node.class_id === selectedClassId) ?? graph.nodes[0];
  const selectedClass = selectedNode ? graph.classes?.find((ontologyClass) => ontologyClass.id === selectedNode.class_id) : undefined;
  const selectedProperties = selectedNode ? graph.properties.filter((property) => property.class_id === selectedNode.class_id) : [];
  const selectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.source_class_id === selectedNode.class_id || edge.target_class_id === selectedNode.class_id)
    : [];
  const relationTargetOptions = selectedNode ? graph.nodes.filter((node) => node.class_id !== selectedNode.class_id) : [];
  const resolvedRelationTargetClassId =
    relationTargetOptions.find((node) => node.class_id === relationTargetClassId)?.class_id ?? relationTargetOptions[0]?.class_id ?? "";
  const authoringError = [createVersion.error, createClass.error, createProperty.error, createRelation.error].find(Boolean) as Error | undefined;
  const isDraftVersion = graph.version_status === "DRAFT";
  const canCreateClass = isDraftVersion && className.trim().length > 0 && !createClass.isPending;
  const canCreateProperty =
    isDraftVersion && Boolean(selectedNode) && propertyName.trim().length > 0 && !createProperty.isPending;
  const canCreateRelation =
    isDraftVersion && Boolean(selectedNode) && Boolean(resolvedRelationTargetClassId) && relationName.trim().length > 0 && !createRelation.isPending;
  const nextClassPosition = { x: 120 + graph.nodes.length * 190, y: 120 + graph.nodes.length * 44 };
  const nextClassName = `Class${graph.nodes.length + 2}`;

  function handleCreateClass() {
    if (!canCreateClass) {
      return;
    }

    createClass.mutate(
      {
        name: className.trim(),
        label: className.trim(),
        description: null,
        position: nextClassPosition,
      },
      {
        onSuccess: (ontologyClass) => {
          setSelectedClassId(ontologyClass.id);
          setClassName(nextClassName);
        },
      },
    );
  }

  function handleCreateProperty() {
    if (!canCreateProperty || !selectedNode) {
      return;
    }

    createProperty.mutate(
      {
        class_id: selectedNode.class_id,
        name: propertyName.trim(),
        label: propertyName.trim(),
        description: null,
        data_type: propertyDataType,
        cardinality: propertyCardinality,
        required: propertyCardinality === "REQUIRED",
      },
      {
        onSuccess: () => {
          setPropertyName(`${propertyName.trim()}_next`);
        },
      },
    );
  }

  function handleCreateRelation() {
    if (!canCreateRelation || !selectedNode) {
      return;
    }

    createRelation.mutate(
      {
        name: relationName.trim(),
        label: relationName.trim(),
        description: null,
        domain_class_id: selectedNode.class_id,
        range_class_id: resolvedRelationTargetClassId,
        cardinality: relationCardinality,
        required: false,
      },
      {
        onSuccess: () => {
          setRelationName(`${relationName.trim()}_NEXT`);
        },
      },
    );
  }

  const authoringPanel = (
    <HanaCard title="Authoring actions" description="MVP 1 actual API smoke를 위한 최소 draft/class/property/relation 생성 패널입니다.">
      <AuthoringGrid>
        <Field>
          <span>Class</span>
          <HanaInput value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Company" />
        </Field>
        <ButtonSlot>
          <HanaButton variant="primary" type="button" disabled={!canCreateClass} onClick={handleCreateClass}>
            <Plus aria-hidden="true" />
            {createClass.isPending ? "Creating" : "Create class"}
          </HanaButton>
        </ButtonSlot>
        <Field>
          <span>Property</span>
          <HanaInput value={propertyName} onChange={(event) => setPropertyName(event.target.value)} placeholder="company_name" disabled={!selectedNode} />
        </Field>
        <Field>
          <span>Data type</span>
          <HanaSelect value={propertyDataType} onChange={(event) => setPropertyDataType(event.target.value as PropertyDataType)} disabled={!selectedNode}>
            {dataTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </HanaSelect>
        </Field>
        <Field>
          <span>Property cardinality</span>
          <HanaSelect value={propertyCardinality} onChange={(event) => setPropertyCardinality(event.target.value as Cardinality)} disabled={!selectedNode}>
            {cardinalityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </HanaSelect>
        </Field>
        <ButtonSlot>
          <HanaButton type="button" disabled={!canCreateProperty} onClick={handleCreateProperty}>
            {createProperty.isPending ? "Creating" : "Create property"}
          </HanaButton>
        </ButtonSlot>
        <Field>
          <span>Relation</span>
          <HanaInput value={relationName} onChange={(event) => setRelationName(event.target.value)} placeholder="HAS_DEPARTMENT" disabled={!selectedNode} />
        </Field>
        <Field>
          <span>Target class</span>
          <HanaSelect
            value={resolvedRelationTargetClassId}
            onChange={(event) => setRelationTargetClassId(event.target.value)}
            disabled={relationTargetOptions.length === 0}
          >
            {relationTargetOptions.length === 0 ? (
              <option value="">Need another class</option>
            ) : (
              relationTargetOptions.map((node) => (
                <option key={node.class_id} value={node.class_id}>
                  {node.label}
                </option>
              ))
            )}
          </HanaSelect>
        </Field>
        <Field>
          <span>Relation cardinality</span>
          <HanaSelect value={relationCardinality} onChange={(event) => setRelationCardinality(event.target.value as Cardinality)} disabled={!selectedNode}>
            {cardinalityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </HanaSelect>
        </Field>
        <ButtonSlot>
          <HanaButton type="button" disabled={!canCreateRelation} onClick={handleCreateRelation}>
            {createRelation.isPending ? "Creating" : "Create relation"}
          </HanaButton>
        </ButtonSlot>
      </AuthoringGrid>
      {!isDraftVersion && <InlineNotice>Published/archived ontology version은 읽기 전용입니다. 새 draft version에서 수정하세요.</InlineNotice>}
      {authoringError && <InlineError>{authoringError.message}</InlineError>}
    </HanaCard>
  );

  if (graph.nodes.length === 0) {
    return (
      <>
        <PageHeader title="Ontology Modeler" description="클래스 node, 관계 edge, 속성 정의를 실제 API boundary로 작성합니다.">
          <HanaBadge tone={statusToTone(graph.version_status)}>{graph.version_status}</HanaBadge>
        </PageHeader>
        {authoringPanel}
        <PageState kind="empty" title="클래스가 없습니다" description="Create class 액션으로 OntologyClass를 만들면 그래프에 node로 표시됩니다." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Ontology Modeler" description="클래스 node, 관계 edge, 속성 정의를 실제 API boundary와 같은 DTO로 작성합니다.">
        <HanaBadge tone={statusToTone(graph.version_status)}>{graph.version_status}</HanaBadge>
        <HanaButton variant="primary" type="button" disabled={!canCreateClass} onClick={handleCreateClass}>
          <Plus aria-hidden="true" />
          {createClass.isPending ? "Creating" : "Add Class"}
        </HanaButton>
      </PageHeader>
      {authoringPanel}
      <ModelerGrid>
        <LeftPanel>
          <PanelHeader>
            <h2>Classes</h2>
            <HanaBadge tone="neutral">{graph.nodes.length}</HanaBadge>
          </PanelHeader>
          <SearchBox>
            <Search aria-hidden="true" />
            <HanaInput placeholder="Search class" />
          </SearchBox>
          <EntityList>
            {graph.nodes.map((graphNode) => (
              <button
                key={graphNode.id}
                type="button"
                data-selected={graphNode.class_id === selectedNode.class_id}
                onClick={() => setSelectedClassId(graphNode.class_id)}
              >
                <strong>{graphNode.label}</strong>
                <span>{graphNode.class_id}</span>
                <HanaBadge tone={statusToTone(graphNode.status)}>{graphNode.status}</HanaBadge>
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
            <h2>{selectedNode.label}</h2>
            <HanaBadge tone={statusToTone(selectedNode.status)}>{selectedNode.status}</HanaBadge>
          </PanelHeader>
          <Description>{selectedClass?.description ?? "Canonical OntologyGraph node payload에서 선택된 class입니다."}</Description>
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
                  <HanaBadge tone={statusToTone(property.status)}>{property.status}</HanaBadge>
                </DetailRow>
              ))
            )}
          </DetailGroup>
          <DetailGroup>
            <h3>Relations</h3>
            {selectedEdges.map((edge) => (
              <DetailRow key={edge.id}>
                <div>
                  <strong>{edge.label}</strong>
                  <span>
                    {edge.source_class_id} → {edge.target_class_id} · {edge.cardinality}
                  </span>
                </div>
                <HanaBadge tone={statusToTone(edge.status)}>{edge.status}</HanaBadge>
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

const AuthoringGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 1.1fr) minmax(120px, auto) minmax(160px, 1.1fr) minmax(140px, 0.9fr) minmax(170px, 1fr) minmax(130px, auto);
  gap: ${({ theme }) => theme.spacing.md};
  align-items: end;
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1240px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    text-transform: uppercase;
  }
`;

const ButtonSlot = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const InlineNotice = styled.p`
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const InlineError = styled.p`
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.danger};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;
