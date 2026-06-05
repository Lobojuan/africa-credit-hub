import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CreditScoreResult } from "../credit-score";
import {
  getAggregationCacheStats,
  getOrComputeAggregation,
  invalidateAggregations,
} from "../utils/aggregation-cache";
import {
  buildScoreFingerprint,
  getOrComputeScore,
  getScoreCacheStats,
  invalidateCreditScore,
} from "../utils/score-cache";

const ENV_KEYS = [
  "AGG_CACHE_ENABLED",
  "AGG_CACHE_PAUSED",
  "AGG_CACHE_TTL_SECONDS",
  "SCORE_CACHE_ENABLED",
  "SCORE_CACHE_PAUSED",
  "SCORE_CACHE_TTL_SECONDS",
] as const;

let savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string>>;

function score(value: number): CreditScoreResult {
  return { score: value, reasonCodes: [], factors: [] };
}

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  invalidateAggregations();
  invalidateCreditScore();
});

afterEach(() => {
  invalidateAggregations();
  invalidateCreditScore();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe("aggregation cache", () => {
  it("reuses a computed aggregation while caching is enabled", async () => {
    let calls = 0;
    const compute = async () => ({ totalBorrowers: ++calls });

    const first = await getOrComputeAggregation("dashboard_stats", compute, "org-1", "GH");
    const second = await getOrComputeAggregation("dashboard_stats", compute, "org-1", "GH");

    expect(first).toEqual({ totalBorrowers: 1 });
    expect(second).toEqual(first);
    expect(calls).toBe(1);
    expect(getAggregationCacheStats()).toMatchObject({ entries: 1, enabled: true });
  });

  it("bypasses aggregation cache when paused", async () => {
    process.env.AGG_CACHE_PAUSED = "true";
    let calls = 0;
    const compute = async () => ({ totalBorrowers: ++calls });

    const first = await getOrComputeAggregation("dashboard_stats", compute, "org-1", "GH");
    const second = await getOrComputeAggregation("dashboard_stats", compute, "org-1", "GH");

    expect(first).toEqual({ totalBorrowers: 1 });
    expect(second).toEqual({ totalBorrowers: 2 });
    expect(getAggregationCacheStats()).toMatchObject({ entries: 0, enabled: false });
  });

  it("invalidates matching aggregation entries without clearing unrelated entries", async () => {
    await getOrComputeAggregation("dashboard_stats", async () => "ghana", "org-1", "GH");
    await getOrComputeAggregation("dashboard_stats", async () => "kenya", "org-2", "KE");

    invalidateAggregations("org-1", "GH");

    expect(getAggregationCacheStats().entries).toBe(1);
    const orgOneValue = await getOrComputeAggregation("dashboard_stats", async () => "fresh-ghana", "org-1", "GH");
    const orgTwoValue = await getOrComputeAggregation("dashboard_stats", async () => "kenya-fresh", "org-2", "KE");

    expect(orgOneValue).toBe("fresh-ghana");
    expect(orgTwoValue).toBe("kenya");
  });
});

describe("score cache", () => {
  it("reuses a computed score for the same borrower and fingerprint", async () => {
    let calls = 0;
    const fingerprint = buildScoreFingerprint(["borrower-1", 2, 0, false]);

    const first = await getOrComputeScore("borrower-1", fingerprint, () => score(700 + ++calls));
    const second = await getOrComputeScore("borrower-1", fingerprint, () => score(700 + ++calls));

    expect(first.score).toBe(701);
    expect(second).toBe(first);
    expect(calls).toBe(1);
    expect(getScoreCacheStats()).toMatchObject({ entries: 1, enabled: true });
  });

  it("computes a fresh score when the fingerprint changes", async () => {
    let calls = 0;

    const first = await getOrComputeScore("borrower-1", "accounts:1", () => score(700 + ++calls));
    const second = await getOrComputeScore("borrower-1", "accounts:2", () => score(700 + ++calls));

    expect(first.score).toBe(701);
    expect(second.score).toBe(702);
    expect(getScoreCacheStats().entries).toBe(2);
  });

  it("bypasses score cache when paused", async () => {
    process.env.SCORE_CACHE_PAUSED = "true";
    let calls = 0;

    const first = await getOrComputeScore("borrower-1", "same", () => score(700 + ++calls));
    const second = await getOrComputeScore("borrower-1", "same", () => score(700 + ++calls));

    expect(first.score).toBe(701);
    expect(second.score).toBe(702);
    expect(getScoreCacheStats()).toMatchObject({ entries: 0, enabled: false });
  });

  it("invalidates only the requested borrower's cached scores", async () => {
    await getOrComputeScore("borrower-1", "v1", () => score(701));
    await getOrComputeScore("borrower-2", "v1", () => score(702));

    invalidateCreditScore("borrower-1");

    expect(getScoreCacheStats().entries).toBe(1);
    const borrowerOne = await getOrComputeScore("borrower-1", "v1", () => score(710));
    const borrowerTwo = await getOrComputeScore("borrower-2", "v1", () => score(720));

    expect(borrowerOne.score).toBe(710);
    expect(borrowerTwo.score).toBe(702);
  });
});
