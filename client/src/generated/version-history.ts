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
  "generatedAt": "2026-08-16T18:35:53.288Z",
  "branch": "main",
  "currentCommit": "1879ceb",
  "commits": [
    {
      "hash": "1879ceb5b2ad9891b6b7dc7257dc808eac4d0008",
      "shortHash": "1879ceb",
      "date": "2026-08-13",
      "author": "Uffe J Carlson",
      "subject": "fix: integrate NPL security updates and sales delivery"
    },
    {
      "hash": "23ac249dd2db418cf9cfb3720c24217c69081d28",
      "shortHash": "23ac249",
      "date": "2026-08-15",
      "author": "UCH Dev",
      "subject": "fix: TypeScript strict errors in NPL engine, websocket logger, and portfolio dashboard"
    },
    {
      "hash": "0e58b29b920afe92d6561a291363b4293a4662c3",
      "shortHash": "0e58b29",
      "date": "2026-08-15",
      "author": "UCH Dev",
      "subject": "fix: JSON.stringify reason arrays for PostgreSQL jsonb columns"
    },
    {
      "hash": "84e9093f17452169c8e4570a967daad7ae87cf6f",
      "shortHash": "84e9093",
      "date": "2026-08-15",
      "author": "UCH Dev",
      "subject": "feat: add NPL classification tables to schema + migration"
    },
    {
      "hash": "cf98ee9cf961a10690e4b791c9711e5933a68081",
      "shortHash": "cf98ee9",
      "date": "2026-08-15",
      "author": "UCH Dev",
      "subject": "fix: remove invalid settled enum from NPL classification query"
    },
    {
      "hash": "f74435b05f950abab9f27628ca0e72f5db783cc0",
      "shortHash": "f74435b",
      "date": "2026-08-15",
      "author": "UCH Dev",
      "subject": "fix: remove duplicate code blocks from websocket.ts catch fixes"
    },
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
    }
  ]
};
