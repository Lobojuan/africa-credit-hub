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
  "generatedAt": "2026-07-26T20:14:58.051Z",
  "branch": "main",
  "currentCommit": "9e0f12f",
  "commits": [
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
    },
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
    }
  ]
};
