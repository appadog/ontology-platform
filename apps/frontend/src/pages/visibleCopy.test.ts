import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pageFiles = [
  "SourceManagerPage.tsx",
  "SourceDetailPage.tsx",
  "SourceProfilingPage.tsx",
  "OntologyModelerPage.tsx",
  "ProjectListPage.tsx",
  "ProjectDetailPage.tsx",
  "ExtractionJobCreatePage.tsx",
  "ExtractionJobMonitorPage.tsx",
  "CandidateResultsPage.tsx",
  "ReviewInboxPage.tsx",
  "ReviewWorkbenchPage.tsx",
  "PublishQueuePage.tsx",
  "PublishedGraphExplorerPage.tsx",
  "QualityDashboardPage.tsx",
  "EvidenceViewerPage.tsx",
  "DashboardPage.tsx",
];

const blockedCopy = [
  /API boundary/i,
  /endpoint boundary/i,
  /mock boundary/i,
  /mock fixture/i,
  /MVP2 THIN/i,
  /DEV MODE/i,
  /ProjectUpdateRequest/i,
  /RBAC/i,
  /fixture-not-found failure path/i,
  /Provider 값은 고정/i,
  /Create job/,
  /Candidate results 열기/,
  /Candidate 열기/,
  /Open projects/,
  /Open ontology/,
  /Monitor jobs/,
  /New job/,
  /Run context/,
  /Model runs/,
  /Recovery actions/,
  /Evidence locator/,
  /Evidence reading/,
  /Profile 확인/,
  /Chunks 확인/,
  /Chunks 열기/,
  /Profile 열기/,
  /endpoints/i,
  /validation code/i,
  /source evidence/i,
  /Ontology와 prompt/,
  /prompt version/,
  /candidate extraction job/i,
];

describe("visible product copy", () => {
  it("keeps endpoint and debug wording out of primary pages", () => {
    const offenders = pageFiles.flatMap((file) => {
      const source = readFileSync(join(process.cwd(), "src/pages", file), "utf8");

      return blockedCopy
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${file}: ${pattern}`);
    });

    expect(offenders).toEqual([]);
  });

  it("keeps Wave 13 workflow and review workspace primitives visible in page code", () => {
    const sources = Object.fromEntries(
      pageFiles.map((file) => [file, readFileSync(join(process.cwd(), "src/pages", file), "utf8")]),
    );
    const workflowUsers = Object.entries(sources)
      .filter(([, source]) => source.includes("<WorkflowStage"))
      .map(([file]) => file);

    expect(workflowUsers.length).toBeGreaterThanOrEqual(4);
    expect(sources["CandidateResultsPage.tsx"]).toContain("<CandidateCardList");
    expect(sources["CandidateResultsPage.tsx"]).toContain("Technical details");
    expect(sources["EvidenceViewerPage.tsx"]).toContain("Evidence 읽기");
    expect(sources["SourceDetailPage.tsx"]).toContain("준비 상태");
  });
});
