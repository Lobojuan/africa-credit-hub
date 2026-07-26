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
  "generatedAt": "2026-07-26T18:26:20.082Z",
  "branch": "main",
  "currentCommit": "4603fd1",
  "commits": [
    {
      "hash": "4603fd11f5e47c5686a34f40fdf782a60bfa2021",
      "shortHash": "4603fd1",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: isolate USSD HMAC from E2E runtime"
    },
    {
      "hash": "4c00ffc92a2eaeb71966fa65fa0eed84202179ff",
      "shortHash": "4c00ffc",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: harden E2E runtime contracts"
    },
    {
      "hash": "63a76dd90e69a62aa00ba3e7f9765eacb7a1b6a5",
      "shortHash": "63a76dd",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: isolate localhost USSD E2E callbacks"
    },
    {
      "hash": "b556aead94cb42e39fcdd0f36c8b752394d77c25",
      "shortHash": "b556aea",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: rotate E2E sessions before assigning identities"
    },
    {
      "hash": "4c93ffcd94ee4e71eb4956dc8b67a131c7907041",
      "shortHash": "4c93ffc",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: use isolated workspace-aware E2E sessions"
    },
    {
      "hash": "037e451618b6978b465b0cd037fc9270aa57bc95",
      "shortHash": "037e451",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: isolate E2E sessions and use live consumer routes"
    },
    {
      "hash": "0ca7927e22943fe597564019ea258e6dd63554f8",
      "shortHash": "0ca7927",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: align E2E coverage with protected workflows"
    },
    {
      "hash": "2ea3161a9de07fd85893cdc07f0c6edd365af2c4",
      "shortHash": "2ea3161",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: align E2E checks with access workflows"
    },
    {
      "hash": "08e8307aaed9328e00354ef62594a57e1190c9df",
      "shortHash": "08e8307",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: stabilize authenticated E2E sessions"
    },
    {
      "hash": "1adf798edc45854439be14b7f4d36cdf67b7a6fb",
      "shortHash": "1adf798",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: use active collateral fields and real admin session"
    },
    {
      "hash": "b38b3f3b50a00feac3b32a874d3341576feb9eca",
      "shortHash": "b38b3f3",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: isolate consumer and search E2E sessions"
    },
    {
      "hash": "94609284f8b780d9d669a3ad346104c85f8993ef",
      "shortHash": "9460928",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "fix: align portal routes and authenticated E2E flows"
    }
  ]
};
