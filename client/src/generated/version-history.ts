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
  "generatedAt": "2026-08-12T10:05:51.081Z",
  "branch": "claude/production-check-WFJxR",
  "currentCommit": "64ee0d2",
  "commits": [
    {
      "hash": "64ee0d233773573ace8d8004ec6a08cee90c86b7",
      "shortHash": "64ee0d2",
      "date": "2026-08-12",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "33ed15435645e29c2500db922b5bca7a305ae416",
      "shortHash": "33ed154",
      "date": "2026-08-11",
      "author": "Claude",
      "subject": "feat(npl): add NPL recovery-priority ranking engine"
    },
    {
      "hash": "a0405b08a47990b3056f4715449ed42bdc4e91d8",
      "shortHash": "a0405b0",
      "date": "2026-08-11",
      "author": "Claude",
      "subject": "fix(ts): suppress @replit package type errors outside Replit env"
    },
    {
      "hash": "f6c2179dc16636a510b3b2cd672a869d7c79a9b2",
      "shortHash": "f6c2179",
      "date": "2026-07-10",
      "author": "Uffe J Carlson",
      "subject": "fix: full-audit fixes (5 real bugs found + fixed, verified with 814/814 tests + e2e)"
    },
    {
      "hash": "83efc43e520c6cd672c3e57fdd868caeb3aafe26",
      "shortHash": "83efc43",
      "date": "2026-07-09",
      "author": "Uffe J Carlson",
      "subject": "Fix fresh-clone build failure and startup crash without AI keys"
    },
    {
      "hash": "8b350b7382ce614775bf12b7533eabb37b27c84e",
      "shortHash": "8b350b7",
      "date": "2026-07-10",
      "author": "Uffe J Carlson",
      "subject": "chore: remove Replit platform coupling, add proper .env loading"
    },
    {
      "hash": "8909581df1847e2c0b6af0413330e2e6b6996877",
      "shortHash": "8909581",
      "date": "2026-07-10",
      "author": "Uffe J Carlson",
      "subject": "chore: remove Replit platform coupling, add proper .env loading"
    },
    {
      "hash": "0e736407222774c4fd70bf925fe822d791cf0117",
      "shortHash": "0e73640",
      "date": "2026-07-10",
      "author": "Uffe J Carlson",
      "subject": "fix(scoring): close A1-A3 affordability income-inflation trio"
    },
    {
      "hash": "68766f5172e0e1596b5c6aabd97666479d0d6a07",
      "shortHash": "68766f5",
      "date": "2026-07-10",
      "author": "Uffe J Carlson",
      "subject": "fix(scoring): close 3 HIGH-severity batch/alt-data exploits (B1, B2, F2)"
    },
    {
      "hash": "c616a951e379eb37f251823301837c976ee4d06e",
      "shortHash": "c616a95",
      "date": "2026-07-08",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "17c299d964f2b492526c9655f588656404b4ba63",
      "shortHash": "17c299d",
      "date": "2026-07-08",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "d021366bd10f243f9bb8301093c29f6f23f7f713",
      "shortHash": "d021366",
      "date": "2026-07-08",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    }
  ]
};
