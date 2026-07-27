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
  "generatedAt": "2026-07-27T11:26:49.191Z",
  "branch": "main",
  "currentCommit": "df06a26",
  "commits": [
    {
      "hash": "df06a261ec6f612143ccad943c19ca4ff531859e",
      "shortHash": "df06a26",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "chore: update production security dependencies"
    },
    {
      "hash": "08c352eaef09bec11e4c8eb51f914d551c65a586",
      "shortHash": "08c352e",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: add insider risk review"
    },
    {
      "hash": "74eff1e6e3516803c837924afe1f67be7dab20f7",
      "shortHash": "74eff1e",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: add transaction fraud monitor"
    },
    {
      "hash": "61201a571db3dee08aa9fa59d858f99361734f5d",
      "shortHash": "61201a5",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: add transaction resolution desk"
    },
    {
      "hash": "15f341d8220cc260b7ac9e93fd8d967085ea1438",
      "shortHash": "15f341d",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: add forgery review desk"
    },
    {
      "hash": "52fba2a46475ffb2ebe589f6b87341fe3478aa65",
      "shortHash": "52fba2a",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "docs: add bank requirements traceability"
    },
    {
      "hash": "700ceb2f0254848ab3231284d363c1ea58f325fd",
      "shortHash": "700ceb2",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "chore: ignore local sync artifacts"
    },
    {
      "hash": "fad2f6eeeff8d4e8196efa8b585c58fb3a2721bf",
      "shortHash": "fad2f6e",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: add NPL early warning desk"
    },
    {
      "hash": "40417b6133d4f531a1e80653b484d6ca52763aef",
      "shortHash": "40417b6",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: simplify workspace navigation"
    },
    {
      "hash": "c274c7ca8fac167299119c82c7feebe81b9ab79b",
      "shortHash": "c274c7c",
      "date": "2026-07-26",
      "author": "Uffe J Carlson",
      "subject": "feat: unify staff sign-in landing"
    },
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
    }
  ]
};
