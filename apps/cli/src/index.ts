#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type Analysis = {
  feature_name: string;
  summary: string;
  risks: string[];
  todos: string[];
  portfolio_text: string;
};

type Session = {
  id: string;
  createdAt: string;
  command: "vibelog end";
  note: string;
  tags: string[];
  git: {
    repositoryRoot: string;
    status: string;
    changedFiles: string[];
    diff: string;
  };
  analysis: Analysis;
};

type ListedSession = {
  session: Session;
  markdownPath: string | null;
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

function loadEnv(repositoryRoot: string): void {
  const envPath = join(repositoryRoot, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getOpenAiApiKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  if (!/^[\x20-\x7E]+$/.test(apiKey)) {
    return null;
  }

  return apiKey;
}

function createMockAnalysis(note: string, changedFiles: string[]): Analysis {
  const workNote = note || "local development changes";

  return {
    feature_name: "Development Session",
    summary: `Worked on ${workNote}. Changed ${changedFiles.length} files.`,
    risks: [],
    todos: [],
    portfolio_text: "Implemented local development changes."
  };
}

async function getAnalysis(
  note: string,
  changedFiles: string[],
  diff: string
): Promise<Analysis> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    console.log("Using mock AI analysis");
    return createMockAnalysis(note, changedFiles);
  }

  try {
    return await analyzeSession(apiKey, note, changedFiles, diff);
  } catch {
    console.log("Using mock AI analysis");
    return createMockAnalysis(note, changedFiles);
  }
}

function buildAnalysisPrompt(note: string, changedFiles: string[], diff: string): string {
  return [
    "Analyze this local coding session.",
    "",
    "User note:",
    note || "(empty)",
    "",
    "Changed files:",
    changedFiles.length > 0 ? changedFiles.join("\n") : "(none)",
    "",
    "Git diff:",
    diff || "(no unstaged diff)"
  ].join("\n");
}

function extractResponseText(responseJson: unknown): string {
  if (
    typeof responseJson === "object" &&
    responseJson !== null &&
    "output_text" in responseJson &&
    typeof responseJson.output_text === "string"
  ) {
    return responseJson.output_text;
  }

  if (
    typeof responseJson === "object" &&
    responseJson !== null &&
    "output" in responseJson &&
    Array.isArray(responseJson.output)
  ) {
    const textParts: string[] = [];

    for (const item of responseJson.output) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("content" in item) ||
        !Array.isArray(item.content)
      ) {
        continue;
      }

      for (const content of item.content) {
        if (
          typeof content === "object" &&
          content !== null &&
          "text" in content &&
          typeof content.text === "string"
        ) {
          textParts.push(content.text);
        }
      }
    }

    return textParts.join("");
  }

  return "";
}

function parseAnalysis(responseText: string): Analysis {
  const parsed = JSON.parse(responseText) as Partial<Analysis>;

  return {
    feature_name: String(parsed.feature_name ?? ""),
    summary: String(parsed.summary ?? ""),
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    todos: Array.isArray(parsed.todos) ? parsed.todos.map(String) : [],
    portfolio_text: String(parsed.portfolio_text ?? "")
  };
}

async function analyzeSession(
  apiKey: string,
  note: string,
  changedFiles: string[],
  diff: string
): Promise<Analysis> {
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You generate concise development logs from git data. Return only the requested JSON fields."
        },
        {
          role: "user",
          content: buildAnalysisPrompt(note, changedFiles, diff)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "vibelog_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "feature_name",
              "summary",
              "risks",
              "todos",
              "portfolio_text"
            ],
            properties: {
              feature_name: {
                type: "string"
              },
              summary: {
                type: "string"
              },
              risks: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              todos: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              portfolio_text: {
                type: "string"
              }
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const responseJson: unknown = await response.json();
  const responseText = extractResponseText(responseJson);

  if (!responseText) {
    throw new Error("OpenAI response did not include analysis text.");
  }

  return parseAnalysis(responseText);
}

function createSessionId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function createSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "development-session";
}

function generateTags(
  note: string,
  changedFiles: string[],
  analysis: Analysis
): string[] {
  const searchableText = [
    analysis.feature_name,
    analysis.summary,
    note,
    changedFiles.join(" ")
  ]
    .join(" ")
    .toLowerCase();
  const tagKeywords = [
    "dashboard",
    "portfolio",
    "markdown",
    "cli",
    "web",
    "readme",
    "timeline",
    "search",
    "session",
    "git",
    "local",
    "tags"
  ];

  return tagKeywords.filter((tag) => searchableText.includes(tag));
}

function saveSession(repositoryRoot: string, session: Session): string {
  const sessionsDir = join(repositoryRoot, ".vibelog", "sessions");
  mkdirSync(sessionsDir, { recursive: true });

  const sessionPath = join(sessionsDir, `${session.id}.json`);
  writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");

  return sessionPath;
}

function formatMarkdownList(items: string[]): string {
  if (items.length === 0) {
    return "- None";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function buildMarkdownLog(session: Session): string {
  return [
    `# ${session.analysis.feature_name}`,
    "",
    "## Summary",
    session.analysis.summary,
    "",
    "## User Note",
    session.note || "(empty)",
    "",
    "## Changed Files",
    formatMarkdownList(session.git.changedFiles),
    "",
    "## Tags",
    formatMarkdownList(session.tags),
    "",
    "## Risks",
    formatMarkdownList(session.analysis.risks),
    "",
    "## Todos",
    formatMarkdownList(session.analysis.todos),
    "",
    "## Portfolio Text",
    session.analysis.portfolio_text,
    "",
    "## Git Status",
    "```text",
    session.git.status || "(clean)",
    "```",
    ""
  ].join("\n");
}

function saveMarkdownLog(repositoryRoot: string, session: Session): string {
  const logsDir = join(repositoryRoot, ".vibelog", "logs");
  mkdirSync(logsDir, { recursive: true });

  const slug = createSlug(session.analysis.feature_name);
  const logPath = join(logsDir, `${session.id}-${slug}.md`);
  writeFileSync(logPath, buildMarkdownLog(session), "utf8");

  return logPath;
}

function getMarkdownLogPath(repositoryRoot: string, session: Session): string | null {
  const logPath = join(
    repositoryRoot,
    ".vibelog",
    "logs",
    `${session.id}-${createSlug(session.analysis.feature_name)}.md`
  );

  return existsSync(logPath) ? logPath : null;
}

function printSummary(session: Session, sessionPath: string, logPath: string): void {
  console.log("");
  console.log("VibeLog session saved");
  console.log(`Session: ${sessionPath}`);
  console.log(`Markdown: ${logPath}`);
  console.log(`Changed files: ${session.git.changedFiles.length}`);
  console.log(
    `Tags: ${session.tags.length > 0 ? session.tags.join(", ") : "None"}`
  );

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

  console.log("");
  console.log("Analysis:");
  console.log(`Feature: ${session.analysis.feature_name}`);
  console.log(`Summary: ${session.analysis.summary}`);
}

async function endCommand(): Promise<void> {
  const repositoryRoot = getRepositoryRoot();
  const [diff, status, changedFilesOutput] = [
    runGit(["diff"], repositoryRoot),
    runGit(["status", "--short"], repositoryRoot),
    runGit(["diff", "--name-only"], repositoryRoot)
  ];
  const note = await askWorkNote();
  const changedFiles = changedFilesOutput
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
  loadEnv(repositoryRoot);
  const analysis = await getAnalysis(note, changedFiles, diff);
  const createdAt = new Date();

  const session: Session = {
    id: createSessionId(createdAt),
    createdAt: createdAt.toISOString(),
    command: "vibelog end",
    note,
    tags: generateTags(note, changedFiles, analysis),
    git: {
      repositoryRoot,
      status,
      changedFiles,
      diff
    },
    analysis
  };

  const sessionPath = saveSession(repositoryRoot, session);
  const logPath = saveMarkdownLog(repositoryRoot, session);
  printSummary(session, sessionPath, logPath);
}

function readSessions(repositoryRoot: string): ListedSession[] {
  const sessionsDir = join(repositoryRoot, ".vibelog", "sessions");

  if (!existsSync(sessionsDir)) {
    return [];
  }

  return readdirSync(sessionsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const session = JSON.parse(
        readFileSync(join(sessionsDir, file), "utf8")
      ) as Session;

      return {
        session,
        markdownPath: getMarkdownLogPath(repositoryRoot, session)
      };
    })
    .sort(
      (a, b) =>
        new Date(b.session.createdAt).getTime() -
        new Date(a.session.createdAt).getTime()
    );
}

function listCommand(): void {
  const repositoryRoot = getRepositoryRoot();
  const sessions = readSessions(repositoryRoot);

  if (sessions.length === 0) {
    console.log("No VibeLog sessions found yet. Run `vibelog end` first.");
    return;
  }

  console.log("Recent VibeLog sessions");

  sessions.forEach(({ session, markdownPath }, index) => {
    console.log("");
    console.log(`${index + 1}. ${session.analysis.feature_name}`);
    console.log(`Created: ${session.createdAt}`);
    console.log(`Changed files: ${session.git.changedFiles.length}`);
    console.log(
      `Tags: ${session.tags?.length > 0 ? session.tags.join(", ") : "None"}`
    );
    console.log(`Markdown: ${markdownPath ?? "Not found"}`);
  });
}

function findSession(
  sessions: ListedSession[],
  sessionReference: string | undefined
): ListedSession | null {
  if (!sessionReference) {
    return sessions[0] ?? null;
  }

  if (/^\d+$/.test(sessionReference)) {
    const index = Number(sessionReference) - 1;
    return sessions[index] ?? null;
  }

  const normalizedReference = sessionReference.endsWith(".json")
    ? sessionReference.slice(0, -5)
    : sessionReference;

  return (
    sessions.find(
      ({ session }) =>
        session.id === normalizedReference || `${session.id}.json` === sessionReference
    ) ?? null
  );
}

function printDetailedSession(listedSession: ListedSession): void {
  const { session, markdownPath } = listedSession;

  console.log(session.analysis.feature_name);
  console.log(`Created: ${session.createdAt}`);
  console.log(`User Note: ${session.note || "(empty)"}`);
  console.log(
    `Tags: ${session.tags?.length > 0 ? session.tags.join(", ") : "None"}`
  );
  console.log("");
  console.log("Summary:");
  console.log(session.analysis.summary);
  console.log("");
  console.log("Changed Files:");
  console.log(formatMarkdownList(session.git.changedFiles));
  console.log("");
  console.log("Risks:");
  console.log(formatMarkdownList(session.analysis.risks));
  console.log("");
  console.log("Todos:");
  console.log(formatMarkdownList(session.analysis.todos));
  console.log("");
  console.log("Portfolio Text:");
  console.log(session.analysis.portfolio_text);
  console.log("");
  console.log(`Markdown: ${markdownPath ?? "Not found"}`);
}

function showCommand(sessionReference: string | undefined): void {
  const repositoryRoot = getRepositoryRoot();
  const sessions = readSessions(repositoryRoot);

  if (sessions.length === 0) {
    console.log("No VibeLog sessions found yet. Run `vibelog end` first.");
    return;
  }

  const listedSession = findSession(sessions, sessionReference);

  if (!listedSession) {
    console.log("VibeLog session not found.");
    return;
  }

  printDetailedSession(listedSession);
}

function printTimelineSession(listedSession: ListedSession): void {
  const { session } = listedSession;

  console.log(`Timeline: ${session.analysis.feature_name}`);
  console.log("");
  console.log(`1. Session started`);
  console.log(`   Date: ${session.createdAt}`);
  console.log(`   User note: ${session.note || "(empty)"}`);
  console.log(
    `   Tags: ${session.tags?.length > 0 ? session.tags.join(", ") : "None"}`
  );
  console.log("");
  console.log("2. Files changed");
  console.log(
    formatMarkdownList(session.git.changedFiles)
      .split("\n")
      .map((line) => `   ${line}`)
      .join("\n")
  );
  console.log("");
  console.log("3. Session summary");
  console.log(`   ${session.analysis.summary}`);
  console.log("");
  console.log("4. Risks");
  console.log(
    formatMarkdownList(session.analysis.risks)
      .split("\n")
      .map((line) => `   ${line}`)
      .join("\n")
  );
  console.log("");
  console.log("5. Todos");
  console.log(
    formatMarkdownList(session.analysis.todos)
      .split("\n")
      .map((line) => `   ${line}`)
      .join("\n")
  );
  console.log("");
  console.log("6. Portfolio text");
  console.log(`   ${session.analysis.portfolio_text}`);
}

function replayCommand(sessionReference: string | undefined): void {
  const repositoryRoot = getRepositoryRoot();
  const sessions = readSessions(repositoryRoot);

  if (sessions.length === 0) {
    console.log("No VibeLog sessions found yet. Run `vibelog end` first.");
    return;
  }

  const listedSession = findSession(sessions, sessionReference);

  if (!listedSession) {
    console.log("VibeLog session not found.");
    return;
  }

  printTimelineSession(listedSession);
}

async function main(): Promise<void> {
  const [command, sessionReference] = process.argv.slice(2);

  if (command === "end") {
    await endCommand();
    return;
  }

  if (command === "list") {
    listCommand();
    return;
  }

  if (command === "show") {
    showCommand(sessionReference);
    return;
  }

  if (command === "replay") {
    replayCommand(sessionReference);
    return;
  }

  console.error(
    "Usage: vibelog end | vibelog list | vibelog show [session] | vibelog replay [session]"
  );
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
