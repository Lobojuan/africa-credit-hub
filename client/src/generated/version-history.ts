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
  "generatedAt": "2026-07-07T01:13:00.565Z",
  "branch": "claude/production-check-WFJxR",
  "currentCommit": "78e6007",
  "commits": [
    {
      "hash": "78e6007322dfb1dc1b60c2e03ac6debddce59540",
      "shortHash": "78e6007",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "refactor(cleanup): code review pass — remove unsafe casts, fix hardcoded values, structured logging"
    },
    {
      "hash": "10b2fae7a696afa935521ae89664fdfbe752a925",
      "shortHash": "10b2fae",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "fix: add wget to replit.nix to force fresh Nix layer + build-script pruning"
    },
    {
      "hash": "9aaea138a79baebf415c8940fa313e268bd360a5",
      "shortHash": "9aaea13",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "fix: prune dev-only dirs in build script to reduce deployment image size"
    },
    {
      "hash": "7ac2f673c0c0fbe91509e983487b6194ce1ce20d",
      "shortHash": "7ac2f67",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "fix: add .replitignore to reduce deployment image below 8 GiB limit"
    },
    {
      "hash": "aa1530997c1ed6455e34c12cbdfad50140281054",
      "shortHash": "aa15309",
      "date": "2026-07-01",
      "author": "Uffe J Carlson",
      "subject": "seo: expand sitemap to 21 URLs + add <Seo> to 6 public pages"
    },
    {
      "hash": "d286423684c20136d88a848b0537a7311f1bba06",
      "shortHash": "d286423",
      "date": "2026-06-07",
      "author": "Uffe J Carlson",
      "subject": "Rebrand: Africa Credit Hub -> Universal Credit Hub across docs (54 refs, 18 files)"
    },
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
    }
  ]
};
