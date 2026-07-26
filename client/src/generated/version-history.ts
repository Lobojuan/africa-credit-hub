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
  "generatedAt": "2026-07-26T20:53:59.580Z",
  "branch": "main",
  "currentCommit": "eeaa854",
  "commits": [
    {
      "hash": "eeaa85456360ceaee68a1f07d656ec032fc1ce73",
      "shortHash": "eeaa854",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "security: require MFA for invited staff"
    },
    {
      "hash": "719af60e14a9f01d59d53aef5f75e295088fde45",
      "shortHash": "719af60",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: add secure staff invitation action"
    },
    {
      "hash": "9e0f12fc41d2030b0be376c64932ad859b3c38d9",
      "shortHash": "9e0f12f",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "docs: refresh version history"
    },
    {
      "hash": "8e1e5dbb4740075bb767ece33bdb32f60780c47e",
      "shortHash": "8e1e5db",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: complete staff account recovery flow"
    },
    {
      "hash": "b268223065b0f2cd609adb62585d953404dbdded",
      "shortHash": "b268223",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "security: add staff reset and invitation tokens"
    },
    {
      "hash": "a714bc52224fbfd401aa75fcd1b9d636db9f1482",
      "shortHash": "a714bc5",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "security: separate institutional SSO from consumer login"
    },
    {
      "hash": "10a8432be256ba62926eef2edba4f3d9b5ec9a5c",
      "shortHash": "10a8432",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "security: harden authentication recovery"
    },
    {
      "hash": "3ba2ff087428d905614dc432ce0fd44376aa318f",
      "shortHash": "3ba2ff0",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "chore: remove legacy replit integration"
    },
    {
      "hash": "2810540381c55404f7637c04c4412d5dd9cb2bf5",
      "shortHash": "2810540",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "docs: rename local UCH test database"
    },
    {
      "hash": "7d33255556d8358a6e1da6455b13c9368ef59fce",
      "shortHash": "7d33255",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "docs: record local UCH development runtime"
    },
    {
      "hash": "9d7e8fd1ae3e443f2ce42af5a6e733b3dfae7cba",
      "shortHash": "9d7e8fd",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: pin USSD gateway credentials in E2E server"
    },
    {
      "hash": "6393df3dfd66f89c86f113b7fc7fd3003802a7c2",
      "shortHash": "6393df3",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: add role-based Today command centre"
    }
  ]
};
