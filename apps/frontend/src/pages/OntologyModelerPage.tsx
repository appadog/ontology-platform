import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Edge, Node } from "react-flow-renderer";
import styled, { useTheme } from "styled-components";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  useCreateOntologyClass,
  useCreateOntologyProperty,
  useCreateOntologyRelation,
  useCreateOntologyVersion,
  useDeleteOntologyClass,
  useDeleteOntologyProperty,
  useDeleteOntologyRelation,
  useOntologyGraph,
  useOntologyVersions,
  useProject,
  useUpdateOntologyClass,
  useUpdateOntologyProperty,
  useUpdateOntologyRelation,
} from "../shared/api/queries";
import { Cardinality, OntologyClass, OntologyProperty, OntologyRelation, PropertyDataType } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";

const dataTypeOptions: PropertyDataType[] = ["STRING", "TEXT", "INTEGER", "FLOAT", "BOOLEAN", "DATE", "DATETIME", "URI"];
const cardinalityOptions: Cardinality[] = [
  "ONE_TO_ONE",
  "ONE_TO_MANY",
  "MANY_TO_ONE",
  "MANY_TO_MANY",
  "OPTIONAL",
  "REQUIRED",
  "MULTIPLE",
];

// F5: friendlier, non-clipping labels for the cardinality selects. The option
// value stays the Cardinality enum (never renamed); only the visible text is
// shortened/glossed so "MANY_TO_MANY" no longer truncates to "MANY_TO_MA".
const cardinalityLabels: Record<Cardinality, string> = {
  ONE_TO_ONE: "1:1 (일대일)",
  ONE_TO_MANY: "1:N (일대다)",
  MANY_TO_ONE: "N:1 (다대일)",
  MANY_TO_MANY: "N:N (다대다)",
  OPTIONAL: "선택 (optional)",
  REQUIRED: "필수 (required)",
  MULTIPLE: "다중 (multiple)",
};

function cardinalityLabel(option: Cardinality) {
  return cardinalityLabels[option] ?? option;
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function OntologyModelerPage() {
  const theme = useTheme();
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const projectName = projectQuery.data?.name ?? "프로젝트";
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRelationId, setSelectedRelationId] = useState("");
  const [className, setClassName] = useState("Company");
  const [propertyName, setPropertyName] = useState("company_name");
  const [propertyDataType, setPropertyDataType] = useState<PropertyDataType>("STRING");
  const [propertyCardinality, setPropertyCardinality] = useState<Cardinality>("OPTIONAL");
  const [relationName, setRelationName] = useState("RELATED_TO");
  const [relationCardinality, setRelationCardinality] = useState<Cardinality>("MANY_TO_MANY");
  const [relationTargetClassId, setRelationTargetClassId] = useState("");
  const [classForm, setClassForm] = useState({ name: "", label: "", description: "", x: "0", y: "0" });
  const [propertyForm, setPropertyForm] = useState({
    label: "",
    description: "",
    data_type: "STRING" as PropertyDataType,
    cardinality: "OPTIONAL" as Cardinality,
    required: false,
  });
  const [relationForm, setRelationForm] = useState({
    label: "",
    description: "",
    domain_class_id: "",
    range_class_id: "",
    cardinality: "MANY_TO_MANY" as Cardinality,
    required: false,
  });

  const { data: versions, isLoading: isVersionsLoading, isError: isVersionsError } = useOntologyVersions(projectId);
  const versionId = versions?.[0]?.id ?? "";
  const { data: graph, isLoading, isError, refetch } = useOntologyGraph(versionId);
  const createVersion = useCreateOntologyVersion(projectId);
  const createClass = useCreateOntologyClass(versionId);
  const updateClass = useUpdateOntologyClass(versionId);
  const deleteClass = useDeleteOntologyClass(versionId);
  const createProperty = useCreateOntologyProperty(versionId);
  const updateProperty = useUpdateOntologyProperty(versionId);
  const deleteProperty = useDeleteOntologyProperty(versionId);
  const createRelation = useCreateOntologyRelation(versionId);
  const updateRelation = useUpdateOntologyRelation(versionId);
  const deleteRelation = useDeleteOntologyRelation(versionId);

  const classRecords = useMemo<OntologyClass[]>(() => {
    if (!graph) {
      return [];
    }

    return (
      graph.classes ??
      graph.nodes.map((node) => ({
        id: node.class_id,
        version_id: graph.version_id,
        name: node.label,
        label: node.label,
        description: null,
        status: node.status,
        position: node.position,
        created_at: "",
        updated_at: "",
      }))
    ).filter((ontologyClass) => ontologyClass.status !== "DELETED");
  }, [graph]);

  const visibleNodes = useMemo(() => {
    if (!graph) {
      return [];
    }

    return graph.nodes.filter((node) => node.status !== "DELETED");
  }, [graph]);

  const visibleClassIds = useMemo(() => new Set(visibleNodes.map((node) => node.class_id)), [visibleNodes]);

  const relationRecords = useMemo<OntologyRelation[]>(() => {
    if (!graph) {
      return [];
    }

    return (
      graph.relations ??
      graph.edges.map((edge) => ({
        id: edge.relation_id,
        version_id: graph.version_id,
        name: edge.label,
        label: edge.label,
        description: null,
        domain_class_id: edge.source_class_id,
        range_class_id: edge.target_class_id,
        cardinality: edge.cardinality,
        required: false,
        status: edge.status,
        created_at: "",
        updated_at: "",
      }))
    ).filter(
      (relation) =>
        relation.status !== "DELETED" &&
        visibleClassIds.has(relation.domain_class_id) &&
        visibleClassIds.has(relation.range_class_id),
    );
  }, [graph, visibleClassIds]);

  const visibleEdges = useMemo(() => {
    if (!graph) {
      return [];
    }

    return graph.edges.filter(
      (edge) =>
        edge.status !== "DELETED" &&
        visibleClassIds.has(edge.source_class_id) &&
        visibleClassIds.has(edge.target_class_id),
    );
  }, [graph, visibleClassIds]);

  const visibleProperties = useMemo(() => {
    if (!graph) {
      return [];
    }

    return graph.properties.filter((property) => property.status !== "DELETED" && visibleClassIds.has(property.class_id));
  }, [graph, visibleClassIds]);

  const selectedNode = visibleNodes.find((node) => node.class_id === selectedClassId) ?? visibleNodes[0];
  const selectedClass = selectedNode ? classRecords.find((ontologyClass) => ontologyClass.id === selectedNode.class_id) : undefined;
  const selectedProperties = selectedNode
    ? visibleProperties.filter((property) => property.class_id === selectedNode.class_id)
    : [];
  const selectedProperty =
    selectedProperties.find((property) => property.id === selectedPropertyId) ?? selectedProperties[0];
  const selectedRelations = selectedNode
    ? relationRecords.filter(
        (relation) =>
          relation.domain_class_id === selectedNode.class_id || relation.range_class_id === selectedNode.class_id,
      )
    : [];
  const selectedRelation =
    selectedRelations.find((relation) => relation.id === selectedRelationId) ?? selectedRelations[0];
  const relationTargetOptions = selectedNode ? visibleNodes.filter((node) => node.class_id !== selectedNode.class_id) : [];
  const resolvedRelationTargetClassId =
    relationTargetOptions.find((node) => node.class_id === relationTargetClassId)?.class_id ?? relationTargetOptions[0]?.class_id ?? "";
  const isDraftVersion = graph?.version_status === "DRAFT";

  useEffect(() => {
    if (!selectedClassId && visibleNodes[0]) {
      setSelectedClassId(visibleNodes[0].class_id);
      return;
    }

    if (selectedClassId && !visibleNodes.some((node) => node.class_id === selectedClassId)) {
      setSelectedClassId(visibleNodes[0]?.class_id ?? "");
    }
  }, [selectedClassId, visibleNodes]);

  useEffect(() => {
    setSelectedPropertyId((current) => {
      if (!selectedProperties.length) {
        return "";
      }
      return selectedProperties.some((property) => property.id === current) ? current : selectedProperties[0].id;
    });
  }, [selectedProperties]);

  useEffect(() => {
    setSelectedRelationId((current) => {
      if (!selectedRelations.length) {
        return "";
      }
      return selectedRelations.some((relation) => relation.id === current) ? current : selectedRelations[0].id;
    });
  }, [selectedRelations]);

  useEffect(() => {
    if (!selectedClass) {
      return;
    }

    setClassForm({
      name: selectedClass.name,
      label: selectedClass.label,
      description: selectedClass.description ?? "",
      x: String(selectedClass.position.x),
      y: String(selectedClass.position.y),
    });
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedProperty) {
      return;
    }

    setPropertyForm({
      label: selectedProperty.label,
      description: selectedProperty.description ?? "",
      data_type: selectedProperty.data_type,
      cardinality: selectedProperty.cardinality,
      required: selectedProperty.required,
    });
  }, [selectedProperty]);

  useEffect(() => {
    if (!selectedRelation) {
      return;
    }

    setRelationForm({
      label: selectedRelation.label,
      description: selectedRelation.description ?? "",
      domain_class_id: selectedRelation.domain_class_id,
      range_class_id: selectedRelation.range_class_id,
      cardinality: selectedRelation.cardinality,
      required: selectedRelation.required,
    });
  }, [selectedRelation]);

  const nodes = useMemo<Node[]>(() => {
    return visibleNodes.map((graphNode) => ({
      id: graphNode.class_id,
      type: "default",
      position: graphNode.position,
      data: {
        label: (
          <GraphNodeLabel>
            <strong>{graphNode.label}</strong>
            <span>{graphNode.class_id}</span>
            <StatusBadge token={graphNode.status} tone={statusToTone(graphNode.status)} />
          </GraphNodeLabel>
        ),
      },
      style: {
        borderColor: graphNode.status === "ACTIVE" || graphNode.status === "DRAFT" ? theme.color.graphNode : theme.color.borderStrong,
        borderRadius: 8,
        borderWidth: 2,
        padding: 0,
        width: 178,
      },
    }));
  }, [theme, visibleNodes]);

  const edges = useMemo<Edge[]>(() => {
    return visibleEdges.map((edge) => ({
      id: edge.id,
      source: edge.source_class_id,
      target: edge.target_class_id,
      label: edge.label,
      animated: edge.status === "DRAFT",
      arrowHeadType: "arrowclosed",
      style: {
        stroke: edge.status === "ACTIVE" || edge.status === "DRAFT" ? theme.color.graphRelation : theme.color.borderStrong,
        strokeWidth: 2,
      },
    }));
  }, [theme, visibleEdges]);

  if (!projectId) {
    return (
      <PageState
        kind="empty"
        title="Project context가 필요합니다"
        description="Projects에서 작업할 Project를 선택한 뒤 Ontology 초안을 구성하세요."
        actionLabel="Projects로 이동"
        onAction={() => {
          window.location.assign("/projects");
        }}
      />
    );
  }

  if (isVersionsLoading || (versionId && isLoading)) {
    return <PageState kind="loading" title="온톨로지 모델러를 불러오는 중" description="버전, 클래스, 관계, 속성 그래프를 준비하고 있습니다." />;
  }

  if (isVersionsError) {
    return (
      <PageState
        kind="error"
        title="온톨로지 버전을 불러오지 못했습니다"
        description="프로젝트의 ontology draft 목록을 다시 열어 주세요."
      />
    );
  }

  if (!versionId) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: projectName, to: `/projects/${projectId}` },
            { label: "Ontology" },
          ]}
        />
        <PageHeader title="Ontology 모델러" description="Draft version을 만들면 class, property, relation을 구성할 수 있습니다.">
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
          description="새 draft version을 만든 뒤 class부터 추가하세요."
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
        description="버전 상태를 확인한 뒤 그래프를 다시 불러오세요."
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  const authoringError = [
    createVersion.error,
    createClass.error,
    updateClass.error,
    deleteClass.error,
    createProperty.error,
    updateProperty.error,
    deleteProperty.error,
    createRelation.error,
    updateRelation.error,
    deleteRelation.error,
  ].find(Boolean) as Error | undefined;
  const canCreateClass = isDraftVersion && className.trim().length > 0 && !createClass.isPending;
  const canCreateProperty =
    isDraftVersion && Boolean(selectedNode) && propertyName.trim().length > 0 && !createProperty.isPending;
  const canCreateRelation =
    isDraftVersion && Boolean(selectedNode) && Boolean(resolvedRelationTargetClassId) && relationName.trim().length > 0 && !createRelation.isPending;
  const nextClassPosition = { x: 120 + visibleNodes.length * 190, y: 120 + visibleNodes.length * 44 };
  const nextClassName = `Class${visibleNodes.length + 2}`;

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
        onSuccess: (property) => {
          setSelectedPropertyId(property.id);
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
        onSuccess: (relation) => {
          setSelectedRelationId(relation.id);
          setRelationName(`${relationName.trim()}_NEXT`);
        },
      },
    );
  }

  function handleUpdateClass() {
    if (!isDraftVersion || !selectedClass || !classForm.name.trim()) {
      return;
    }

    updateClass.mutate({
      classId: selectedClass.id,
      payload: {
        name: classForm.name.trim(),
        label: classForm.label.trim() || classForm.name.trim(),
        description: nullableText(classForm.description),
        position: {
          x: toNumber(classForm.x, selectedClass.position.x),
          y: toNumber(classForm.y, selectedClass.position.y),
        },
      },
    });
  }

  function handleDeleteClass() {
    if (!isDraftVersion || !selectedClass) {
      return;
    }

    const relatedPropertyCount = visibleProperties.filter((property) => property.class_id === selectedClass.id).length;
    const inboundRelationCount = relationRecords.filter((relation) => relation.range_class_id === selectedClass.id).length;
    const outboundRelationCount = relationRecords.filter((relation) => relation.domain_class_id === selectedClass.id).length;

    const confirmed = window.confirm(
      [
        "Delete draft class",
        `Class: ${selectedClass.label} (${selectedClass.name})`,
        `Affected properties: ${relatedPropertyCount}`,
        `Inbound relations: ${inboundRelationCount}`,
        `Outbound relations: ${outboundRelationCount}`,
        "This action applies only to the current DRAFT version.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    const nextClassId = visibleNodes.find((node) => node.class_id !== selectedClass.id)?.class_id ?? "";
    deleteClass.mutate(selectedClass.id, {
      onSuccess: () => {
        setSelectedClassId(nextClassId);
        setSelectedPropertyId("");
        setSelectedRelationId("");
      },
    });
  }

  function handleUpdateProperty() {
    if (!isDraftVersion || !selectedProperty) {
      return;
    }

    updateProperty.mutate({
      propertyId: selectedProperty.id,
      payload: {
        label: propertyForm.label.trim() || selectedProperty.name,
        description: nullableText(propertyForm.description),
        data_type: propertyForm.data_type,
        cardinality: propertyForm.cardinality,
        required: propertyForm.required,
      },
    });
  }

  function handleDeleteProperty() {
    if (!isDraftVersion || !selectedProperty) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Delete draft property",
        `Property: ${selectedProperty.label} (${selectedProperty.name})`,
        "This action applies only to the current DRAFT version.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    deleteProperty.mutate(selectedProperty.id, {
      onSuccess: () => setSelectedPropertyId(""),
    });
  }

  function handleUpdateRelation() {
    if (!isDraftVersion || !selectedRelation) {
      return;
    }

    updateRelation.mutate({
      relationId: selectedRelation.id,
      payload: {
        label: relationForm.label.trim() || selectedRelation.name,
        description: nullableText(relationForm.description),
        domain_class_id: relationForm.domain_class_id,
        range_class_id: relationForm.range_class_id,
        cardinality: relationForm.cardinality,
        required: relationForm.required,
      },
    });
  }

  function handleDeleteRelation() {
    if (!isDraftVersion || !selectedRelation) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Delete draft relation",
        `Relation: ${selectedRelation.label} (${selectedRelation.name})`,
        "This action applies only to the current DRAFT version.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    deleteRelation.mutate(selectedRelation.id, {
      onSuccess: () => setSelectedRelationId(""),
    });
  }

  const authoringPanel = (
    <HanaCard title="Authoring actions" description="Draft에서 class, property, relation을 순서대로 추가합니다.">
      <AuthoringGrid>
        <Field>
          <span>Class</span>
          <HanaInput value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Company" disabled={!isDraftVersion} />
        </Field>
        <ButtonSlot>
          <HanaButton variant="primary" type="button" disabled={!canCreateClass} onClick={handleCreateClass}>
            <Plus aria-hidden="true" />
            {createClass.isPending ? "Creating" : "Create class"}
          </HanaButton>
        </ButtonSlot>
        <Field>
          <span>Property</span>
          <HanaInput
            value={propertyName}
            onChange={(event) => setPropertyName(event.target.value)}
            placeholder="company_name"
            disabled={!selectedNode || !isDraftVersion}
          />
        </Field>
        <Field>
          <span>Data type</span>
          <HanaSelect
            value={propertyDataType}
            onChange={(event) => setPropertyDataType(event.target.value as PropertyDataType)}
            disabled={!selectedNode || !isDraftVersion}
          >
            {dataTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </HanaSelect>
        </Field>
        <Field>
          <span>Property cardinality</span>
          <HanaSelect
            value={propertyCardinality}
            onChange={(event) => setPropertyCardinality(event.target.value as Cardinality)}
            disabled={!selectedNode || !isDraftVersion}
          >
            {cardinalityOptions.map((option) => (
              <option key={option} value={option}>
                {cardinalityLabel(option)}
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
          <HanaInput
            value={relationName}
            onChange={(event) => setRelationName(event.target.value)}
            placeholder="HAS_DEPARTMENT"
            disabled={!selectedNode || !isDraftVersion}
          />
        </Field>
        <Field>
          <span>Target class</span>
          <HanaSelect
            value={resolvedRelationTargetClassId}
            onChange={(event) => setRelationTargetClassId(event.target.value)}
            disabled={relationTargetOptions.length === 0 || !isDraftVersion}
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
          <HanaSelect
            value={relationCardinality}
            onChange={(event) => setRelationCardinality(event.target.value as Cardinality)}
            disabled={!selectedNode || !isDraftVersion}
          >
            {cardinalityOptions.map((option) => (
              <option key={option} value={option}>
                {cardinalityLabel(option)}
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
      {!isDraftVersion && (
        <ReadOnlyBar>
          <span>Published/archived version은 읽기 전용입니다.</span>
          <HanaButton
            type="button"
            variant="primary"
            disabled={createVersion.isPending}
            onClick={() => createVersion.mutate({ created_by: "dev-admin" })}
          >
            <Plus aria-hidden="true" />
            {createVersion.isPending ? "Creating" : "Create Draft Version"}
          </HanaButton>
        </ReadOnlyBar>
      )}
      {authoringError && <InlineError>{authoringError.message}</InlineError>}
    </HanaCard>
  );

  if (visibleNodes.length === 0) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: projectName, to: `/projects/${projectId}` },
            { label: "Ontology" },
          ]}
        />
        <PageHeader title="Ontology 모델러" description="Draft graph에 class를 추가해 모델링을 시작합니다.">
          <StatusBadge token={graph.version_status} tone={statusToTone(graph.version_status)} />
        </PageHeader>
        {authoringPanel}
        <PageState
          kind="empty"
          title="클래스가 없습니다"
          description="Create class 후 property와 relation을 이어서 구성하세요."
          actionLabel={isDraftVersion ? "Create class" : "Create draft version"}
          onAction={isDraftVersion ? handleCreateClass : () => createVersion.mutate({ created_by: "dev-admin" })}
        />
      </>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectName, to: `/projects/${projectId}` },
          { label: "Ontology" },
        ]}
      />
      <PageHeader title="Ontology 모델러" description="Draft graph에서 class, property, relation을 생성하고 다듬습니다.">
        <StatusBadge token={graph.version_status} tone={statusToTone(graph.version_status)} />
        {!isDraftVersion && (
          <HanaButton type="button" variant="primary" disabled={createVersion.isPending} onClick={() => createVersion.mutate({ created_by: "dev-admin" })}>
            <Plus aria-hidden="true" />
            {createVersion.isPending ? "Creating" : "Create Draft Version"}
          </HanaButton>
        )}
        {isDraftVersion && (
          <HanaButton variant="primary" type="button" disabled={!canCreateClass} onClick={handleCreateClass}>
            <Plus aria-hidden="true" />
            {createClass.isPending ? "Creating" : "Add Class"}
          </HanaButton>
        )}
      </PageHeader>
      {authoringPanel}
      <ModelerGrid>
        <LeftPanel>
          <PanelHeader>
            <h2>Classes</h2>
            <HanaBadge tone="neutral">{visibleNodes.length}</HanaBadge>
          </PanelHeader>
          <SearchBox>
            <Search aria-hidden="true" />
            <HanaInput placeholder="Search class" />
          </SearchBox>
          <EntityList>
            {visibleNodes.map((graphNode) => (
              <button
                key={graphNode.id}
                type="button"
                data-selected={graphNode.class_id === selectedNode.class_id}
                onClick={() => setSelectedClassId(graphNode.class_id)}
              >
                <strong>{graphNode.label}</strong>
                <span>{graphNode.class_id}</span>
                <StatusBadge token={graphNode.status} tone={statusToTone(graphNode.status)} />
              </button>
            ))}
          </EntityList>
        </LeftPanel>
        <CanvasCard>
          <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} onNodeClick={(_, node) => setSelectedClassId(node.id)}>
            <Background gap={18} color={theme.color.border} />
            <Controls />
          </ReactFlow>
        </CanvasCard>
        <RightPanel>
          <PanelHeader>
            <h2>{selectedNode.label}</h2>
            <StatusBadge token={selectedNode.status} tone={statusToTone(selectedNode.status)} />
          </PanelHeader>
          <PanelSection>
            <SectionTitle>Class detail</SectionTitle>
            <EditGrid>
              <Field>
                <span>Name</span>
                <HanaInput value={classForm.name} disabled={!isDraftVersion} onChange={(event) => setClassForm((form) => ({ ...form, name: event.target.value }))} />
              </Field>
              <Field>
                <span>Label</span>
                <HanaInput value={classForm.label} disabled={!isDraftVersion} onChange={(event) => setClassForm((form) => ({ ...form, label: event.target.value }))} />
              </Field>
              <Field>
                <span>Description</span>
                <HanaInput
                  value={classForm.description}
                  disabled={!isDraftVersion}
                  onChange={(event) => setClassForm((form) => ({ ...form, description: event.target.value }))}
                />
              </Field>
              <CoordinateRow>
                <Field>
                  <span>X</span>
                  <HanaInput value={classForm.x} disabled={!isDraftVersion} onChange={(event) => setClassForm((form) => ({ ...form, x: event.target.value }))} />
                </Field>
                <Field>
                  <span>Y</span>
                  <HanaInput value={classForm.y} disabled={!isDraftVersion} onChange={(event) => setClassForm((form) => ({ ...form, y: event.target.value }))} />
                </Field>
              </CoordinateRow>
            </EditGrid>
            <ActionRow>
              <HanaButton type="button" disabled={!isDraftVersion || updateClass.isPending || !classForm.name.trim()} onClick={handleUpdateClass}>
                <Save aria-hidden="true" />
                {updateClass.isPending ? "Saving" : "Save class"}
              </HanaButton>
              <HanaButton type="button" variant="danger" disabled={!isDraftVersion || deleteClass.isPending} onClick={handleDeleteClass}>
                <Trash2 aria-hidden="true" />
                {deleteClass.isPending ? "Deleting" : "Delete class"}
              </HanaButton>
            </ActionRow>
          </PanelSection>
          <PanelSection>
            <SectionTitle>Properties</SectionTitle>
            {selectedProperties.length === 0 ? (
              <SmallEmpty>{isDraftVersion ? "Create property로 선택 class의 속성을 추가하세요." : "등록된 속성이 없습니다."}</SmallEmpty>
            ) : (
              <SelectableList>
                {selectedProperties.map((property) => (
                  <SelectableRow
                    key={property.id}
                    type="button"
                    data-selected={property.id === selectedProperty?.id}
                    onClick={() => setSelectedPropertyId(property.id)}
                  >
                    <strong>{property.label}</strong>
                    <span>
                      {property.data_type} · {property.cardinality}
                    </span>
                  </SelectableRow>
                ))}
              </SelectableList>
            )}
            {selectedProperty && (
              <>
                <EditGrid>
                  <Field>
                    <span>Label</span>
                    <HanaInput value={propertyForm.label} disabled={!isDraftVersion} onChange={(event) => setPropertyForm((form) => ({ ...form, label: event.target.value }))} />
                  </Field>
                  <Field>
                    <span>Description</span>
                    <HanaInput
                      value={propertyForm.description}
                      disabled={!isDraftVersion}
                      onChange={(event) => setPropertyForm((form) => ({ ...form, description: event.target.value }))}
                    />
                  </Field>
                  <Field>
                    <span>Data type</span>
                    <HanaSelect
                      value={propertyForm.data_type}
                      disabled={!isDraftVersion}
                      onChange={(event) => setPropertyForm((form) => ({ ...form, data_type: event.target.value as PropertyDataType }))}
                    >
                      {dataTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </HanaSelect>
                  </Field>
                  <Field>
                    <span>Cardinality</span>
                    <HanaSelect
                      value={propertyForm.cardinality}
                      disabled={!isDraftVersion}
                      onChange={(event) => setPropertyForm((form) => ({ ...form, cardinality: event.target.value as Cardinality }))}
                    >
                      {cardinalityOptions.map((option) => (
                        <option key={option} value={option}>
                          {cardinalityLabel(option)}
                        </option>
                      ))}
                    </HanaSelect>
                  </Field>
                  <CheckField>
                    <input
                      type="checkbox"
                      checked={propertyForm.required}
                      disabled={!isDraftVersion}
                      onChange={(event) => setPropertyForm((form) => ({ ...form, required: event.target.checked }))}
                    />
                    Required
                  </CheckField>
                </EditGrid>
                <ActionRow>
                  <HanaButton type="button" disabled={!isDraftVersion || updateProperty.isPending} onClick={handleUpdateProperty}>
                    <Save aria-hidden="true" />
                    {updateProperty.isPending ? "Saving" : "Save property"}
                  </HanaButton>
                  <HanaButton type="button" variant="danger" disabled={!isDraftVersion || deleteProperty.isPending} onClick={handleDeleteProperty}>
                    <Trash2 aria-hidden="true" />
                    {deleteProperty.isPending ? "Deleting" : "Delete property"}
                  </HanaButton>
                </ActionRow>
              </>
            )}
          </PanelSection>
          <PanelSection>
            <SectionTitle>Relations</SectionTitle>
            {selectedRelations.length === 0 ? (
              <SmallEmpty>{isDraftVersion ? "Create relation으로 class 간 연결을 추가하세요." : "등록된 관계가 없습니다."}</SmallEmpty>
            ) : (
              <SelectableList>
                {selectedRelations.map((relation) => (
                  <SelectableRow
                    key={relation.id}
                    type="button"
                    data-selected={relation.id === selectedRelation?.id}
                    onClick={() => setSelectedRelationId(relation.id)}
                  >
                    <strong>{relation.label}</strong>
                    <span>
                      {relation.domain_class_id} → {relation.range_class_id}
                    </span>
                  </SelectableRow>
                ))}
              </SelectableList>
            )}
            {selectedRelation && (
              <>
                <EditGrid>
                  <Field>
                    <span>Label</span>
                    <HanaInput value={relationForm.label} disabled={!isDraftVersion} onChange={(event) => setRelationForm((form) => ({ ...form, label: event.target.value }))} />
                  </Field>
                  <Field>
                    <span>Description</span>
                    <HanaInput
                      value={relationForm.description}
                      disabled={!isDraftVersion}
                      onChange={(event) => setRelationForm((form) => ({ ...form, description: event.target.value }))}
                    />
                  </Field>
                  <Field>
                    <span>Domain</span>
                    <HanaSelect
                      value={relationForm.domain_class_id}
                      disabled={!isDraftVersion}
                      onChange={(event) => setRelationForm((form) => ({ ...form, domain_class_id: event.target.value }))}
                    >
                      {visibleNodes.map((node) => (
                        <option key={node.class_id} value={node.class_id}>
                          {node.label}
                        </option>
                      ))}
                    </HanaSelect>
                  </Field>
                  <Field>
                    <span>Range</span>
                    <HanaSelect
                      value={relationForm.range_class_id}
                      disabled={!isDraftVersion}
                      onChange={(event) => setRelationForm((form) => ({ ...form, range_class_id: event.target.value }))}
                    >
                      {visibleNodes.map((node) => (
                        <option key={node.class_id} value={node.class_id}>
                          {node.label}
                        </option>
                      ))}
                    </HanaSelect>
                  </Field>
                  <Field>
                    <span>Cardinality</span>
                    <HanaSelect
                      value={relationForm.cardinality}
                      disabled={!isDraftVersion}
                      onChange={(event) => setRelationForm((form) => ({ ...form, cardinality: event.target.value as Cardinality }))}
                    >
                      {cardinalityOptions.map((option) => (
                        <option key={option} value={option}>
                          {cardinalityLabel(option)}
                        </option>
                      ))}
                    </HanaSelect>
                  </Field>
                  <CheckField>
                    <input
                      type="checkbox"
                      checked={relationForm.required}
                      disabled={!isDraftVersion}
                      onChange={(event) => setRelationForm((form) => ({ ...form, required: event.target.checked }))}
                    />
                    Required
                  </CheckField>
                </EditGrid>
                <ActionRow>
                  <HanaButton type="button" disabled={!isDraftVersion || updateRelation.isPending} onClick={handleUpdateRelation}>
                    <Save aria-hidden="true" />
                    {updateRelation.isPending ? "Saving" : "Save relation"}
                  </HanaButton>
                  <HanaButton type="button" variant="danger" disabled={!isDraftVersion || deleteRelation.isPending} onClick={handleDeleteRelation}>
                    <Trash2 aria-hidden="true" />
                    {deleteRelation.isPending ? "Deleting" : "Delete relation"}
                  </HanaButton>
                </ActionRow>
              </>
            )}
          </PanelSection>
        </RightPanel>
      </ModelerGrid>
    </>
  );
}

const ModelerGrid = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(420px, 1fr) 360px;
  gap: 14px;
  min-height: 680px;

  @media (max-width: 1280px) {
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

const PanelSection = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 13px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textMuted};
`;

const EditGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CoordinateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SelectableList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SelectableRow = styled.button`
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 10px;
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

const CheckField = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ButtonSlot = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const ReadOnlyBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const InlineError = styled.p`
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.danger};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;
