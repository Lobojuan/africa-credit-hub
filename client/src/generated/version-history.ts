export type RepoVersionCommit = {
  hash: string;
  shortHash: string;
  date: string;
  author: string;
  subject: string;
};

export type RepoVersionHistory = {
  productName: string;
  packageVersion: string;
  generatedAt: string;
  branch: string;
  currentCommit: string;
  commits: RepoVersionCommit[];
};

export const repoVersionHistory: RepoVersionHistory = {
  "productName": "Universal Credit Hub",
  "packageVersion": "2.8.0",
  "generatedAt": "2026-07-11T20:57:38.983Z",
  "branch": "main",
  "currentCommit": "42d101a",
  "commits": [
    {
      "hash": "42d101ac5cb540dd91d4c909b7ccf886e6d74177",
      "shortHash": "42d101a",
      "date": "2026-07-11",
      "author": "Uffe J Carlson",
      "subject": "fix: e2e/test-session/seed audit fixes (routes.ts, seed.ts, e2e, tests, gitignore, hooks)"
    },
    {
      "hash": "2cd0799f6652138ea0039f9d790e1aed63858d5c",
      "shortHash": "2cd0799",
      "date": "2026-07-11",
      "author": "Uffe J Carlson",
      "subject": "fix: load .env via dotenv (server never read it, silently ignoring all local config)"
    },
    {
      "hash": "530e5d488521a834f1371f7d4e607ad408632ac7",
      "shortHash": "530e5d4",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Merge pull request #7 from Lobojuan/fix/ground-ai-reasoning-in-real-score"
    },
    {
      "hash": "129253ac9addc357b8e4f8cd5b86f1f812227f4c",
      "shortHash": "129253a",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Ground all AI credit-reasoning functions in the real computed score"
    },
    {
      "hash": "d7f9a986d0fefdff1a33cdd274c2a18089dbdaa2",
      "shortHash": "d7f9a98",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Merge pull request #6 from Lobojuan/fix/remaining-scoring-and-integrity-issues"
    },
    {
      "hash": "052b5cbd076d04fe06beb48e9bba6eb93600b45d",
      "shortHash": "052b5cb",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Fix I1 write-path (unverified self-declared consent); update known-issues doc"
    },
    {
      "hash": "a68a0627194f894dd9fdffb0afb86a252f3dee6f",
      "shortHash": "a68a062",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Fix A4, A5: multi-currency FX conversion, robust LLM JSON extraction"
    },
    {
      "hash": "c938596b8753cc6dae2234a0dfdec2ad6d5b6023",
      "shortHash": "c938596",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Fix B4, F4, C2, B3: ID validation, score cliff, dedup, batch maker-checker"
    },
    {
      "hash": "fc508f0f6d0fe3f169b28cd460755bcb5b8373a8",
      "shortHash": "fc508f0",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Merge pull request #5 from Lobojuan/fix/scoring-integrity-and-hygiene"
    },
    {
      "hash": "8ac0248a3a8b288328b6beaf4a38290b948524ad",
      "shortHash": "8ac0248",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Sweep raw error-message leaks to safeErrorMessage (P2)"
    },
    {
      "hash": "3ca28da0dcf226a88af9533d59d6aa714be7d783",
      "shortHash": "3ca28da",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Repo hygiene: remove 5 orphan server files and 4 tracked source zips"
    },
    {
      "hash": "268a2a0eb99f3e70f3bee3a71cbf1986a100ff53",
      "shortHash": "268a2a0",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Fix remaining scoring-integrity issues: F2, B1, B2, A1-A3, C4"
    }
  ]
};
