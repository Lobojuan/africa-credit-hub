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
  "generatedAt": "2026-07-07T10:34:02.576Z",
  "branch": "claude/production-check-WFJxR",
  "currentCommit": "92f596e",
  "commits": [
    {
      "hash": "92f596e287cc0ca586b28d35c88465b81c7ba3c5",
      "shortHash": "92f596e",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "docs(review): mark F1/C1/I2/F3 fixed, I1 partial — Scorecard v1.1 progress"
    },
    {
      "hash": "8f3c4b9c1530eae03d82b5b982d85cb122512da4",
      "shortHash": "8f3c4b9",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "fix(scoring): UCH Scorecard v1.1 — activate utilization, unify score inputs, repair soft-pull"
    },
    {
      "hash": "6fe9358215d16f6c27a4f21bc25594a90908b14b",
      "shortHash": "6fe9358",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "b3be7975c0f1a2f617431a49d601dbff266d2fd6",
      "shortHash": "b3be797",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "docs(review): scoring deep-audit findings + bureau-parity roadmap + session log"
    },
    {
      "hash": "8b1da6a8ea56b3de5cf291b05ac9579833ff9dca",
      "shortHash": "8b1da6a",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "d666ba61e385fc5c0a4163f39421553e33f04655",
      "shortHash": "d666ba6",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "docs(review): platform sweep findings — validation gaps, error leaks, nav, hygiene, i18n"
    },
    {
      "hash": "e30534305190da4e692618fcfa94f5cb1f68c148",
      "shortHash": "e305343",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "fix(security): timing-safe client_id comparison in OAuth token endpoint"
    },
    {
      "hash": "78e6007322dfb1dc1b60c2e03ac6debddce59540",
      "shortHash": "78e6007",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "refactor(cleanup): code review pass — remove unsafe casts, fix hardcoded values, structured logging"
    },
    {
      "hash": "10b2fae7a696afa935521ae89664fdfbe752a925",
      "shortHash": "10b2fae",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "fix: add wget to replit.nix to force fresh Nix layer + build-script pruning"
    },
    {
      "hash": "9aaea138a79baebf415c8940fa313e268bd360a5",
      "shortHash": "9aaea13",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "fix: prune dev-only dirs in build script to reduce deployment image size"
    },
    {
      "hash": "7ac2f673c0c0fbe91509e983487b6194ce1ce20d",
      "shortHash": "7ac2f67",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "fix: add .replitignore to reduce deployment image below 8 GiB limit"
    },
    {
      "hash": "aa1530997c1ed6455e34c12cbdfad50140281054",
      "shortHash": "aa15309",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "seo: expand sitemap to 21 URLs + add <Seo> to 6 public pages"
    }
  ]
};
