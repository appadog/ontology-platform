import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const frontendRoot = resolve(__dirname, "../../..");

describe("MVP3 actual API smoke command", () => {
  it("is packaged as a repeatable seeded actual API route smoke", () => {
    const packageJson = JSON.parse(readFileSync(resolve(frontendRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const script = readFileSync(resolve(frontendRoot, "scripts/mvp3-actual-api-smoke.mjs"), "utf8");

    expect(packageJson.scripts["smoke:mvp3:actual"]).toBe("node scripts/mvp3-actual-api-smoke.mjs");
    expect(script).toContain("MVP3_API_BASE_URL");
    expect(script).toContain("MVP3_FRONTEND_BASE_URL");
    expect(script).toContain("MVP3_SEED_JSON");
    expect(script).toContain("MVP3_SMOKE_ARTIFACT_DIR");
    expect(script).toContain("/tmp/ontology-wave17-mvp3-seed.json");
    // Wave 65 (follow-up): the actual UI copy on these pages was Koreanized in
    // Wave58 (Review inbox/Published Graph) and this wave (Publish
    // queue/Quality dashboard); the smoke's text assertions were updated to
    // match, so this contract test tracks the current literal strings.
    expect(script).toContain("검수에서 게시된 사실까지");
    expect(script).toContain("게시 비율");
  });
});
