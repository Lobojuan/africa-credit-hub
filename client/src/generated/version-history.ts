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
  "generatedAt": "2026-07-27T22:37:48.793Z",
  "branch": "main",
  "currentCommit": "4898502",
  "commits": [
    {
      "hash": "4898502e5946eb50be4949f52e1cb3a56fb584b5",
      "shortHash": "4898502",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "fix: enforce staff MFA and stabilise regulator coverage"
    },
    {
      "hash": "c1382dedb14e771c4fb959edf7a99dcb9e952ced",
      "shortHash": "c1382de",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "feat: add bank operations control centre"
    },
    {
      "hash": "01025a061756101b7a072f1e44b08c8af01811c2",
      "shortHash": "01025a0",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "test: isolate collateral lifecycle coverage"
    },
    {
      "hash": "68d6566ecd5bee56bb99c733b171d3bec0a0a219",
      "shortHash": "68d6566",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "test: cover public consumer registration flow"
    },
    {
      "hash": "e5cfe841858d288968419798214f120e8242e5b8",
      "shortHash": "e5cfe84",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "fix: prevent loan form collateral select crash"
    },
    {
      "hash": "f158d944fef838c0ca78c5cc5e1983882ca9a684",
      "shortHash": "f158d94",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "fix: handle invalid loan application responses"
    },
    {
      "hash": "e8e9d09175b2b2d131c7f9a35e5fe77275a84710",
      "shortHash": "e8e9d09",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "test: align credit and loan flows with real APIs"
    },
    {
      "hash": "475b7d83693d4fe33fe545b2a8ec0f9dad4db27b",
      "shortHash": "475b7d8",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "test: align collateral regulator access coverage"
    },
    {
      "hash": "fa25fee7c87dbe4c668010f501df928f4a8e5b98",
      "shortHash": "fa25fee",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "test: stabilize authenticated UI regression flows"
    },
    {
      "hash": "2b9616d47bf5cafa01c784733c5a8d255c4b09a9",
      "shortHash": "2b9616d",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "fix: add direct institution login route"
    },
    {
      "hash": "091b8be70004ce22cace510938843c90c0314c41",
      "shortHash": "091b8be",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "test: mark mock oauth session as synthetic"
    },
    {
      "hash": "dce2e1c5288852336bfba7ff36409c1e1bd7e774",
      "shortHash": "dce2e1c",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "test: isolate local e2e server"
    }
  ]
};
