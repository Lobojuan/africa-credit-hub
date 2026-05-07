/**
 * @vitest-environment happy-dom
 */
import { render, screen } from "@testing-library/react";
import {
  isCompetingInquiry,
  isStaleInquiry,
  InquiryRow,
  COMPETING_INQUIRY_WINDOW_DAYS,
  InquiryHighlightData,
} from "../inquiry-highlight";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const BASE_INQ: InquiryHighlightData = {
  id: "inq-1",
  institution: "First National Bank",
  purpose: "new_credit",
  inquiredAt: daysAgo(5),
  inquiringOrgId: "org-other",
};

describe("isCompetingInquiry", () => {
  it("returns true when purpose is new_credit and org differs from viewer", () => {
    expect(
      isCompetingInquiry({ ...BASE_INQ, inquiringOrgId: "org-other" }, "org-viewer"),
    ).toBe(true);
  });

  it("returns false when purpose is new_credit but same org as viewer", () => {
    expect(
      isCompetingInquiry({ ...BASE_INQ, inquiringOrgId: "org-viewer" }, "org-viewer"),
    ).toBe(false);
  });

  it("returns false when inquiringOrgId is missing (undefined)", () => {
    expect(
      isCompetingInquiry({ ...BASE_INQ, inquiringOrgId: undefined }, "org-viewer"),
    ).toBe(false);
  });

  it("returns false when inquiringOrgId is null", () => {
    expect(
      isCompetingInquiry({ ...BASE_INQ, inquiringOrgId: null }, "org-viewer"),
    ).toBe(false);
  });

  it("returns true when viewerOrgId is null and inquiringOrgId is present (over-highlight fallback)", () => {
    expect(
      isCompetingInquiry({ ...BASE_INQ, inquiringOrgId: "org-other" }, null),
    ).toBe(true);
  });

  it("returns false for non-new_credit purposes even when org differs", () => {
    for (const purpose of ["review", "collection", "regulatory", "portfolio_monitoring"]) {
      expect(
        isCompetingInquiry({ ...BASE_INQ, purpose }, "org-viewer"),
      ).toBe(false);
    }
  });
});

describe("isStaleInquiry", () => {
  it("returns true when inquiredAt is null", () => {
    expect(isStaleInquiry({ ...BASE_INQ, inquiredAt: null })).toBe(true);
  });

  it("returns false for an inquiry made today (0 days old)", () => {
    expect(isStaleInquiry({ ...BASE_INQ, inquiredAt: daysAgo(0) })).toBe(false);
  });

  it(`returns false for an inquiry exactly ${COMPETING_INQUIRY_WINDOW_DAYS} days old`, () => {
    expect(
      isStaleInquiry({ ...BASE_INQ, inquiredAt: daysAgo(COMPETING_INQUIRY_WINDOW_DAYS) }),
    ).toBe(false);
  });

  it(`returns true for an inquiry ${COMPETING_INQUIRY_WINDOW_DAYS + 1} days old`, () => {
    expect(
      isStaleInquiry({ ...BASE_INQ, inquiredAt: daysAgo(COMPETING_INQUIRY_WINDOW_DAYS + 1) }),
    ).toBe(true);
  });

  it("accepts a Date object and returns true when older than window", () => {
    const old = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    expect(isStaleInquiry({ ...BASE_INQ, inquiredAt: old })).toBe(true);
  });
});

function renderRow(inq: InquiryHighlightData, viewerOrgId: string | null = "org-viewer") {
  return render(
    <ul>
      <InquiryRow inq={inq} viewerOrgId={viewerOrgId} variant="dialog" />
    </ul>,
  );
}

describe("InquiryRow — competing + fresh", () => {
  const inq: InquiryHighlightData = { ...BASE_INQ, inquiredAt: daysAgo(5), inquiringOrgId: "org-other" };

  it("renders the amber stripe on the row", () => {
    renderRow(inq);
    const row = screen.getByTestId(`row-snapshot-inquiry-${inq.id}`);
    expect(row).toHaveAttribute("data-competing", "true");
    expect(row.className).toMatch(/border-l-amber-500/);
  });

  it("shows the Competing badge", () => {
    renderRow(inq);
    expect(screen.getByTestId(`badge-snapshot-inquiry-competing-${inq.id}`)).toBeInTheDocument();
  });

  it("does not fade the row", () => {
    renderRow(inq);
    const row = screen.getByTestId(`row-snapshot-inquiry-${inq.id}`);
    expect(row).toHaveAttribute("data-stale", "false");
    expect(row.className).not.toMatch(/opacity-60/);
  });
});

describe("InquiryRow — competing + stale", () => {
  const inq: InquiryHighlightData = { ...BASE_INQ, inquiredAt: daysAgo(45), inquiringOrgId: "org-other" };

  it("still shows amber stripe and Competing badge when stale", () => {
    renderRow(inq);
    const row = screen.getByTestId(`row-snapshot-inquiry-${inq.id}`);
    expect(row).toHaveAttribute("data-competing", "true");
    expect(row.className).toMatch(/border-l-amber-500/);
    expect(screen.getByTestId(`badge-snapshot-inquiry-competing-${inq.id}`)).toBeInTheDocument();
  });

  it("fades the row with opacity-60 when stale", () => {
    renderRow(inq);
    const row = screen.getByTestId(`row-snapshot-inquiry-${inq.id}`);
    expect(row).toHaveAttribute("data-stale", "true");
    expect(row.className).toMatch(/opacity-60/);
  });

  it("renders the stale label", () => {
    renderRow(inq);
    expect(screen.getByTestId(`text-snapshot-inquiry-stale-${inq.id}`)).toBeInTheDocument();
  });
});

describe("InquiryRow — non-competing (different purpose)", () => {
  const inq: InquiryHighlightData = { ...BASE_INQ, purpose: "review", inquiredAt: daysAgo(3) };

  it("does not apply amber stripe", () => {
    renderRow(inq);
    const row = screen.getByTestId(`row-snapshot-inquiry-${inq.id}`);
    expect(row).toHaveAttribute("data-competing", "false");
    expect(row.className).not.toMatch(/border-l-amber-500/);
  });

  it("does not render the Competing badge", () => {
    renderRow(inq);
    expect(
      screen.queryByTestId(`badge-snapshot-inquiry-competing-${inq.id}`),
    ).not.toBeInTheDocument();
  });
});

describe("InquiryRow — same-org new_credit", () => {
  const inq: InquiryHighlightData = { ...BASE_INQ, purpose: "new_credit", inquiredAt: daysAgo(2), inquiringOrgId: "org-viewer" };

  it("does not highlight as competing when org matches viewer", () => {
    renderRow(inq, "org-viewer");
    const row = screen.getByTestId(`row-snapshot-inquiry-${inq.id}`);
    expect(row).toHaveAttribute("data-competing", "false");
    expect(
      screen.queryByTestId(`badge-snapshot-inquiry-competing-${inq.id}`),
    ).not.toBeInTheDocument();
  });
});
