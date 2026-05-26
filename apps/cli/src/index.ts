#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type Session = {
  id: string;
  createdAt: string;
  command: "vibelog end";
  note: string;
  git: {
    repositoryRoot: string;
    status: string;
    changedFiles: string[];
    diff: string;
  };
};

function runGit(args: string[], cwd = process.cwd()): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trimEnd();
}

function getRepositoryRoot(): string {
  try {
    return runGit(["rev-parse", "--show-toplevel"]).trim();
  } catch {
    throw new Error("Not inside a git repository.");
  }
}

async function askWorkNote(): Promise<string> {
  const rl = createInterface({ input, output });

  try {
    return (await rl.question("What did you work on? ")).trim();
  } finally {
    rl.close();
  }
}

function createSessionId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function saveSession(repositoryRoot: string, session: Session): string {
  const sessionsDir = join(repositoryRoot, ".vibelog", "sessions");
  mkdirSync(sessionsDir, { recursive: true });

  const sessionPath = join(sessionsDir, `${session.id}.json`);
  writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");

  return sessionPath;
}

function printSummary(session: Session, sessionPath: string): void {
  console.log("");
  console.log("VibeLog session saved");
  console.log(`Session: ${sessionPath}`);
  console.log(`Changed files: ${session.git.changedFiles.length}`);

  if (session.git.changedFiles.length > 0) {
    for (const file of session.git.changedFiles) {
      console.log(`- ${file}`);
    }
  }

  if (session.git.status) {
    console.log("");
    console.log("Status:");
    console.log(session.git.status);
  }
}

async function endCommand(): Promise<void> {
  const repositoryRoot = getRepositoryRoot();
  const [diff, status, changedFilesOutput] = [
    runGit(["diff"], repositoryRoot),
    runGit(["status", "--short"], repositoryRoot),
    runGit(["diff", "--name-only"], repositoryRoot)
  ];
  const note = await askWorkNote();
  const createdAt = new Date();

  const session: Session = {
    id: createSessionId(createdAt),
    createdAt: createdAt.toISOString(),
    command: "vibelog end",
    note,
    git: {
      repositoryRoot,
      status,
      changedFiles: changedFilesOutput
        .split(/\r?\n/)
        .map((file) => file.trim())
        .filter(Boolean),
      diff
    }
  };

  const sessionPath = saveSession(repositoryRoot, session);
  printSummary(session, sessionPath);
}

async function main(): Promise<void> {
  const [command] = process.argv.slice(2);

  if (command === "end") {
    await endCommand();
    return;
  }

  console.error("Usage: vibelog end");
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
