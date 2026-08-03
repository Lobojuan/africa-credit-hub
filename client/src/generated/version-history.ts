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
  "generatedAt": "2026-08-03T09:42:35.931Z",
  "branch": "main",
  "currentCommit": "3241363",
  "commits": [
    {
      "hash": "32413634587ba6e1ef0824d0a68b740ce9eb5f9f",
      "shortHash": "3241363",
      "date": "2026-08-03",
      "author": "Uffe J Carlson",
      "subject": "fix: make public pages crawlable and searchable"
    },
    {
      "hash": "71cd7fa20637e1133157d69909fc256c04bf77a1",
      "shortHash": "71cd7fa",
      "date": "2026-07-31",
      "author": "Uffe J Carlson",
      "subject": "feat: add public bank diagnostic and navigation"
    },
    {
      "hash": "45e6b491973fb7c58992d7273baa1b703ae0ac37",
      "shortHash": "45e6b49",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "docs: add two-week delivery report"
    },
    {
      "hash": "4910ca39d0aad6b5653a9dd504cffa69d2c7f777",
      "shortHash": "4910ca3",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "fix: retire unsafe public landing claims"
    },
    {
      "hash": "c71c8d285998efd69d0f43cac7eaca19259ca691",
      "shortHash": "c71c8d2",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "docs: define country clearance safety matrix"
    },
    {
      "hash": "e08ac22310b5ca143bea1da1b5d2f2787bd13621",
      "shortHash": "e08ac22",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "docs: establish controlled release baseline"
    },
    {
      "hash": "965b01f7008af89e723fd0d8e307f38a564f3451",
      "shortHash": "965b01f",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "docs: describe banker shift demo"
    },
    {
      "hash": "02793156c74e48f3c2fbbd34a0cd825d5f43c580",
      "shortHash": "0279315",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: show governed demo journey"
    },
    {
      "hash": "906b94e736f36fde590e5f8196a01fa5bb9b5853",
      "shortHash": "906b94e",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: add governed banker shift demo"
    },
    {
      "hash": "257a3fadca7b363251e5c1d3e8af1ea87f8ac945",
      "shortHash": "257a3fa",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: add hands-on banker demo workflows"
    },
    {
      "hash": "baf5663215b12aeace9481d0c60b53cfa6ef9e11",
      "shortHash": "baf5663",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "fix: focus demo scenario selection"
    },
    {
      "hash": "051a9a2858b47d7e9403cd9a692815808a46552c",
      "shortHash": "051a9a2",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: add live executive demo simulation"
    }
  ]
};
