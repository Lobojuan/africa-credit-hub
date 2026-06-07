#!/usr/bin/env node

const { execSync } = require("node:child_process");
const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const root = process.cwd();
const generatedDir = join(root, "client", "src", "generated");
const docsDir = join(root, "docs");

function git(command, fallback = "") {
  try {
    return execSync(`git ${command}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function readPackageVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    return String(pkg.version || "0.0.0");
  } catch {
    return "0.0.0";
  }
}

function getCommits(limit = 12) {
  const raw = git(`log -${limit} --date=short --pretty=format:%H%x1f%h%x1f%ad%x1f%an%x1f%s`);
  if (!raw) return [];

  return raw.split("\n").map((line) => {
    const [hash, shortHash, date, author, subject] = line.split("\x1f");
    return { hash, shortHash, date, author, subject };
  });
}

const data = {
  productName: "Universal Credit Hub",
  packageVersion: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  branch: git("rev-parse --abbrev-ref HEAD", "unknown"),
  currentCommit: git("rev-parse --short HEAD", "unknown"),
  commits: getCommits(),
};

mkdirSync(generatedDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

writeFileSync(
  join(generatedDir, "version-history.ts"),
  [
    "export type RepoVersionCommit = {",
    "  hash: string;",
    "  shortHash: string;",
    "  date: string;",
    "  author: string;",
    "  subject: string;",
    "};",
    "",
    "export type RepoVersionHistory = {",
    "  productName: string;",
    "  packageVersion: string;",
    "  generatedAt: string;",
    "  branch: string;",
    "  currentCommit: string;",
    "  commits: RepoVersionCommit[];",
    "};",
    "",
    `export const repoVersionHistory: RepoVersionHistory = ${JSON.stringify(data, null, 2)};`,
    "",
  ].join("\n"),
);

const commitRows = data.commits.length
  ? data.commits
      .map((commit) => `| ${commit.date} | \`${commit.shortHash}\` | ${commit.subject.replace(/\|/g, "\\|")} | ${commit.author.replace(/\|/g, "\\|")} |`)
      .join("\n")
  : "| Not available | `unknown` | Git history could not be read in this environment. | System |";

writeFileSync(
  join(docsDir, "Version_History.md"),
  [
    "# Universal Credit Hub Version History",
    "",
    `**Platform Version:** ${data.packageVersion}`,
    `**Current Commit:** \`${data.currentCommit}\``,
    `**Branch:** \`${data.branch}\``,
    `**Generated:** ${data.generatedAt}`,
    "",
    "This file is generated from the repository history by `npm run version:history`.",
    "It is refreshed automatically before `npm run dev`, `npm run build`, and `npm run check`, and by `dev-server.sh` for local previews.",
    "",
    "## Latest Repository Changes",
    "",
    "| Date | Commit | Change | Author |",
    "|---|---|---|---|",
    commitRows,
    "",
  ].join("\n"),
);

console.log(`Version history updated for Universal Credit Hub v${data.packageVersion} at ${data.currentCommit}.`);
