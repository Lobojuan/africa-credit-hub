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
  "generatedAt": "2026-07-30T15:26:55.207Z",
  "branch": "main",
  "currentCommit": "906b94e",
  "commits": [
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
    },
    {
      "hash": "3f83bd8d7174cf660bb80c9396d01971b30f0bdb",
      "shortHash": "3f83bd8",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "feat: refresh controlled bank pilot landing"
    },
    {
      "hash": "8145abbe05d7f2c7a56b811ff835852f7803ec9b",
      "shortHash": "8145abb",
      "date": "2026-07-30",
      "author": "Uffe J Carlson",
      "subject": "test: align bank pilot journey with IFRS9 workspace"
    },
    {
      "hash": "1b5d4c42e4ec6169f60a8802ca1e24aeb54ceab9",
      "shortHash": "1b5d4c4",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "feat: add governed bank pilot launch workspace"
    },
    {
      "hash": "d899caf41702e6677732619bb195d63747e6f0e4",
      "shortHash": "d899caf",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "security: apply central URL guard to registry tests"
    }
  ]
};
