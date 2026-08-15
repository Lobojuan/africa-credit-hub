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
  "generatedAt": "2026-08-14T12:50:56.148Z",
  "branch": "main",
  "currentCommit": "a6573bc",
  "commits": [
    {
      "hash": "a6573bca0962d4415068a33568bb9a26c60b17fe",
      "shortHash": "a6573bc",
      "date": "2026-08-14",
      "author": "UCH Dev",
      "subject": "docs: NPL engine docs + unit tests + websocket fixes + routes refactor plan"
    },
    {
      "hash": "437ba0321df1230d2313d5c2da89773e1badb101",
      "shortHash": "437ba03",
      "date": "2026-08-13",
      "author": "UCH Dev",
      "subject": "security: fix 3 high + 1 moderate npm vulnerabilities via npm audit fix"
    },
    {
      "hash": "f2a0720ae3db12f6ed7c5bc538eb0ebb00d47cd2",
      "shortHash": "f2a0720",
      "date": "2026-08-13",
      "author": "UCH Dev",
      "subject": "chore: add NPL demo seed script for bank pilot"
    },
    {
      "hash": "30d3e6d54afb216bcc6312569ad13e30130e355f",
      "shortHash": "30d3e6d",
      "date": "2026-08-13",
      "author": "UCH Dev",
      "subject": "feat(npl): add portfolio dashboard, manual classify trigger, fix server corruption"
    },
    {
      "hash": "e031530cd5d00ba961938ce345d9f53558acaed4",
      "shortHash": "e031530",
      "date": "2026-08-12",
      "author": "UCH Dev",
      "subject": "security: enable RLS on all 108 tables with org-scoped and restrictive policies for bank pilot"
    },
    {
      "hash": "f38c37435a89772e6a3ebf3dabaf4bfa2440428f",
      "shortHash": "f38c374",
      "date": "2026-08-12",
      "author": "UCH Dev",
      "subject": "security: remove hardcoded registry123 fallback, fix NPL SQL injection, replace console.log with structured logging, fix scheduler leak"
    },
    {
      "hash": "3984ad8c155248660d3f1b8f7475426790ea4e8c",
      "shortHash": "3984ad8",
      "date": "2026-08-12",
      "author": "UCH Dev",
      "subject": "feat: NPL classification engine with auto-provisioning and migration tracking"
    },
    {
      "hash": "d9bc4adfc06feb8f438c40bb1f04598c4265d3fd",
      "shortHash": "d9bc4ad",
      "date": "2026-08-12",
      "author": "UCH Dev",
      "subject": "Merge remote: keep auto-login removal for pilot security"
    },
    {
      "hash": "665cb9c3112a777725c1574301d350f1ee124638",
      "shortHash": "665cb9c",
      "date": "2026-08-12",
      "author": "UCH Dev",
      "subject": "security: remove pre-pilot backdoors and gate demo data"
    },
    {
      "hash": "91f2255ad876d03b6be65dc0c050f9f7efabe9d1",
      "shortHash": "91f2255",
      "date": "2026-08-12",
      "author": "Uffe J Carlson",
      "subject": "fix(asset-trace): isolate per-credential decryption failures"
    },
    {
      "hash": "7f9543ec3941d61285e0a0c3140a231487135d4f",
      "shortHash": "7f9543e",
      "date": "2026-08-12",
      "author": "Uffe J Carlson",
      "subject": "security: fail-closed on PII decryption errors"
    },
    {
      "hash": "901e38ccf6d792cad5633b6f427943c0b8efb89c",
      "shortHash": "901e38c",
      "date": "2026-08-11",
      "author": "Uffe J Carlson",
      "subject": "fix: make staff login recovery accessible"
    }
  ]
};
