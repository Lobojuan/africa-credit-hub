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
  "generatedAt": "2026-07-25T17:04:57.822Z",
  "branch": "main",
  "currentCommit": "3cf2cd6",
  "commits": [
    {
      "hash": "3cf2cd6122f04ea6f06a1866e0125f3bf75208bd",
      "shortHash": "3cf2cd6",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "fix: use valid portal login controls"
    },
    {
      "hash": "4f2a7e5a0d1b3674d14b6dab07ae74918b7d48ef",
      "shortHash": "4f2a7e5",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: remove stale consumer portal login click"
    },
    {
      "hash": "5ad4c75005ddab80e223cf8887baaf6d5ec6614e",
      "shortHash": "5ad4c75",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: remove stale MFA login portal clicks"
    },
    {
      "hash": "b2a7b551344a3f0b584bf6e065d21a9c962e83a0",
      "shortHash": "b2a7b55",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: align login E2E flow with portal selector"
    },
    {
      "hash": "8d28bd82d254af010d4cfb484638a2cdcaa7cfbc",
      "shortHash": "8d28bd8",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "docs: add v3 SRS review and UAT sign-off baseline"
    },
    {
      "hash": "5be274bd9ca294c84150f576e2d670580c10c70f",
      "shortHash": "5be274b",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: allow guarded E2E mutations and current login route"
    },
    {
      "hash": "e42e50c7d27d24bd21382ce57c6a59009ca7cccc",
      "shortHash": "e42e50c",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: isolate authenticated E2E session states"
    },
    {
      "hash": "11c77919f8af5e4d88accc18b2e88c93d8349fe9",
      "shortHash": "11c7791",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: mark synthetic E2E sessions consistently"
    },
    {
      "hash": "16a52875c035d3907f0cd311ec36dacf7d9d1c02",
      "shortHash": "16a5287",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: skip fingerprint audit for synthetic E2E sessions"
    },
    {
      "hash": "fed609d3162f8773cdd177045506465625f82bad",
      "shortHash": "fed609d",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "test: align Loto E2E routes and auth isolation"
    },
    {
      "hash": "87ebe6f77a223822340236ab5158a0f98d3f9984",
      "shortHash": "87ebe6f",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "fix: allow guarded E2E session fixture through CSRF"
    },
    {
      "hash": "50f1d1545dc796d0a5d9618432c254e223f7d34e",
      "shortHash": "50f1d15",
      "date": "2026-07-25",
      "author": "Uffe J Carlson",
      "subject": "fix: install shared auth browser in Firefox E2E job"
    }
  ]
};
