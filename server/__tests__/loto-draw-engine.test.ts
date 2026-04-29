import { describe, expect, it } from "vitest";
import {
  computeCommitmentHash,
  generateCommitment,
  sha256Hex,
  hmacSha256Hex,
  computePoolHash,
  rankEligibleReceipts,
} from "../services/loto-draw-engine";

describe("Loto draw engine — provably-fair RNG", () => {
  it("generateCommitment returns a fresh seed/nonce pair", () => {
    const c = generateCommitment();
    expect(c.serverSeed).toMatch(/^[0-9a-f]{64}$/);
    expect(c.serverNonce).toMatch(/^[0-9a-f]{32}$/);
    expect(generateCommitment().serverSeed).not.toBe(c.serverSeed);
  });

  it("computeCommitmentHash binds seed/nonce to drawId+periodEnd+countryCode", () => {
    const seed = generateCommitment();
    const drawId = "11111111-1111-1111-1111-111111111111";
    const periodEndIso = "2026-05-01T00:00:00.000Z";
    const h = computeCommitmentHash({ ...seed, drawId, periodEndIso, countryCode: "SN" });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    // Same inputs → same hash
    expect(h).toBe(computeCommitmentHash({ ...seed, drawId, periodEndIso, countryCode: "SN" }));
    // Different drawId → different hash (commitment cannot be transplanted)
    expect(h).not.toBe(computeCommitmentHash({
      ...seed,
      drawId: "22222222-2222-2222-2222-222222222222",
      periodEndIso,
      countryCode: "SN",
    }));
    // Different country → different hash
    expect(h).not.toBe(computeCommitmentHash({ ...seed, drawId, periodEndIso, countryCode: "CI" }));
    // Direct hash matches the documented formula
    expect(h).toBe(sha256Hex(`${seed.serverSeed}:${seed.serverNonce}:${drawId}:${periodEndIso}:SN`));
  });

  it("hmacSha256Hex is deterministic and produces 64-char hex", () => {
    const h1 = hmacSha256Hex("seed:nonce", "1:receipt-A");
    const h2 = hmacSha256Hex("seed:nonce", "1:receipt-A");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(hmacSha256Hex("seed:nonce", "1:receipt-B")).not.toBe(h1);
  });

  it("computePoolHash is deterministic and changes with pool contents", () => {
    // The engine pre-sorts receipt IDs before hashing (see runDraw), so the
    // pool hash itself is just a SHA-256 of the canonical newline-joined list.
    const sorted = ["r1", "r2", "r3"];
    expect(computePoolHash(sorted)).toBe(computePoolHash(sorted));
    expect(computePoolHash(sorted)).not.toBe(computePoolHash([...sorted, "r4"]));
  });

  it("rankEligibleReceipts is deterministic for the same seed/nonce/draw#", () => {
    const ctx = {
      serverSeed: "deadbeef".repeat(8),
      serverNonce: "feedfacefeedface".repeat(2),
      drawNumber: 42,
      eligibleReceiptIds: ["r-001", "r-002", "r-003", "r-004", "r-005", "r-006", "r-007", "r-008"],
    };
    const a = rankEligibleReceipts(ctx);
    const b = rankEligibleReceipts(ctx);
    expect(a).toEqual(b);
    // Stable ascending order by selectionHash
    for (let i = 1; i < a.length; i++) {
      expect(a[i].selectionHash >= a[i - 1].selectionHash).toBe(true);
    }
  });

  it("rankEligibleReceipts with a different seed produces a different ranking", () => {
    const base = {
      drawNumber: 7,
      eligibleReceiptIds: ["a", "b", "c", "d", "e", "f"],
    };
    const r1 = rankEligibleReceipts({ ...base, serverSeed: "11", serverNonce: "aa" });
    const r2 = rankEligibleReceipts({ ...base, serverSeed: "22", serverNonce: "aa" });
    const ids1 = r1.map((x) => x.receiptId);
    const ids2 = r2.map((x) => x.receiptId);
    expect(ids1).not.toEqual(ids2);
    // Both rankings still contain the same receipt set
    expect(new Set(ids1)).toEqual(new Set(ids2));
  });

  it("rankEligibleReceipts handles empty pools", () => {
    const r = rankEligibleReceipts({
      serverSeed: "x",
      serverNonce: "y",
      drawNumber: 1,
      eligibleReceiptIds: [],
    });
    expect(r).toEqual([]);
  });

  it("commitment is broken when seed or nonce is tampered with", () => {
    const seed = generateCommitment();
    const drawId = "33333333-3333-3333-3333-333333333333";
    const periodEndIso = "2026-06-01T00:00:00.000Z";
    const original = computeCommitmentHash({ ...seed, drawId, periodEndIso, countryCode: "SN" });
    const tampered = computeCommitmentHash({
      serverSeed: seed.serverSeed + "X",
      serverNonce: seed.serverNonce,
      drawId,
      periodEndIso,
      countryCode: "SN",
    });
    expect(tampered).not.toBe(original);
  });
});
