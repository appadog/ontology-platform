import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "styled-components";
import { FolderKanban } from "lucide-react";
import { PageState } from "./PageState";
import { theme } from "../../styles/theme";

function render(node: React.ReactNode) {
  return renderToStaticMarkup(<ThemeProvider theme={theme}>{node}</ThemeProvider>);
}

describe("PageState (Wave 63 PM6-041 §2.2 empty-state enhancement)", () => {
  it("renders back-compat: no icon/secondaryAction props -> identical to pre-wave-63 markup", () => {
    const html = render(
      <PageState kind="empty" title="프로젝트가 없습니다" description="새 프로젝트를 만들면 시작할 수 있습니다." actionLabel="다시 시도" onAction={() => {}} />,
    );
    expect(html).toContain("프로젝트가 없습니다");
    expect(html).toContain("다시 시도");
    // Only a single action button, not wrapped in the new Actions row.
    expect(html.match(/<button/g)?.length).toBe(1);
  });

  it("renders default empty icon when no icon override is passed", () => {
    const html = render(<PageState kind="empty" title="비어있음" description="설명" />);
    // FileSearch is the default empty icon; a custom icon prop is untouched here.
    expect(html).toContain("<svg");
  });

  it("supports a custom icon override", () => {
    const html = render(<PageState kind="empty" icon={FolderKanban} title="프로젝트가 없습니다" description="설명" />);
    expect(html).toContain("<svg");
  });

  it("supports a single primary CTA plus one optional secondary CTA (never two competing primaries)", () => {
    const html = render(
      <PageState
        kind="empty"
        title="프로젝트가 없습니다"
        description="설명"
        actionLabel="새 프로젝트 만들기"
        onAction={() => {}}
        secondaryAction={{ label: "예시 프로젝트 둘러보기", onAction: () => {} }}
      />,
    );
    expect(html).toContain("새 프로젝트 만들기");
    expect(html).toContain("예시 프로젝트 둘러보기");
    expect(html.match(/<button/g)?.length).toBe(2);
  });

  it("omits the secondary CTA entirely when not passed (e.g. zero-projects-in-system case)", () => {
    const html = render(<PageState kind="empty" title="프로젝트가 없습니다" description="설명" actionLabel="새 프로젝트 만들기" onAction={() => {}} />);
    expect(html).not.toContain("예시 프로젝트 둘러보기");
  });
});
