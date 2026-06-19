import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { MessageSquareQuote } from "lucide-react";
import { useCreateRagAnswer, useProject, useVectorStatus } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, KeyValue, Mvp3ActionLink, Muted, Stack } from "./mvp3Shared";
import { InlineList, Mvp4Panel, Mvp4TwoColumn, PageActions, StateBadge, Toolbar, pct, versionLabel } from "./mvp4Shared";

export function RagAnswerWorkspacePage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const vectorQuery = useVectorStatus(projectId);
  const ragMutation = useCreateRagAnswer(projectId);
  const [question, setQuestion] = useState("Which policy owns security evidence?");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim()) {
      ragMutation.mutate({ question: question.trim(), max_citations: 5 });
    }
  }

  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="RAG workspace is loading" description="Question context and project scope are being prepared." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="RAG workspace could not load" description="Return to project selection and retry." />;
  }

  const answer = ragMutation.data;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "RAG answers" },
        ]}
      />
      <PageHeader title="RAG Answer Workspace" description={`${projectQuery.data.name} · grounded answers with citations`}>
        <PageActions>
          <HanaBadge tone="success">Grounded RAG</HanaBadge>
          {vectorQuery.data ? <StateBadge state={vectorQuery.data.status} /> : <HanaBadge tone="muted">VECTOR UNKNOWN</HanaBadge>}
          <Mvp3ActionLink to={`/projects/${projectId}/search`}>Search context</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      <HanaCard title="Question" description="Answers use published graph facts and cited evidence only. Candidate graph facts are excluded until they are reviewed and published.">
        <Toolbar as="form" onSubmit={submit}>
          <MessageSquareQuote aria-hidden="true" size={18} />
          <QuestionInput value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a grounded question" />
          <HanaButton type="submit" variant="primary" disabled={ragMutation.isPending || !question.trim()}>
            {ragMutation.isPending ? "Asking" : "Ask"}
          </HanaButton>
          <HanaButton type="button" onClick={() => setQuestion("candidate only unsupported fact")}>
            Insufficient state
          </HanaButton>
        </Toolbar>
      </HanaCard>

      <Mvp4TwoColumn>
        <Stack>
          {ragMutation.isPending ? (
            <PageState kind="loading" title="Answer is loading" description="The answer panel is waiting for grounding and citation checks." />
          ) : ragMutation.isError ? (
            <PageState kind="error" title="Answer failed" description="Retry without losing the question." actionLabel="Retry" onAction={() => ragMutation.mutate({ question })} />
          ) : !answer ? (
            <PageState kind="empty" title="No answer yet" description="Ask a question to see citation and published fact panels." />
          ) : answer.state === "INSUFFICIENT_EVIDENCE" ? (
            <HanaCard title="Insufficient evidence" description={versionLabel(answer.published_graph_version_ref)}>
              <CardBody>
                <StateBadge state={answer.state} />
                <Muted>{answer.insufficient_evidence?.message ?? "The system did not find enough published evidence to answer."}</Muted>
                <KeyValue>
                  <dt>Reason</dt>
                  <dd>{answer.insufficient_evidence?.reason_code ?? "NO_RELEVANT_EVIDENCE"}</dd>
                  <dt>Missing scopes</dt>
                  <dd>{answer.insufficient_evidence?.missing_scopes?.join(", ") || "Published facts and evidence"}</dd>
                  <dt>Suggested queries</dt>
                  <dd>{answer.insufficient_evidence?.suggested_queries?.join(", ") || "Try a narrower question"}</dd>
                </KeyValue>
              </CardBody>
            </HanaCard>
          ) : (
            <HanaCard title="Answer" description={versionLabel(answer.published_graph_version_ref)}>
              <CardBody>
                <StateRow>
                  <StateBadge state={answer.state} />
                  <span>Coverage {pct(answer.coverage)}</span>
                </StateRow>
                <AnswerText>{answer.answer}</AnswerText>
              </CardBody>
            </HanaCard>
          )}

          {answer && answer.state === "ANSWERED" && answer.citations.length === 0 ? (
            <Mvp4Panel>
              <strong>Empty citation warning</strong>
              <span>An answered response without citations is not treated as fully grounded in MVP4.</span>
            </Mvp4Panel>
          ) : null}
        </Stack>

        <Stack>
          <HanaCard title="Citations">
            <CardBody>
              {answer?.citations.length ? (
                <InlineList>
                  {answer.citations.map((citation) => (
                    <CitationItem key={citation.citation_id}>
                      <strong>{citation.kind}</strong>
                      <span>{citation.snippet}</span>
                      <small>{citation.locator ?? citation.evidence_ref?.locator ?? "No locator"}</small>
                    </CitationItem>
                  ))}
                </InlineList>
              ) : (
                <Muted>No citations are attached yet.</Muted>
              )}
            </CardBody>
          </HanaCard>
          <HanaCard title="Linked published facts">
            <CardBody>
              {answer?.linked_published_facts.length ? (
                <InlineList>
                  {answer.linked_published_facts.map((fact) => (
                    <CitationItem key={fact.fact_id}>
                      <strong>{fact.label}</strong>
                      <span>{fact.fact_type} · {fact.published_graph_version_id}</span>
                      <Link to={`/projects/${projectId}/published-graph`}>Open graph context</Link>
                    </CitationItem>
                  ))}
                </InlineList>
              ) : (
                <Muted>Published fact links appear only when the answer is grounded.</Muted>
              )}
            </CardBody>
          </HanaCard>
        </Stack>
      </Mvp4TwoColumn>
    </>
  );
}

const QuestionInput = styled(HanaInput)`
  flex: 1 1 320px;
`;

const StateRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  color: ${({ theme }) => theme.color.textMuted};
`;

const AnswerText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

const CitationItem = styled.li`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  span,
  small {
    color: ${({ theme }) => theme.color.textMuted};
  }

  a {
    color: ${({ theme }) => theme.color.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;
