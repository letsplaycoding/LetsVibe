"use server";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getLanguageInstruction,
  normalizeLanguage,
  type AppLanguage
} from "../../../../../lib/language";
import { getSearchSessions, resolveProject, type SearchSession } from "../../../../../lib/sessions";

type ChatResult = {
  answer: string;
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

function normalizeQuestion(question: string): string {
  return question.trim().slice(0, 1000);
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function isThisWeek(value: string): boolean {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  return date >= weekAgo && date <= now;
}

function formatSession(session: SearchSession): string {
  return `- ${session.createdAt}: ${session.featureName} - ${
    session.summary || "No summary"
  } (${session.changedFilesCount} changed files; tags: ${
    session.tags.join(", ") || "none"
  })`;
}

function buildMockAnswer(
  question: string,
  sessions: SearchSession[],
  language: AppLanguage
): string {
  if (language === "ko") {
    if (sessions.length === 0) {
      return "아직 이 프로젝트의 세션이 없습니다. VibeLog에 로컬 세션 데이터가 쌓인 뒤 더 구체적으로 답변할 수 있습니다.";
    }

    return [
      `이 프로젝트에는 로컬 세션 ${sessions.length}개가 있습니다.`,
      "최근 개발 히스토리:",
      ...sessions.slice(0, 6).map(formatSession),
      "",
      "주간 작업, 대시보드 관련 작업, 변경 파일이 많은 세션, 면접 답변, 기술적 하이라이트를 물어보면 더 구체적으로 답변할 수 있습니다."
    ].join("\n");
  }

  if (sessions.length === 0) {
    return "No sessions exist for this project yet, so I can only answer after VibeLog has local session data.";
  }

  const normalizedQuestion = question.toLowerCase();
  const sortedByChangedFiles = [...sessions].sort(
    (a, b) => b.changedFilesCount - a.changedFilesCount
  );
  const matchingDashboard = sessions.filter((session) =>
    [
      session.featureName,
      session.summary,
      session.userNote,
      session.portfolioText,
      session.changedFiles.join(" "),
      session.tags.join(" ")
    ]
      .join(" ")
      .toLowerCase()
      .includes("dashboard")
  );
  const weeklySessions = sessions.filter((session) => isThisWeek(session.createdAt));
  const tags = uniqueValues(sessions.flatMap((session) => session.tags));

  if (normalizedQuestion.includes("week")) {
    const targetSessions = weeklySessions.length > 0 ? weeklySessions : sessions.slice(0, 5);

    return [
      weeklySessions.length > 0
        ? "This week, you worked on:"
        : "I do not see sessions from the last 7 days, so here are the most recent sessions instead:",
      ...targetSessions.map(formatSession)
    ].join("\n");
  }

  if (normalizedQuestion.includes("dashboard")) {
    const targetSessions = matchingDashboard.length > 0 ? matchingDashboard : sessions;

    return [
      "Dashboard-related work includes:",
      ...targetSessions.slice(0, 8).map(formatSession)
    ].join("\n");
  }

  if (
    normalizedQuestion.includes("most files") ||
    normalizedQuestion.includes("changed the most")
  ) {
    return [
      "Sessions with the most changed files:",
      ...sortedByChangedFiles.slice(0, 5).map(formatSession)
    ].join("\n");
  }

  if (normalizedQuestion.includes("interview")) {
    return [
      "For an interview, describe this project as a local-first developer history tool.",
      "Key points to mention:",
      `- It captures ${sessions.length} local coding sessions from Git data.`,
      "- It turns diffs, notes, tags, risks, and todos into reviewable development history.",
      "- It includes dashboard views, search, timeline, compare, reports, portfolio exports, and project-aware workflows.",
      "- It keeps data on the local filesystem without requiring a database, auth, or cloud sync."
    ].join("\n");
  }

  if (normalizedQuestion.includes("highlight")) {
    return [
      "Main technical highlights:",
      "- CLI-based Git diff and status collection",
      "- Local JSON and Markdown session storage",
      "- Project-scoped dashboard routes and exports",
      "- Session search, timeline, compare, reports, and story generation",
      `- Tags used across this project: ${tags.length > 0 ? tags.join(", ") : "none recorded"}`
    ].join("\n");
  }

  return [
    `This project has ${sessions.length} local sessions.`,
    "Recent development history:",
    ...sessions.slice(0, 6).map(formatSession),
    "",
    "Ask about weekly work, dashboard-related work, changed file volume, interview phrasing, or technical highlights for a more focused answer."
  ].join("\n");
}

function buildPrompt(
  question: string,
  sessions: SearchSession[],
  language: AppLanguage
): string {
  const compactSessions = sessions.map((session) => ({
    createdAt: session.createdAt,
    feature_name: session.featureName,
    summary: session.summary,
    user_note: session.userNote,
    changed_files_count: session.changedFilesCount,
    changed_files: session.changedFiles,
    tags: session.tags,
    risks: session.risks,
    todos: session.todos,
    portfolio_text: session.portfolioText,
    future_improvements: session.futureImprovements
  }));

  return [
    "Answer the user's question using only the local VibeLog session data below.",
    getLanguageInstruction(language),
    "If the sessions do not contain enough evidence, say that clearly.",
    "Keep the answer concise and practical.",
    "Do not invent database, auth, cloud sync, payments, or hosted backend details.",
    "",
    `Question: ${question}`,
    "",
    "Sessions JSON:",
    JSON.stringify(compactSessions).slice(0, 24000)
  ].join("\n");
}

async function askOpenAI(
  apiKey: string,
  question: string,
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
            "You answer questions about a project's local development history from VibeLog sessions only.",
            getLanguageInstruction(language)
          ].join(" ")
        },
        {
          role: "user",
          content: buildPrompt(question, sessions, language)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI chat request failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const answer = payload.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("OpenAI chat response was empty.");
  }

  return answer;
}

export async function askProjectHistory(
  projectId: string,
  question: string,
  languageInput: string = "en"
): Promise<ChatResult> {
  const project = resolveProject(projectId);
  const normalizedQuestion = normalizeQuestion(question);
  const language = normalizeLanguage(languageInput);
  const sessions = getSearchSessions(project.projectId);

  if (!normalizedQuestion) {
    return {
      answer:
        language === "ko"
          ? "이 프로젝트의 개발 히스토리에 대해 질문을 입력하세요."
          : "Type a question about this project's development history.",
      provider: "mock"
    };
  }

  if (sessions.length === 0) {
    return {
      answer:
        language === "ko"
          ? "아직 이 프로젝트의 세션이 없습니다. VibeLog에 로컬 세션 데이터가 쌓인 뒤 답변할 수 있습니다."
          : "No sessions exist for this project yet, so I can only answer after VibeLog has local session data.",
      provider: "mock"
    };
  }

  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      answer: buildMockAnswer(normalizedQuestion, sessions, language),
      provider: "mock"
    };
  }

  try {
    return {
      answer: await askOpenAI(apiKey, normalizedQuestion, sessions, language),
      provider: "openai"
    };
  } catch {
    return {
      answer: buildMockAnswer(normalizedQuestion, sessions, language),
      provider: "mock"
    };
  }
}
