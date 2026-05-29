"use server";

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getCurrentProjectDir,
  getStorySessions,
  type StorySession
} from "../../../lib/sessions";

type StoryResult = {
  markdown: string;
  provider: "openai" | "mock";
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
}

function createStoryId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function readEnvValue(key: string): string | null {
  const envValue = process.env[key]?.trim();

  if (envValue) {
    return envValue;
  }

  const envPath = join(getRepositoryRoot(), ".env");

  if (!existsSync(envPath)) {
    return null;
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

    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (name === key && value) {
      return value;
    }
  }

  return null;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function formatSessionLine(session: StorySession): string {
  const date = session.createdAt ? session.createdAt.slice(0, 10) : "Unknown";

  return `- ${date}: **${session.featureName}** - ${
    session.summary || "No summary recorded"
  } (${session.changedFilesCount} changed files)`;
}

function buildMockStory(sessions: StorySession[]): string {
  const tags = uniqueValues(sessions.flatMap((session) => session.tags));
  const milestones = sessions.slice(-6).map(formatSessionLine);
  const risks = uniqueValues(sessions.flatMap((session) => session.risks));
  const todos = uniqueValues(
    sessions.flatMap((session) => [
      ...session.todos,
      ...session.futureImprovements
    ])
  );
  const portfolioText = sessions
    .map((session) => session.portfolioText)
    .filter(Boolean)
    .slice(-4);

  return [
    "# AI Project Story",
    "",
    "## Project Overview",
    sessions.length === 0
      ? "No local sessions have been recorded yet."
      : `LetsVibe evolved through ${sessions.length} local development sessions, turning Git changes into explainable logs, dashboard views, and portfolio-ready exports.`,
    "",
    "## Timeline",
    sessions.length > 0 ? sessions.map(formatSessionLine).join("\n") : "- No sessions recorded",
    "",
    "## Major Milestones",
    milestones.length > 0 ? milestones.join("\n") : "- No milestones recorded",
    "",
    "## Challenges",
    risks.length > 0
      ? risks.map((risk) => `- ${risk}`).join("\n")
      : "- Kept the product local-first while adding more dashboard workflows.",
    "",
    "## Technical Growth",
    tags.length > 0
      ? `The project expanded across ${tags.join(", ")} while preserving local filesystem storage and simple TypeScript boundaries.`
      : "The project grew through CLI, local storage, and dashboard-focused iteration.",
    "",
    "## Future Direction",
    todos.length > 0
      ? todos.map((todo) => `- ${todo}`).join("\n")
      : "- Continue improving local review, export, and storytelling workflows.",
    "",
    "## Portfolio-ready Summary",
    portfolioText.length > 0
      ? portfolioText.map((text) => `- ${text}`).join("\n")
      : "- Built a local-first developer history tool with CLI capture and dashboard review.",
    ""
  ].join("\n");
}

function buildPrompt(sessions: StorySession[]): string {
  const compactSessions = sessions.map((session) => ({
    createdAt: session.createdAt,
    feature_name: session.featureName,
    summary: session.summary,
    changed_files_count: session.changedFilesCount,
    tags: session.tags,
    risks: session.risks,
    todos: session.todos,
    future_improvements: session.futureImprovements,
    portfolio_text: session.portfolioText
  }));

  return [
    "Write a concise Markdown project evolution story for LetsVibe.",
    "Use exactly these top-level sections:",
    "Project Overview, Timeline, Major Milestones, Challenges, Technical Growth, Future Direction.",
    "Keep it specific to the sessions. Do not invent external infrastructure, database, auth, payments, or hosted SaaS features.",
    "Sessions JSON:",
    JSON.stringify(compactSessions).slice(0, 20000)
  ].join("\n\n");
}

async function buildOpenAIStory(
  sessions: StorySession[],
  apiKey: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You write accurate, concise Markdown project narratives from local development session data."
        },
        {
          role: "user",
          content: buildPrompt(sessions)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI story request failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const markdown = payload.choices?.[0]?.message?.content?.trim();

  if (!markdown) {
    throw new Error("OpenAI story response was empty.");
  }

  return markdown;
}

export async function generateProjectStoryMarkdown(): Promise<StoryResult> {
  const sessions = getStorySessions();
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      markdown: buildMockStory(sessions),
      provider: "mock"
    };
  }

  try {
    return {
      markdown: await buildOpenAIStory(sessions, apiKey),
      provider: "openai"
    };
  } catch {
    return {
      markdown: buildMockStory(sessions),
      provider: "mock"
    };
  }
}

export async function exportStoryMarkdown(markdown: string): Promise<string> {
  const storiesDir = join(getCurrentProjectDir(), "stories");
  await mkdir(storiesDir, { recursive: true });

  const filePath = join(storiesDir, `story-${createStoryId(new Date())}.md`);
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
