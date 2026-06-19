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
    summary: "정상 Candidate와 Evidence",
  },
  {
    id: "partial_invalid",
    label: "Partial failure",
    expectedStatus: "PARTIAL_FAILED",
    tone: "warning" as const,
    summary: "Evidence가 없는 경고 Candidate",
  },
  {
    id: "invalid_evidence_reference",
    label: "Broken evidence",
    expectedStatus: "PARTIAL_FAILED",
    tone: "warning" as const,
    summary: "해결되지 않은 Evidence 연결이 있는 Candidate",
  },
  {
    id: "missing",
    label: "Missing fixture",
    expectedStatus: "FAILED",
    tone: "danger" as const,
    summary: "선택한 시나리오를 불러올 수 없음",
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
        description="Projects에서 작업할 Project를 선택한 뒤 추출 작업을 만드세요."
        actionLabel="Projects로 이동"
        onAction={() => navigate("/projects")}
      />
    );
  }

  if (isLoading) {
    return <PageState kind="loading" title="추출 작업 생성 폼을 불러오는 중" description="Source, Ontology, 프롬프트 선택지를 준비하고 있습니다." />;
  }

  if (isError || !sources || !versions || !prompts || !promptVersions) {
    return (
      <PageState
        kind="error"
        title="추출 작업 생성 준비에 실패했습니다"
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
        title="추출 작업에 필요한 입력이 부족합니다"
        description="Source, Ontology 버전, 프롬프트 버전이 모두 필요합니다."
        actionLabel={sources.length === 0 ? "Sources로 이동" : "Ontology로 이동"}
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
          { label: "추출 작업 만들기" },
        ]}
      />
      <PageHeader title="추출 작업 만들기" description="Source, Ontology 버전, 프롬프트 버전을 선택해 반복 가능한 Candidate 추출 작업을 만듭니다.">
        <HanaBadge tone="muted">MockProvider only</HanaBadge>
      </PageHeader>
      <HanaCard title="추출 입력" description="Source, Ontology, 프롬프트, 시나리오를 선택한 뒤 추출 작업을 만듭니다.">
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
            <span>프롬프트 버전</span>
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
              {createJob.isPending ? "생성 중" : "추출 작업 만들기"}
            </HanaButton>
          </ButtonSlot>
        </FormGrid>
      </HanaCard>
      <HanaCard title="선택한 맥락">
        <KeyValueGrid>
          <dt>Source</dt>
          <dd>{selectedSource?.file_name ?? "-"}</dd>
          <dt>Ontology version</dt>
          <dd>{selectedVersion ? `v${selectedVersion.version} ${selectedVersion.status}` : "-"}</dd>
          <dt>Prompt</dt>
          <dd>{selectedPrompt?.name ?? "-"}</dd>
          <dt>프롬프트 버전</dt>
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
          <dt>프롬프트 템플릿</dt>
          <dd>{selectedPromptVersion?.template ?? "-"}</dd>
          <dt>Provider 규칙</dt>
          <dd>
            <MutedText>반복 가능한 MockProvider 시나리오로 실행해 Candidate와 Evidence 확인 결과를 재현할 수 있게 합니다.</MutedText>
          </dd>
        </KeyValueGrid>
      </HanaCard>
      {createJob.isError && <PageState kind="error" title="추출 작업 생성 실패" description={(createJob.error as Error).message} />}
    </>
  );
}
