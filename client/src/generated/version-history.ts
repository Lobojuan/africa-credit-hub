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
  "generatedAt": "2026-07-30T12:06:18.265Z",
  "branch": "main",
  "currentCommit": "8145abb",
  "commits": [
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
    },
    {
      "hash": "993405f70262e6f5a819dbe16a3ab438ea69ef67",
      "shortHash": "993405f",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "security: require HTTPS for registry credential tests"
    },
    {
      "hash": "7038d229aceb7758c99162c31a13d61b7dca56f1",
      "shortHash": "7038d22",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "security: remove production guide login and sanitize landing HTML"
    },
    {
      "hash": "af745b934b129f81eee67694495b46e613e32b82",
      "shortHash": "af745b9",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "fix: disable guide auto-login in production"
    },
    {
      "hash": "dad79cd2606036fdcff7153104bb1dc9c7dcf1cc",
      "shortHash": "dad79cd",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "fix: require evidence before IFRS 9 cure migration"
    },
    {
      "hash": "3337333340ef0591a568a5c403f35f5bdf2b3be2",
      "shortHash": "3337333",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "feat: add governed IFRS 9 draft ECL engine"
    },
    {
      "hash": "82b7ed6eeb74fefe7b23d4066abf0900e46fb8ce",
      "shortHash": "82b7ed6",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "ci: make skipped production deployments explicit"
    },
    {
      "hash": "375bda5c1d4a7b553c94b67c94850252c6924c95",
      "shortHash": "375bda5",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "docs: add bank SSO readiness evidence"
    },
    {
      "hash": "afe7eda691910caf03ebf8ed81d94d9746a7e0cc",
      "shortHash": "afe7eda",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "feat: add approved Ghana macro-risk observations"
    },
    {
      "hash": "71ed3a1b20f13be1a9df20a7eaf4aa5a446ca2a7",
      "shortHash": "71ed3a1",
      "date": "2026-07-29",
      "author": "Uffe J Carlson",
      "subject": "fix: preserve HTTP assets in WebKit E2E"
    }
  ]
};
