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
  "generatedAt": "2026-07-07T11:03:38.487Z",
  "branch": "claude/production-check-WFJxR",
  "currentCommit": "cf06169",
  "commits": [
    {
      "hash": "cf061694dd8aa9d1593a82fbbf343c3f30577e4a",
      "shortHash": "cf06169",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "docs: log i18n correction + consent-respond internationalization"
    },
    {
      "hash": "a39abf57a2b6ac7ee794d98a7d0b087712793a41",
      "shortHash": "a39abf5",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "feat(i18n): internationalize consent-respond page (legal, public-facing)"
    },
    {
      "hash": "fdf3e1886e369710c0986a030c141d7f78c88e8c",
      "shortHash": "fdf3e18",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "docs(review): correct i18n finding — dictionaries complete, real gap is 47 hardcoded pages"
    },
    {
      "hash": "b1b2e0729b8354cfc69d4a64889af9c5f2560492",
      "shortHash": "b1b2e07",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
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
    }
  ]
};
