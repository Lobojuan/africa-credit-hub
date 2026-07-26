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
  "generatedAt": "2026-07-26T19:22:29.431Z",
  "branch": "main",
  "currentCommit": "a714bc5",
  "commits": [
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
    },
    {
      "hash": "63a76dd90e69a62aa00ba3e7f9765eacb7a1b6a5",
      "shortHash": "63a76dd",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: isolate localhost USSD E2E callbacks"
    },
    {
      "hash": "b556aead94cb42e39fcdd0f36c8b752394d77c25",
      "shortHash": "b556aea",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: rotate E2E sessions before assigning identities"
    },
    {
      "hash": "4c93ffcd94ee4e71eb4956dc8b67a131c7907041",
      "shortHash": "4c93ffc",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "test: use isolated workspace-aware E2E sessions"
    }
  ]
};
