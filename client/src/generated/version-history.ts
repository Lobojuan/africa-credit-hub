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
  "generatedAt": "2026-07-30T15:41:25.511Z",
  "branch": "main",
  "currentCommit": "c71c8d2",
  "commits": [
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
    },
    {
      "hash": "54b7bbc9ee22bc55f4cf8d6a2bfd75b271472fe4",
      "shortHash": "54b7bbc",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: add interactive demo workspaces"
    },
    {
      "hash": "f171ccab466e538468c58f44fd2f3bd18f05fbe2",
      "shortHash": "f171cca",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: add whole bank demo journey"
    },
    {
      "hash": "9695c4de88cf1f5dc7fa832f04389df8e589f5de",
      "shortHash": "9695c4d",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: add public bank demo board"
    },
    {
      "hash": "9e63d46f56e036c8ef07b37419d6339d8d00d1b3",
      "shortHash": "9e63d46",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: add bank risk diagnostic workspace"
    }
  ]
};
