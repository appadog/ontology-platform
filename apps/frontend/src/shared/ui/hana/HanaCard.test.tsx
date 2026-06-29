import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "styled-components";
import { HanaCard } from "./HanaCard";
import { theme } from "../../styles/theme";

function render(node: React.ReactNode) {
  return renderToStaticMarkup(<ThemeProvider theme={theme}>{node}</ThemeProvider>);
}

describe("HanaCard (Wave 37 FE6-039)", () => {
  it("renders title + description like existing call sites (back-compat)", () => {
    const html = render(<HanaCard title="제목" description="설명" />);
    expect(html).toContain("제목");
    expect(html).toContain("설명");
    // default emphasis = summary so existing soft-shadow cards are unchanged
    expect(html).toContain('data-emphasis="summary"');
  });

  it("renders an eyebrow, a single header action, and a summary emphasis", () => {
    const html = render(
      <HanaCard
        eyebrow="검수"
        title="요약"
        description="한 가지 결정을 선택하세요"
        emphasis="summary"
        action={<button type="button">비교 실행</button>}
      >
        <p>본문</p>
      </HanaCard>,
    );
    expect(html).toContain("검수");
    expect(html).toContain("비교 실행");
    expect(html).toContain("본문");
    expect(html).toContain('data-emphasis="summary"');
  });

  it("supports state emphasis surfaces", () => {
    const html = render(<HanaCard title="경고" emphasis="warning" />);
    expect(html).toContain('data-emphasis="warning"');
  });
});
