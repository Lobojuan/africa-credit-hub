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
  "generatedAt": "2026-06-06T23:57:53.897Z",
  "branch": "main",
  "currentCommit": "5b0eda4",
  "commits": [
    {
      "hash": "5b0eda4b10e850a1ed7d9d75cec98c3baff7794f",
      "shortHash": "5b0eda4",
      "date": "2026-06-06",
      "author": "Uffe J Carlson",
      "subject": "Revert \"Clean up production landing hero\""
    },
    {
      "hash": "26e44e18d19d2e5b7cad9635278afdd52c9864f4",
      "shortHash": "26e44e1",
      "date": "2026-06-06",
      "author": "Uffe J Carlson",
      "subject": "Clean up production landing hero"
    },
    {
      "hash": "f2f789cb1383f5c43589d33b4b4fa72e1d0aba51",
      "shortHash": "f2f789c",
      "date": "2026-06-06",
      "author": "Uffe J Carlson",
      "subject": "Restore readable landing video format"
    },
    {
      "hash": "e56e2dba9d2ab66b528cd348345b44a9a4b21825",
      "shortHash": "e56e2db",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Widen landing intro video card"
    },
    {
      "hash": "a5ef440affe04d1368435b962fe92efd4c9e2844",
      "shortHash": "a5ef440",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Restore landing intro video card"
    },
    {
      "hash": "1c362994ef8aa99e881d811e71b06c0eb9f0dbf5",
      "shortHash": "1c36299",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Force French dashboard hero fallback"
    },
    {
      "hash": "6588fa9bbe90a19ead77531cdbf84c2cf62fd6c0",
      "shortHash": "6588fa9",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Refresh service worker cache on deploy"
    },
    {
      "hash": "19107abeb153f3753599dd67bc0258bb5c1fa929",
      "shortHash": "19107ab",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Translate dashboard credit hero"
    },
    {
      "hash": "ba9303c8b40b1f2978b6ce22bf4dc70ec4720436",
      "shortHash": "ba9303c",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Allow public auth shell routes"
    },
    {
      "hash": "5aa4d8a40ba9dac9dce8cd0f86ff94caccc6b471",
      "shortHash": "5aa4d8a",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Align watch test scripts"
    },
    {
      "hash": "3f9b50e74abf5fe903d8b333e6ef1b4c8cbba541",
      "shortHash": "3f9b50e",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Expand local security test coverage"
    },
    {
      "hash": "5ffeb3108fb7642f788832739017b4d3275159b8",
      "shortHash": "5ffeb31",
      "date": "2026-06-05",
      "author": "Uffe J Carlson",
      "subject": "Split local and integration tests"
    }
  ]
};
