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

export type CareerStyle = "resume" | "portfolio" | "linkedin" | "interview";

type CareerResult = {
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

const STYLE_LABELS: Record<CareerStyle, string> = {
  resume: "Resume",
  portfolio: "Portfolio",
  linkedin: "LinkedIn",
  interview: "Interview Summary"
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

function normalizeStyle(style: string): CareerStyle {
  if (
    style === "resume" ||
    style === "portfolio" ||
    style === "linkedin" ||
    style === "interview"
  ) {
    return style;
  }

  return "resume";
}

function createExportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function formatContribution(session: SearchSession): string {
  return `- **${session.featureName}**: ${
    session.summary || "Implemented local development changes."
  }`;
}

function buildMockCareerMarkdown(
  projectName: string,
  style: CareerStyle,
  sessions: SearchSession[],
  language: AppLanguage = "en"
): string {
  const tags = uniqueValues(sessions.flatMap((session) => session.tags));
  const changedFiles = sessions.reduce(
    (total, session) => total + session.changedFilesCount,
    0
  );
  const topSessions = [...sessions]
    .sort((a, b) => b.changedFilesCount - a.changedFilesCount)
    .slice(0, 5);
  const portfolioText = sessions
    .map((session) => session.portfolioText)
    .filter(Boolean)
    .slice(0, 5);

  if (sessions.length === 0) {
    if (language === "ko") {
      return [
        `# ${projectName} - ${STYLE_LABELS[style]}`,
        "",
        "## 프로젝트 요약",
        "아직 이 프로젝트의 로컬 세션이 없습니다.",
        "",
        "## 주요 기여",
        "- 커리어용 콘텐츠를 생성하기 전에 VibeLog 세션을 추가하세요.",
        "",
        "## 기술적 하이라이트",
        "- 세션이 기록되면 로컬 우선 프로젝트 히스토리가 여기에 표시됩니다.",
        "",
        "## 해결한 문제",
        "아직 충분한 로컬 세션 데이터가 없습니다.",
        "",
        "## 임팩트",
        "개발 세션이 기록된 뒤 임팩트를 요약할 수 있습니다.",
        "",
        "## 면접 답변 포인트",
        "- 의미 있는 개발 작업 후 `vibelog end`를 실행하세요.",
        ""
      ].join("\n");
    }

    return [
      `# ${projectName} - ${STYLE_LABELS[style]}`,
      "",
      "## Project Summary",
      "No local sessions exist for this project yet.",
      "",
      "## Key Contributions",
      "- Add VibeLog sessions before generating career-ready content.",
      "",
      "## Technical Highlights",
      "- Local-first project history will appear here after sessions are recorded.",
      "",
      "## Problem Solved",
      "Not enough local session data is available yet.",
      "",
      "## Impact",
      "Impact can be summarized after development sessions are captured.",
      "",
      "## Interview Talking Points",
      "- Run `vibelog end` after meaningful development work.",
      ""
    ].join("\n");
  }

  if (language === "ko") {
    return [
      `# ${projectName} - ${STYLE_LABELS[style]}`,
      "",
      "## 프로젝트 요약",
      `${projectName}는 ${sessions.length}개의 기록된 세션과 ${changedFiles}개의 변경 파일을 바탕으로 성장한 로컬 우선 개발 히스토리 프로젝트입니다. 코딩 활동을 설명 가능한 로그, 대시보드, 커리어용 산출물로 바꿉니다.`,
      "",
      "## 주요 기여",
      ...sessions.slice(0, 8).map(formatContribution),
      "",
      "## 기술적 하이라이트",
      "- CLI 기반 Git diff, status, 변경 파일 수집",
      "- 로컬 JSON 및 Markdown 개발 히스토리",
      "- 프로젝트별 대시보드 탐색과 필터링",
      "- 타임라인, 검색, 비교, 리포트, 스토리, 채팅 워크플로",
      `- 사용된 태그: ${tags.length > 0 ? tags.join(", ") : "기록 없음"}`,
      "",
      "## 해결한 문제",
      "AI 코딩 도구를 사용할 때 변경 내용과 의도를 잊기 쉽습니다. 이 프로젝트는 로컬 세션을 캡처하고 설명 가능한 개발 히스토리로 변환합니다.",
      "",
      "## 임팩트",
      portfolioText.length > 0
        ? portfolioText.map((text) => `- ${text}`).join("\n")
        : "- Git 변경 사항을 포트폴리오용 요약으로 바꾸는 로컬 워크플로를 만들었습니다.",
      "",
      "## 면접 답변 포인트",
      "- 데이터베이스, 인증, 클라우드 동기화 없이 로컬 우선 제품으로 설계했습니다.",
      "- 파일시스템 데이터를 기반으로 프로젝트별 세션 저장소와 대시보드 뷰를 구축했습니다.",
      "- OpenAI가 없어도 mock fallback으로 계속 사용할 수 있게 만들었습니다.",
      "",
      "## 가장 큰 세션",
      ...topSessions.map(
        (session) => `- ${session.featureName}: 변경 파일 ${session.changedFilesCount}개`
      ),
      ""
    ].join("\n");
  }

  return [
    `# ${projectName} - ${STYLE_LABELS[style]}`,
    "",
    "## Project Summary",
    `${projectName} is a local-first developer history project built through ${sessions.length} recorded sessions and ${changedFiles} changed files. It turns coding activity into explainable logs, dashboards, and career-ready artifacts.`,
    "",
    "## Key Contributions",
    ...sessions.slice(0, 8).map(formatContribution),
    "",
    "## Technical Highlights",
    "- CLI-based Git diff, status, and changed-file collection",
    "- Local JSON and Markdown development history",
    "- Project-aware dashboard navigation and filtering",
    "- Timeline, search, compare, reports, story, and chat workflows",
    `- Tags represented: ${tags.length > 0 ? tags.join(", ") : "none recorded"}`,
    "",
    "## Problem Solved",
    "Developers using AI coding tools can lose track of what changed and why. This project captures local sessions and converts them into reviewable, explainable development history.",
    "",
    "## Impact",
    portfolioText.length > 0
      ? portfolioText.map((text) => `- ${text}`).join("\n")
      : "- Created a local workflow for turning Git changes into portfolio-ready summaries.",
    "",
    "## Interview Talking Points",
    "- I designed the product to stay local-first without requiring a database, auth, or cloud sync.",
    "- I built project-scoped session storage and dashboard views on top of filesystem data.",
    "- I used optional AI with mock fallback so the product remains usable without billing.",
    "- I focused on making development history searchable, explainable, and reusable for career materials.",
    "",
    "## Largest Sessions",
    ...topSessions.map(
      (session) => `- ${session.featureName}: ${session.changedFilesCount} changed files`
    ),
    ""
  ].join("\n");
}

function buildPrompt(
  projectName: string,
  style: CareerStyle,
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
    `Generate ${STYLE_LABELS[style]}-style career content for ${projectName}.`,
    getLanguageInstruction(language),
    "Use only the local VibeLog session data below.",
    "Return Markdown only.",
    "Include exactly these sections:",
    "Project Summary, Key Contributions, Technical Highlights, Problem Solved, Impact, Interview Talking Points.",
    "Do not invent database, auth, cloud sync, payments, hosted SaaS, or external facts.",
    "",
    "Sessions JSON:",
    JSON.stringify(compactSessions).slice(0, 24000)
  ].join("\n");
}

async function generateWithOpenAI(
  apiKey: string,
  projectName: string,
  style: CareerStyle,
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
            "You write accurate career-ready project summaries from local development session data only.",
            getLanguageInstruction(language)
          ].join(" ")
        },
        {
          role: "user",
          content: buildPrompt(projectName, style, sessions, language)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI career request failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const markdown = payload.choices?.[0]?.message?.content?.trim();

  if (!markdown) {
    throw new Error("OpenAI career response was empty.");
  }

  return markdown;
}

export async function generateCareerMarkdown(
  projectId: string,
  style: string,
  languageInput: string = "en"
): Promise<CareerResult> {
  const project = resolveProject(projectId);
  const normalizedStyle = normalizeStyle(style);
  const language = normalizeLanguage(languageInput);
  const sessions = getSearchSessions(project.projectId);
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      markdown: buildMockCareerMarkdown(
        project.projectName,
        normalizedStyle,
        sessions,
        language
      ),
      provider: "mock"
    };
  }

  try {
    return {
      markdown: await generateWithOpenAI(
        apiKey,
        project.projectName,
        normalizedStyle,
        sessions,
        language
      ),
      provider: "openai"
    };
  } catch {
    return {
      markdown: buildMockCareerMarkdown(
        project.projectName,
        normalizedStyle,
        sessions,
        language
      ),
      provider: "mock"
    };
  }
}

export async function exportCareerMarkdown(
  projectId: string,
  style: string,
  markdown: string
): Promise<string> {
  const project = resolveProject(projectId);
  const normalizedStyle = normalizeStyle(style);
  const careerDir = join(getCurrentProjectDir(project.projectId), "career");
  await mkdir(careerDir, { recursive: true });

  const filePath = join(
    careerDir,
    `career-${normalizedStyle}-${createExportId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
