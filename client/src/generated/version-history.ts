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
  "generatedAt": "2026-07-07T08:05:12.575Z",
  "branch": "claude/production-check-WFJxR",
  "currentCommit": "b3be797",
  "commits": [
    {
      "hash": "b3be7975c0f1a2f617431a49d601dbff266d2fd6",
      "shortHash": "b3be797",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "docs(review): scoring deep-audit findings + bureau-parity roadmap + session log"
    },
    {
      "hash": "8b1da6a8ea56b3de5cf291b05ac9579833ff9dca",
      "shortHash": "8b1da6a",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "chore: refresh generated version history"
    },
    {
      "hash": "d666ba61e385fc5c0a4163f39421553e33f04655",
      "shortHash": "d666ba6",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "docs(review): platform sweep findings — validation gaps, error leaks, nav, hygiene, i18n"
    },
    {
      "hash": "e30534305190da4e692618fcfa94f5cb1f68c148",
      "shortHash": "e305343",
      "date": "2026-07-07",
      "author": "Claude",
      "subject": "fix(security): timing-safe client_id comparison in OAuth token endpoint"
    },
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
    }
  ]
};
