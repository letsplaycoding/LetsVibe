"use server";

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getLanguageInstruction,
  normalizeLanguage,
  type AppLanguage
} from "../../../../../lib/language";
import {
  getCurrentProjectDir,
  getSearchSessions,
  resolveProject,
  type SearchSession
} from "../../../../../lib/sessions";

type ReleaseNotesResult = {
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

function createExportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function formatSession(session: SearchSession): string {
  return `- ${session.featureName}: ${session.summary || "Updated project work."}`;
}

function buildMockReleaseNotes(
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage = "en"
): string {
  const recentSessions = sessions.slice(0, 10);
  const improved = recentSessions.filter((session) =>
    [session.featureName, session.summary, session.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .match(/improve|polish|update|dashboard|ui|search|settings|overview/)
  );
  const fixed = recentSessions.filter((session) =>
    [session.featureName, session.summary, session.userNote]
      .join(" ")
      .toLowerCase()
      .match(/fix|bug|eperm|error|fail/)
  );
  const added = recentSessions.filter(
    (session) => !improved.includes(session) && !fixed.includes(session)
  );

  if (language === "ko") {
    return [
      `# ${projectName} 릴리스 노트`,
      "",
      "## 추가됨",
      ...(added.length > 0 ? added.map(formatSession) : ["- 추가된 항목이 없습니다."]),
      "",
      "## 개선됨",
      ...(improved.length > 0
        ? improved.map(formatSession)
        : ["- 개선된 항목이 없습니다."]),
      "",
      "## 수정됨",
      ...(fixed.length > 0 ? fixed.map(formatSession) : ["- 수정된 항목이 없습니다."]),
      ""
    ].join("\n");
  }

  return [
    `# ${projectName} Release Notes`,
    "",
    "## Added",
    ...(added.length > 0 ? added.map(formatSession) : ["- No added items found."]),
    "",
    "## Improved",
    ...(improved.length > 0
      ? improved.map(formatSession)
      : ["- No improved items found."]),
    "",
    "## Fixed",
    ...(fixed.length > 0 ? fixed.map(formatSession) : ["- No fixed items found."]),
    ""
  ].join("\n");
}

function buildPrompt(
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage
): string {
  const compactSessions = sessions.slice(0, 20).map((session) => ({
    createdAt: session.createdAt,
    feature_name: session.featureName,
    summary: session.summary,
    user_note: session.userNote,
    changed_files_count: session.changedFilesCount,
    changed_files: session.changedFiles,
    tags: session.tags,
    risks: session.risks,
    todos: session.todos,
    branch: session.branch,
    commit_hash: session.commitHash,
    commit_message: session.commitMessage
  }));

  return [
    `Generate concise Markdown release notes for ${projectName}.`,
    getLanguageInstruction(language),
    "Use only the local VibeLog sessions below.",
    "Return Markdown only with exactly these sections: Added, Improved, Fixed.",
    "Do not invent external GitHub, auth, database, cloud, or payment features.",
    "",
    "Sessions JSON:",
    JSON.stringify(compactSessions).slice(0, 24000)
  ].join("\n");
}

async function generateWithOpenAI(
  apiKey: string,
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage
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
          content: [
            "You write release notes from local development session data only.",
            getLanguageInstruction(language)
          ].join(" ")
        },
        {
          role: "user",
          content: buildPrompt(projectName, sessions, language)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI release notes request failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const markdown = payload.choices?.[0]?.message?.content?.trim();

  if (!markdown) {
    throw new Error("OpenAI release notes response was empty.");
  }

  return markdown;
}

export async function generateReleaseNotes(
  projectId: string,
  languageInput: string = "en"
): Promise<ReleaseNotesResult> {
  const project = resolveProject(projectId);
  const language = normalizeLanguage(languageInput);
  const sessions = getSearchSessions(project.projectId);
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      markdown: buildMockReleaseNotes(project.projectName, sessions, language),
      provider: "mock"
    };
  }

  try {
    return {
      markdown: await generateWithOpenAI(
        apiKey,
        project.projectName,
        sessions,
        language
      ),
      provider: "openai"
    };
  } catch {
    return {
      markdown: buildMockReleaseNotes(project.projectName, sessions, language),
      provider: "mock"
    };
  }
}

export async function exportReleaseNotesMarkdown(
  projectId: string,
  markdown: string
): Promise<string> {
  const project = resolveProject(projectId);
  const releaseNotesDir = join(
    getCurrentProjectDir(project.projectId),
    "release-notes"
  );
  await mkdir(releaseNotesDir, { recursive: true });

  const filePath = join(
    releaseNotesDir,
    `release-notes-${createExportId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
