import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateExtractionJob, useOntologyVersions, usePromptTemplates, usePromptVersions, useSources } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { ButtonSlot, Field, FormGrid, InlineList, KeyValueGrid, Mono, MutedText } from "./mvp2Shared";

const fixtureOptions = [
  {
    id: "default",
    label: "Success",
    expectedStatus: "SUCCESS",
    tone: "success" as const,
    summary: "normal candidate and evidence",
  },
  {
    id: "partial_invalid",
    label: "Partial failure",
    expectedStatus: "PARTIAL_FAILED",
    tone: "warning" as const,
    summary: "warning candidate without evidence",
  },
  {
    id: "invalid_evidence_reference",
    label: "Broken evidence",
    expectedStatus: "PARTIAL_FAILED",
    tone: "warning" as const,
    summary: "candidate with unresolved evidence link",
  },
  {
    id: "missing",
    label: "Missing fixture",
    expectedStatus: "FAILED",
    tone: "danger" as const,
    summary: "fixture-not-found failure path",
  },
] as const;

type FixtureId = (typeof fixtureOptions)[number]["id"];

export function ExtractionJobCreatePage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [sourceId, setSourceId] = useState("");
  const [ontologyVersionId, setOntologyVersionId] = useState("");
  const [promptId, setPromptId] = useState("");
  const [promptVersionId, setPromptVersionId] = useState("");
  const [modelName, setModelName] = useState("mock-deterministic");
  const [fixtureId, setFixtureId] = useState<FixtureId>("default");
  const { data: sources, isLoading: isSourcesLoading, isError: isSourcesError, refetch: refetchSources } = useSources(projectId);
  const { data: versions, isLoading: isVersionsLoading, isError: isVersionsError, refetch: refetchVersions } = useOntologyVersions(projectId);
  const { data: prompts, isLoading: isPromptsLoading, isError: isPromptsError, refetch: refetchPrompts } = usePromptTemplates(projectId);
  const activePromptId = promptId || prompts?.[0]?.id || "";
  const { data: promptVersions, isLoading: isPromptVersionsLoading, isError: isPromptVersionsError, refetch: refetchPromptVersions } =
    usePromptVersions(activePromptId);
  const createJob = useCreateExtractionJob(projectId);

  useEffect(() => {
    if (!sourceId && sources?.[0]) {
      setSourceId(sources[0].id);
    }
  }, [sourceId, sources]);

  useEffect(() => {
    if (!ontologyVersionId && versions?.[0]) {
      setOntologyVersionId(versions[0].id);
    }
  }, [ontologyVersionId, versions]);

  useEffect(() => {
    if (!promptId && prompts?.[0]) {
      setPromptId(prompts[0].id);
    }
  }, [promptId, prompts]);

  useEffect(() => {
    if (!promptVersionId && promptVersions?.[0]) {
      setPromptVersionId(promptVersions[0].id);
    }
  }, [promptVersionId, promptVersions]);

  const selectedSource = useMemo(() => sources?.find((source) => source.id === sourceId), [sourceId, sources]);
  const selectedVersion = useMemo(() => versions?.find((version) => version.id === ontologyVersionId), [ontologyVersionId, versions]);
  const selectedPrompt = useMemo(() => prompts?.find((prompt) => prompt.id === activePromptId), [activePromptId, prompts]);
  const selectedPromptVersion = useMemo(
    () => promptVersions?.find((version) => version.id === promptVersionId),
    [promptVersionId, promptVersions],
  );
  const selectedFixture = fixtureOptions.find((fixture) => fixture.id === fixtureId) ?? fixtureOptions[0];
  const isLoading = isSourcesLoading || isVersionsLoading || isPromptsLoading || isPromptVersionsLoading;
  const isError = isSourcesError || isVersionsError || isPromptsError || isPromptVersionsError;
  const canCreate = Boolean(sourceId && ontologyVersionId && promptVersionId && modelName.trim()) && !createJob.isPending;

  if (!projectId) {
    return (
      <PageState
        kind="empty"
        title="Project context가 필요합니다"
        description="Projects에서 작업할 project를 선택한 뒤 extraction job을 생성하세요."
        actionLabel="Go to projects"
        onAction={() => navigate("/projects")}
      />
    );
  }

  if (isLoading) {
    return <PageState kind="loading" title="Extraction job 생성 폼을 불러오는 중" description="source, ontology, prompt 선택지를 준비하고 있습니다." />;
  }

  if (isError || !sources || !versions || !prompts || !promptVersions) {
    return (
      <PageState
        kind="error"
        title="Extraction job 생성 준비에 실패했습니다"
        description="필요한 선택지를 불러오지 못했습니다."
        actionLabel="다시 시도"
        onAction={() => {
          void refetchSources();
          void refetchVersions();
          void refetchPrompts();
          void refetchPromptVersions();
        }}
      />
    );
  }

  if (sources.length === 0 || versions.length === 0 || prompts.length === 0 || promptVersions.length === 0) {
    return (
      <PageState
        kind="empty"
        title="Job 생성에 필요한 입력이 부족합니다"
        description="source, ontology version, prompt version이 모두 필요합니다."
        actionLabel={sources.length === 0 ? "Go to sources" : "Go to ontology"}
        onAction={() => navigate(sources.length === 0 ? `/projects/${projectId}/sources` : `/projects/${projectId}/ontology`)}
      />
    );
  }

  function handleCreate() {
    if (!canCreate) {
      return;
    }

    createJob.mutate(
      {
        source_id: sourceId,
        ontology_version_id: ontologyVersionId,
        prompt_version_id: promptVersionId,
        provider: "mock",
        model_name: modelName.trim(),
        fixture_id: fixtureId,
      },
      {
        onSuccess: (job) => navigate(`/extraction-jobs/${job.id}`),
      },
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: "Extraction", to: `/projects/${projectId}/extraction-jobs` },
          { label: "Create job" },
        ]}
      />
      <PageHeader title="Create Extraction Job" description="MockProvider로 source, ontology version, prompt version을 묶어 candidate extraction job을 생성합니다.">
        <HanaBadge tone="muted">MockProvider only</HanaBadge>
      </PageHeader>
      <HanaCard title="Job inputs" description="Source, ontology, prompt, fixture를 선택한 뒤 job을 생성합니다.">
        <FormGrid>
          <Field>
            <span>Source</span>
            <HanaSelect value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.file_name}
                </option>
              ))}
            </HanaSelect>
          </Field>
          <Field>
            <span>Ontology version</span>
            <HanaSelect value={ontologyVersionId} onChange={(event) => setOntologyVersionId(event.target.value)}>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.version} {version.status}
                </option>
              ))}
            </HanaSelect>
          </Field>
          <Field>
            <span>Prompt</span>
            <HanaSelect
              value={activePromptId}
              onChange={(event) => {
                setPromptId(event.target.value);
                setPromptVersionId("");
              }}
            >
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
            </HanaSelect>
          </Field>
          <Field>
            <span>Prompt version</span>
            <HanaSelect value={promptVersionId} onChange={(event) => setPromptVersionId(event.target.value)}>
              {promptVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.version} {version.is_active ? "ACTIVE" : "INACTIVE"}
                </option>
              ))}
            </HanaSelect>
          </Field>
          <Field>
            <span>Provider</span>
            <HanaSelect value="mock" disabled>
              <option value="mock">MockProvider</option>
            </HanaSelect>
          </Field>
          <Field>
            <span>Model</span>
            <HanaInput value={modelName} onChange={(event) => setModelName(event.target.value)} />
          </Field>
          <Field>
            <span>Fixture</span>
            <HanaSelect value={fixtureId} onChange={(event) => setFixtureId(event.target.value as FixtureId)}>
              {fixtureOptions.map((fixture) => (
                <option key={fixture.id} value={fixture.id}>
                  {fixture.label}
                </option>
              ))}
            </HanaSelect>
          </Field>
          <ButtonSlot>
            <HanaButton variant="primary" type="button" disabled={!canCreate} onClick={handleCreate}>
              <Sparkles aria-hidden="true" />
              {createJob.isPending ? "Creating" : "Create job"}
            </HanaButton>
          </ButtonSlot>
        </FormGrid>
      </HanaCard>
      <HanaCard title="Selected context">
        <KeyValueGrid>
          <dt>Source</dt>
          <dd>{selectedSource?.file_name ?? "-"}</dd>
          <dt>Ontology version</dt>
          <dd>{selectedVersion ? `v${selectedVersion.version} ${selectedVersion.status}` : "-"}</dd>
          <dt>Prompt</dt>
          <dd>{selectedPrompt?.name ?? "-"}</dd>
          <dt>Prompt version</dt>
          <dd>{selectedPromptVersion ? `v${selectedPromptVersion.version} ${selectedPromptVersion.is_active ? "ACTIVE" : "INACTIVE"}` : "-"}</dd>
          <dt>Fixture</dt>
          <dd>
            <InlineList>
              <HanaBadge tone={selectedFixture.tone}>{selectedFixture.label}</HanaBadge>
              <HanaBadge tone={selectedFixture.tone}>{selectedFixture.expectedStatus}</HanaBadge>
              <MutedText>
                <Mono>{selectedFixture.id}</Mono> · {selectedFixture.summary}
              </MutedText>
            </InlineList>
          </dd>
          <dt>Prompt template</dt>
          <dd>{selectedPromptVersion?.template ?? "-"}</dd>
          <dt>Provider rule</dt>
          <dd>
            <MutedText>Provider 값은 고정되어 있고 job 결과는 선택한 fixture로 재현됩니다.</MutedText>
          </dd>
        </KeyValueGrid>
      </HanaCard>
      {createJob.isError && <PageState kind="error" title="Job 생성 실패" description={(createJob.error as Error).message} />}
    </>
  );
}
