import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, BookOpen, FileSearch } from "lucide-react";
import styled from "styled-components";
import { useProject, useSources, useSourceSegments } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { HanaBadge, HanaCard, HanaSelect } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { CardBody, CompactTable, Muted, Stack } from "./mvp3Shared";
import type { SourceSegment, SourceType } from "../shared/api/types";

// Wave 74: non-expert-facing RAG build guide. Content is a condensed version
// of docs/pm/RAG_PORTAL_GUIDE.md (deep-research: 6 search angles, 28 sources,
// 15/25 cross-verified claims) -- see that file for full citations.

interface ComparisonRow {
  name: string;
  detail: string;
  fit: string;
}

const PARSING_ROWS: ComparisonRow[] = [
  { name: "단순 텍스트 추출 (pypdf, PyMuPDF)", detail: "빠르고 무료, OCR 없음, 복잡한 표/레이아웃에 약함", fit: "간단한 디지털 PDF" },
  { name: "레이아웃 인식 파싱 (Docling, Unstructured)", detail: "표·섹션 구조 보존, 오픈소스로 온프레미스 가능", fit: "표 많은 문서, 민감 데이터" },
  { name: "멀티모달 파싱 (LlamaParse 등 상용)", detail: "비전 모델로 복잡한 레이아웃도 정리, 페이지당 과금·느림", fit: "품질 최우선, 클라우드 사용 가능" },
  { name: "클라우드 OCR (Textract, Document AI)", detail: "정형 업무 문서(양식/인보이스)에 강함, confidence score 제공", fit: "표준화된 업무 문서 대량 처리" },
];

const CHUNKING_ROWS: ComparisonRow[] = [
  { name: "고정 크기(Fixed-size)", detail: "빠르고 예측 가능하지만 문장 중간이 잘릴 수 있음", fit: "로그, 대화 기록, 프로토타입" },
  { name: "재귀적/구조 인식(Recursive)", detail: "헤딩·문단 구조를 따라 분할", fit: "기술 문서, API 레퍼런스, 코드" },
  { name: "시맨틱(Semantic)", detail: "임베딩 유사도로 주제 전환 지점 탐지 — 고정 크기 대비 3~10배 느림", fit: "연구 논문, 지식베이스" },
  { name: "계층적(Hierarchical, parent-child)", detail: "작은 자식 청크(검색용)+큰 부모 청크(생성용) — 업계 표준 패턴", fit: "구조화된 매뉴얼, 정책 문서" },
  { name: "에이전틱(Agentic)", detail: "LLM이 섹션별로 동적 결정 — 고정 크기 대비 10~50배 비용", fit: "계약서, 규제 문서" },
];

const EMBEDDING_ROWS: ComparisonRow[] = [
  { name: "Qwen3-Embedding-8B", detail: "MTEB 70.6(1위), 4096차원, 100개+ 언어(한국어 포함), Apache 2.0 — 온프레미스", fit: "한국어 + 자체 호스팅" },
  { name: "BGE-M3", detail: "다국어 벤치마크 1위(62.4), 1024차원, MIT 라이선스 — 온프레미스, dense+sparse+multi-vector 통합", fit: "한국어 + 자체 호스팅, 하이브리드 검색" },
  { name: "Cohere Embed v4", detail: "MTEB 65.2, 최초의 프로덕션급 멀티모달(텍스트+이미지)", fit: "이미지 포함 문서, 관리형 API" },
  { name: "OpenAI text-embedding-3-large", detail: "MTEB 64.6(2023년 이후 정체), 3072차원", fit: "기존 OpenAI 생태계와 통합" },
  { name: "EmbeddingGemma-300M / Nomic-embed-v2", detail: "경량(RAM 200MB 미만 구동 가능)", fit: "엣지/경량 배포" },
];

const RETRIEVAL_ROWS: ComparisonRow[] = [
  { name: "Dense(벡터) 검색", detail: "의미·패러프레이즈 이해에 강하지만 정확 일치(ID, 고유명사)에 약함", fit: "의미 기반 질의" },
  { name: "Sparse(BM25/키워드)", detail: "정확 일치·전문용어에 강함 — 금융 문서 등에서 dense보다 우수한 사례 보고", fit: "정확한 용어 검색" },
  { name: "하이브리드(dense+sparse, RRF 융합)", detail: "단일 방식 대비 최대 39% Recall@5 향상 사례 — 실무 표준 조합", fit: "대부분의 프로덕션 RAG" },
  { name: "재순위화(Cross-encoder rerank)", detail: "정밀도 추가 향상, 쿼리당 80~120ms 지연 비용", fit: "품질이 중요한 상위 K 재정렬" },
  { name: "GraphRAG(지식그래프 검색)", detail: "다중 홉 추론에 강함(최대 35% 정밀도 향상), 단순 사실 검색엔 이점 적음", fit: "여러 엔티티를 연결해야 하는 질의" },
];

const PLATFORM_REUSE_ROWS: Array<{ asset: string; location: string; note: string }> = [
  { asset: "문서 업로드 + 프로파일링 파이프라인", location: "SourceData / SourceProfile / SourceSegment", note: "청킹 결과가 이미 SourceSegment(CHUNK)로 저장되어 있어 RAG 인덱싱 대상으로 재사용 가능" },
  { asset: "청크 뷰어 UI", location: "DocumentChunkViewerPage", note: "리스트+상세 패턴을 문서별 분석 화면에 재사용" },
  { asset: "근거 오프셋 하이라이트", location: "EvidenceViewerPage", note: "검색 결과 근거 위치 표시에 이식 가능" },
  { asset: "게시 그래프 + 계보(lineage)", location: "PublishedEntity / PublishedRelation", note: "GraphRAG의 지식그래프 소스이자 인용 근거로 즉시 활용 가능" },
  { asset: "RAG 질의응답 워크스페이스(틀)", location: "RagAnswerWorkspacePage, mvp4 모듈", note: "인용·근거부족 UX는 완성, 검색/임베딩 로직은 현재 결정론적 mock" },
  { asset: "골든셋 평가 + 단계별 스코어링", location: "evaluation 모듈", note: "RAG 검색 품질 평가 하네스로 그대로 전용 가능" },
  { asset: "온톨로지 실DB", location: "ontology 모듈", note: "GraphRAG 스키마 그라운딩 소스로 활용 가능" },
];

const PDF_PLACEHOLDER_WARNING = "이 플랫폼의 PDF 파싱은 현재 자리표시자(바이트 디코딩) 구현입니다 — 실제 구조 파싱이 필요합니다.";

function chunkSizeStats(segments: SourceSegment[]) {
  const lengths = segments.map((segment) => segment.text?.length ?? 0).filter((length) => length > 0);
  if (lengths.length === 0) {
    return null;
  }
  const total = lengths.reduce((sum, value) => sum + value, 0);
  return {
    count: lengths.length,
    avg: Math.round(total / lengths.length),
    min: Math.min(...lengths),
    max: Math.max(...lengths),
  };
}

function recommendationFor(sourceType: SourceType, segments: SourceSegment[]): string[] {
  const notes: string[] = [];
  if (sourceType === "PDF") {
    notes.push(PDF_PLACEHOLDER_WARNING);
  }
  const tableSegmentCount = segments.filter((segment) => segment.segment_type === "CELL" || segment.segment_type === "ROW").length;
  if (tableSegmentCount > 0) {
    notes.push("표 구조가 감지되었습니다 — 텍스트 청킹과 표를 함께 섞지 말고 별도 단위로 유지하는 것을 권장합니다.");
  }
  const stats = chunkSizeStats(segments);
  if (stats && stats.max > 2000) {
    notes.push(`최대 청크 길이가 ${stats.max}자로 큽니다 — 검색 정밀도를 위해 더 작은 단위(예: 512~1024 토큰)로 재분할을 고려하세요.`);
  }
  if (notes.length === 0) {
    notes.push("특별한 이슈가 감지되지 않았습니다. 하이브리드 검색(BM25+벡터) + 재순위화를 기본 구성으로 권장합니다.");
  }
  return notes;
}

export function RagPortalPage() {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const sourcesQuery = useSources(projectId);
  const [selectedSourceId, setSelectedSourceId] = useState("");

  const sources = sourcesQuery.data ?? [];
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? sources[0];
  const segmentsQuery = useSourceSegments(selectedSource?.id ?? "");
  const segments = useMemo(() => segmentsQuery.data ?? [], [segmentsQuery.data]);
  const stats = useMemo(() => chunkSizeStats(segments), [segments]);
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const segment of segments) {
      counts.set(segment.segment_type, (counts.get(segment.segment_type) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [segments]);

  if (projectQuery.isLoading) {
    return <PageState kind="loading" title="RAG 포탈을 불러오는 중" description="프로젝트 정보를 준비하고 있습니다." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="RAG 포탈을 불러오지 못했습니다" description="프로젝트 정보를 다시 불러오세요." />;
  }

  return (
    <>
      <Breadcrumbs items={[{ label: projectQuery.data.name, to: `/projects/${projectId}` }, { label: "RAG Portal" }]} />
      <PageHeader
        title="RAG 포탈"
        description="비전문가도 실제 운영 수준의 RAG(검색 증강 생성)를 구축할 수 있도록 파싱·청킹·임베딩·검색 요건을 비교하고, 업로드한 문서별로 분석을 제공합니다."
      >
        <HanaBadge tone="neutral">
          <BookOpen aria-hidden="true" size={14} />
          전체 가이드: docs/pm/RAG_PORTAL_GUIDE.md
        </HanaBadge>
      </PageHeader>

      <Stack>
        <HanaCard title="1. 파싱 (Parsing)" description="문서에서 텍스트를 꺼내는 단계 — 구조 보존이 원시 OCR 정확도보다 중요합니다.">
          <ComparisonTable rows={PARSING_ROWS} />
        </HanaCard>

        <HanaCard title="2. 청킹 (Chunking)" description="텍스트를 검색 단위로 자르는 단계 — 모든 문서에 청킹이 필요한 것은 아닙니다.">
          <ComparisonTable rows={CHUNKING_ROWS} />
        </HanaCard>

        <HanaCard title="3. 임베딩 모델 (Embedding)" description="텍스트를 벡터로 바꾸는 단계 — 모델 선택이 검색 정밀도를 20~30% 좌우할 수 있습니다.">
          <ComparisonTable rows={EMBEDDING_ROWS} />
        </HanaCard>

        <HanaCard title="4. 검색/리트리벌 (Retrieval)" description="질의에 맞는 청크를 찾는 단계 — 벡터 검색만으로는 정확 일치 질의에 구조적으로 약합니다.">
          <ComparisonTable rows={RETRIEVAL_ROWS} />
        </HanaCard>

        <HanaCard title="이 플랫폼에서 재사용 가능한 것들" description="RAG 포탈을 처음부터 만들 필요는 없습니다 — 이미 있는 자산을 확인하세요.">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>자산</th>
                  <th>위치</th>
                  <th>재사용 방식</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_REUSE_ROWS.map((row) => (
                  <tr key={row.asset}>
                    <td>
                      <strong>{row.asset}</strong>
                    </td>
                    <td>
                      <code>{row.location}</code>
                    </td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>

        <HanaCard
          title="문서별 상세 분석"
          description="업로드된 문서를 선택하면 실제 파싱/청킹 결과와 권장사항을 확인할 수 있습니다."
        >
          <CardBody>
            {sources.length === 0 ? (
              <PageState kind="empty" title="업로드된 문서가 없습니다" description="Sources 페이지에서 문서를 먼저 업로드하세요." />
            ) : (
              <>
                <FieldRow>
                  <span>분석할 문서</span>
                  <HanaSelect
                    value={selectedSource?.id ?? ""}
                    onChange={(event) => setSelectedSourceId(event.target.value)}
                  >
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.file_name} ({source.source_type})
                      </option>
                    ))}
                  </HanaSelect>
                </FieldRow>

                {selectedSource ? (
                  <DocumentAnalysis>
                    <DetailGrid>
                      <div>
                        <span>형식</span>
                        <strong>{selectedSource.source_type}</strong>
                      </div>
                      <div>
                        <span>파싱 상태</span>
                        <StatusBadge token={selectedSource.status} />
                      </div>
                      <div>
                        <span>청크/세그먼트 수</span>
                        <strong>{segments.length}</strong>
                      </div>
                      <div>
                        <span>평균 길이</span>
                        <strong>{stats ? `${stats.avg}자` : "N/A"}</strong>
                      </div>
                    </DetailGrid>

                    {selectedSource.source_type === "PDF" ? (
                      <PlaceholderWarning>
                        <AlertTriangle aria-hidden="true" size={16} />
                        <span>{PDF_PLACEHOLDER_WARNING}</span>
                      </PlaceholderWarning>
                    ) : null}

                    {typeCounts.length > 0 ? (
                      <BadgeList>
                        {typeCounts.map(([type, count]) => (
                          <HanaBadge key={type} tone="neutral">
                            {type} × {count}
                          </HanaBadge>
                        ))}
                      </BadgeList>
                    ) : null}

                    <RecommendationList>
                      <h3>
                        <FileSearch aria-hidden="true" size={16} />
                        권장사항
                      </h3>
                      <ul>
                        {recommendationFor(selectedSource.source_type, segments).map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </RecommendationList>

                    {segments.length > 0 ? (
                      <SamplePreview>
                        <h3>샘플 청크 미리보기</h3>
                        <CompactTable $maxHeight="320px">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>타입</th>
                                <th>내용</th>
                              </tr>
                            </thead>
                            <tbody>
                              {segments.slice(0, 10).map((segment) => (
                                <tr key={segment.id}>
                                  <td>{segment.sequence}</td>
                                  <td>{segment.segment_type}</td>
                                  <td>{(segment.text ?? "").slice(0, 120) || <Muted>내용 없음</Muted>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CompactTable>
                      </SamplePreview>
                    ) : (
                      <Muted>이 문서는 아직 파싱되지 않았습니다. Sources 상세 페이지에서 파싱을 먼저 실행하세요.</Muted>
                    )}
                  </DocumentAnalysis>
                ) : null}
              </>
            )}
          </CardBody>
        </HanaCard>
      </Stack>
    </>
  );
}

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <CompactTable>
      <table>
        <thead>
          <tr>
            <th>기법</th>
            <th>특징</th>
            <th>적합한 경우</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <strong>{row.name}</strong>
              </td>
              <td>{row.detail}</td>
              <td>{row.fit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CompactTable>
  );
}

const FieldRow = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  max-width: 420px;
  margin: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }
`;

const DocumentAnalysis = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  div {
    display: grid;
    gap: 4px;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const PlaceholderWarning = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warning};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.textMuted};

  svg {
    flex-shrink: 0;
    color: #d97706;
  }
`;

const BadgeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const RecommendationList = styled.div`
  h3 {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};
    margin: 0 0 ${({ theme }) => theme.spacing.xs};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    color: ${({ theme }) => theme.color.textMuted};
    text-transform: uppercase;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 4px;
  }
`;

const SamplePreview = styled.div`
  h3 {
    margin: 0 0 ${({ theme }) => theme.spacing.xs};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    color: ${({ theme }) => theme.color.textMuted};
    text-transform: uppercase;
  }
`;
