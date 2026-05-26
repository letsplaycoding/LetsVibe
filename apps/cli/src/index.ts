#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  git: {
    repositoryRoot: string;
    status: string;
    changedFiles: string[];
    diff: string;
  };
  analysis: Analysis;
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
    git: {
      repositoryRoot,
      status,
      changedFiles,
      diff
    },
    analysis
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
