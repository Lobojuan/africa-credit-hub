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
  "generatedAt": "2026-07-08T19:05:38.810Z",
  "branch": "claude/production-check-WFJxR",
  "currentCommit": "d021366",
  "commits": [
    {
      "hash": "d021366bd10f243f9bb8301093c29f6f23f7f713",
      "shortHash": "d021366",
      "date": "2026-07-08",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "5dbf3f09294a9fb7003459737c2b082aa8606906",
      "shortHash": "5dbf3f0",
      "date": "2026-07-08",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "58bf120e3f81bdfa022954e75b69131cd4980c02",
      "shortHash": "58bf120",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "742f6c80b15a8b4e12090fba1c1dbce440536ac5",
      "shortHash": "742f6c8",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "b5dfba31ace5120162a71d41efeb948a63e766eb",
      "shortHash": "b5dfba3",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "fix(i18n): translate credit-score-gauge band label (consumer SVG graphic)"
    },
    {
      "hash": "b19991c26864fc64d35e1da1bf9b770885030894",
      "shortHash": "b19991c",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
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
    }
  ]
};
