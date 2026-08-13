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
  "generatedAt": "2026-08-13T10:58:29.786Z",
  "branch": "main",
  "currentCommit": "e031530",
  "commits": [
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
    },
    {
      "hash": "ebd4bb80f7f765441b7db9fb2f881b1afb4670b3",
      "shortHash": "ebd4bb8",
      "date": "2026-08-11",
      "author": "Uffe J Carlson",
      "subject": "feat: govern NPL remediation decisions"
    },
    {
      "hash": "14110d517f8a58092789bf9aad00aaa37ec3ba67",
      "shortHash": "14110d5",
      "date": "2026-08-11",
      "author": "Uffe J Carlson",
      "subject": "feat: add immutable NPL case ledger"
    },
    {
      "hash": "41825c3ae5b580a634232e013b393c4b8f3ec2ab",
      "shortHash": "41825c3",
      "date": "2026-08-11",
      "author": "Uffe J Carlson",
      "subject": "feat: govern loan tape reconciliation"
    },
    {
      "hash": "eb2c2451dfecbd564188a4e52f4e7901dccb620b",
      "shortHash": "eb2c245",
      "date": "2026-08-11",
      "author": "Uffe J Carlson",
      "subject": "feat: govern Ghana NPL reduction plans"
    }
  ]
};
