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
  "generatedAt": "2026-07-27T14:39:22.906Z",
  "branch": "main",
  "currentCommit": "df7aa92",
  "commits": [
    {
      "hash": "df7aa9236dd9196cad57d0307ff661e5c4589767",
      "shortHash": "df7aa92",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "feat: add consumer transaction status updates"
    },
    {
      "hash": "0f4f5a3a0f066e2550d6181440d618663b222449",
      "shortHash": "0f4f5a3",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "feat: add regtech evidence pack workflow"
    },
    {
      "hash": "fd65f34096055b22675aefef507c8f1e0e5991c9",
      "shortHash": "fd65f34",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "feat: add funding and prudential radar"
    },
    {
      "hash": "228aa1679055468e05397be2270df37a08f8fbff",
      "shortHash": "228aa16",
      "date": "2026-07-27",
      "author": "Uffe J Carlson",
      "subject": "chore: refresh dependency lockfile"
    },
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
    }
  ]
};
