import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pageFiles = [
  "SourceManagerPage.tsx",
  "SourceProfilingPage.tsx",
  "OntologyModelerPage.tsx",
  "ProjectListPage.tsx",
  "ProjectDetailPage.tsx",
  "ExtractionJobCreatePage.tsx",
];

const blockedCopy = [
  /API boundary/i,
  /endpoint boundary/i,
  /mock fixture/i,
  /MVP2 THIN/i,
  /fixture-not-found failure path/i,
  /Provider 값은 고정/i,
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
});
