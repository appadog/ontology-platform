import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateExtractionJob, useOntologyVersions, usePromptTemplates, usePromptVersions, useSources } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { ButtonSlot, Field, FormGrid, KeyValueGrid, MutedText } from "./mvp2Shared";

export function ExtractionJobCreatePage() {
  const { projectId = "project-corp-knowledge" } = useParams();
  const navigate = useNavigate();
  const [sourceId, setSourceId] = useState("");
  const [ontologyVersionId, setOntologyVersionId] = useState("");
  const [promptId, setPromptId] = useState("");
  const [promptVersionId, setPromptVersionId] = useState("");
  const [modelName, setModelName] = useState("mock-deterministic");
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
  const isLoading = isSourcesLoading || isVersionsLoading || isPromptsLoading || isPromptVersionsLoading;
  const isError = isSourcesError || isVersionsError || isPromptsError || isPromptVersionsError;
  const canCreate = Boolean(sourceId && ontologyVersionId && promptVersionId && modelName.trim()) && !createJob.isPending;

  if (isLoading) {
    return <PageState kind="loading" title="Extraction job 생성 폼을 불러오는 중" description="source, ontology version, prompt version fixture를 조회하고 있습니다." />;
  }

  if (isError || !sources || !versions || !prompts || !promptVersions) {
    return (
      <PageState
        kind="error"
        title="Extraction job 생성 준비에 실패했습니다"
        description="MVP 2 prompt/job endpoint 또는 fixture 상태를 확인하세요."
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
    return <PageState kind="empty" title="Job 생성에 필요한 입력이 부족합니다" description="source, ontology version, prompt version이 모두 필요합니다." />;
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
        fixture_id: "default",
      },
      {
        onSuccess: (job) => navigate(`/extraction-jobs/${job.id}`),
      },
    );
  }

  return (
    <>
      <PageHeader title="Create Extraction Job" description="MockProvider로 source, ontology version, prompt version을 묶어 candidate extraction job을 생성합니다.">
        <HanaBadge tone="muted">MockProvider only</HanaBadge>
      </PageHeader>
      <HanaCard title="Job inputs" description="Backend actual API mode 전환 지점: POST /api/v1/projects/{project_id}/extraction-jobs">
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
          <dt>Prompt template</dt>
          <dd>{selectedPromptVersion?.template ?? "-"}</dd>
          <dt>Provider rule</dt>
          <dd>
            <MutedText>API payload는 provider=mock이고, 화면 label만 MockProvider를 사용합니다.</MutedText>
          </dd>
        </KeyValueGrid>
      </HanaCard>
      {createJob.isError && <PageState kind="error" title="Job 생성 실패" description={(createJob.error as Error).message} />}
    </>
  );
}
