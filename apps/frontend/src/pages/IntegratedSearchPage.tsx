import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { Search } from "lucide-react";
import { useProject, useProjectSearch, useSimilarEvidence, useVectorStatus } from "../shared/api/queries";
import { SearchResultKind } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, Mvp3ActionLink, Muted, Stack } from "./mvp3Shared";
import { InlineList, Mvp4Panel, Mvp4StatePanel, PageActions, StateBadge, Toolbar, pct, versionLabel } from "./mvp4Shared";

const resultKindLabels: Record<SearchResultKind, string> = {
  PUBLISHED_ENTITY: "Published entities",
  PUBLISHED_RELATION: "Published relations",
  SOURCE: "Sources",
  SOURCE_CHUNK: "Source chunks",
  EVIDENCE: "Evidence",
  LINEAGE: "Lineage",
};

export function IntegratedSearchPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const vectorQuery = useVectorStatus(projectId);
  const [query, setQuery] = useState("policy");
  const [submittedQuery, setSubmittedQuery] = useState("policy");
  const [indexState, setIndexState] = useState<"READY" | "PARTIAL" | "STALE">("READY");
  const searchQuery = useProjectSearch(projectId, { query: submittedQuery, index_state: indexState });
  const similarQuery = useSimilarEvidence(projectId, { query: submittedQuery, limit: 3 });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  if (projectQuery.isLoading || vectorQuery.isLoading) {
    return <PageState kind="loading" title="Search workspace is loading" description="Project scope and vector adapter status are being prepared." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="Search workspace could not load" description="Return to project selection and try again." />;
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Search" },
        ]}
      />
      <PageHeader title="Integrated Search" description={`${projectQuery.data.name} · grouped published graph, source, evidence, and lineage results`}>
        <PageActions>
          {vectorQuery.data ? <StateBadge state={vectorQuery.data.status} /> : <HanaBadge tone="muted">VECTOR UNKNOWN</HanaBadge>}
          <Mvp3ActionLink to={`/projects/${projectId}/rag`}>Ask with citations</Mvp3ActionLink>
        </PageActions>
      </PageHeader>

      <HanaCard title="Search query" description="Results are scoped to this project and preserve version context.">
        <Toolbar as="form" onSubmit={submit}>
          <Search aria-hidden="true" size={18} />
          <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search published facts, sources, evidence" />
          <HanaButton type="submit" variant="primary">Search</HanaButton>
          <HanaButton type="button" onClick={() => setQuery("")}>Clear</HanaButton>
          <HanaButton type="button" onClick={() => setSubmittedQuery("no-results")}>No-result state</HanaButton>
          <HanaButton type="button" onClick={() => setIndexState(indexState === "READY" ? "PARTIAL" : indexState === "PARTIAL" ? "STALE" : "READY")}>
            {indexState}
          </HanaButton>
        </Toolbar>
      </HanaCard>

      <SearchLayout>
        <Stack>
          {!submittedQuery ? (
            <PageState kind="empty" title="Enter a search term" description="Submit a query to inspect grouped project results." />
          ) : searchQuery.isLoading ? (
            <PageState kind="loading" title="Searching" description="Grouped result sections are loading." />
          ) : searchQuery.isError || !searchQuery.data ? (
            <PageState kind="error" title="Search failed" description="Retry the query without changing project scope." actionLabel="Retry" onAction={() => void searchQuery.refetch()} />
          ) : (
            <>
              {searchQuery.data.index_state !== "READY" ? (
                <Mvp4StatePanel title={`${searchQuery.data.index_state} index`}>
                  Search may lag behind the latest published version. Showing {versionLabel(searchQuery.data.published_graph_version_ref)}.
                </Mvp4StatePanel>
              ) : null}
              {searchQuery.data.total_count === 0 ? (
                <PageState kind="empty" title="No results" description="Reset filters or try another published graph term." />
              ) : (
                searchQuery.data.groups.map((group) => (
                  <HanaCard key={group.kind} title={resultKindLabels[group.kind]} description={`${group.total_count} result`}>
                    <InlineList>
                      {group.items.map((item) => (
                        <ResultItem key={item.id}>
                          <strong>{item.title}</strong>
                          <span>{item.snippet}</span>
                          <MetaRow>
                            <HanaBadge tone="muted">{item.kind}</HanaBadge>
                            <span>Score {pct(item.score)}</span>
                            <span>{versionLabel(item.published_graph_version_ref)}</span>
                          </MetaRow>
                          <ResultActions>
                            {item.kind === "PUBLISHED_ENTITY" || item.kind === "PUBLISHED_RELATION" || item.kind === "LINEAGE" ? (
                              <Link to={`/projects/${projectId}/published-graph`}>Open graph context</Link>
                            ) : null}
                            {item.evidence_refs?.[0] ? <Link to={`/candidate-evidence/${item.evidence_refs[0].evidence_id}`}>Open evidence</Link> : null}
                          </ResultActions>
                        </ResultItem>
                      ))}
                    </InlineList>
                  </HanaCard>
                ))
              )}
            </>
          )}
        </Stack>
        <Stack>
          <HanaCard title="Vector adapter">
            <CardBody>
              {vectorQuery.data ? (
                <>
                  <MetaRow>
                    <StateBadge state={vectorQuery.data.status} />
                    <span>{vectorQuery.data.embedding_target}</span>
                  </MetaRow>
                  <Muted>{vectorQuery.data.message ?? "Vector adapter is ready."}</Muted>
                </>
              ) : (
                <Muted>Vector adapter status unavailable.</Muted>
              )}
            </CardBody>
          </HanaCard>
          <HanaCard title="Similar evidence">
            <CardBody>
              {similarQuery.isLoading ? (
                <Muted>Loading similar evidence.</Muted>
              ) : similarQuery.data ? (
                <InlineList>
                  {similarQuery.data.fallback_used ? (
                    <Mvp4Panel>
                      <strong>Keyword fallback in use</strong>
                      <span>Scores are treated as match strength, not vector similarity.</span>
                    </Mvp4Panel>
                  ) : null}
                  {similarQuery.data.items.map((item) => (
                    <ResultItem key={item.evidence_ref.evidence_id}>
                      <strong>{item.evidence_ref.locator}</strong>
                      <span>{item.snippet}</span>
                      <small>{item.match_reason ?? `Similarity ${pct(item.similarity_score)}`}</small>
                    </ResultItem>
                  ))}
                </InlineList>
              ) : (
                <Muted>Submit a query to compare similar evidence.</Muted>
              )}
            </CardBody>
          </HanaCard>
        </Stack>
      </SearchLayout>
    </>
  );
}

const SearchInput = styled(HanaInput)`
  flex: 1 1 260px;
`;

const SearchLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.42fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }
`;

const ResultItem = styled.li`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  &:last-child {
    border-bottom: 0;
  }

  span,
  small {
    color: ${({ theme }) => theme.color.textMuted};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  color: ${({ theme }) => theme.color.textMuted};
`;

const ResultActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};

  a {
    color: ${({ theme }) => theme.color.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;
