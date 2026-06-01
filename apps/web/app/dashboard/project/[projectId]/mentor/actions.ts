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

type MentorResult = {
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

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function countMatches(values: string[], pattern: RegExp): number {
  return values.filter((value) => pattern.test(value.toLowerCase())).length;
}

function formatSession(session: SearchSession): string {
  return `- **${session.featureName}**: ${
    session.summary || "Updated project work."
  } (${session.changedFilesCount} changed files)`;
}

function buildMockMentorReport(
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage
): string {
  const recentSessions = sessions.slice(0, 8);
  const tags = uniqueValues(sessions.flatMap((session) => session.tags));
  const risks = sessions.flatMap((session) => session.risks);
  const todos = sessions.flatMap((session) => session.todos);
  const futureImprovements = sessions.flatMap(
    (session) => session.futureImprovements
  );
  const changedFiles = sessions.flatMap((session) => session.changedFiles);
  const testSignals = countMatches(changedFiles, /test|spec|__tests__/);
  const docSignals = countMatches(changedFiles, /readme|docs|\.md$/);
  const dashboardSignals = countMatches(tags, /dashboard|web|ui/);

  if (sessions.length === 0) {
    return language === "ko"
      ? [
          `# ${projectName} AI Mentor`,
          "",
          "## Project Diagnosis",
          "아직 기록된 로컬 세션이 없습니다. 의미 있는 작업 후 `vibelog end`를 실행하면 멘토 리포트를 생성할 수 있습니다.",
          "",
          "## Strengths",
          "- 로컬 우선 워크플로를 유지할 수 있는 구조가 준비되어 있습니다.",
          "",
          "## Risks",
          "- 분석할 세션 데이터가 부족합니다.",
          "",
          "## Recommended Next Steps",
          "- 다음 기능 작업 후 CLI로 세션을 기록하세요.",
          "",
          "## Technical Debt",
          "- 세션이 쌓인 뒤 반복 리스크와 테스트 공백을 다시 확인하세요.",
          "",
          "## Portfolio Advice",
          "- 프로젝트 목적과 로컬 우선 제약을 README에 명확히 남기세요.",
          "",
          "## Interview Advice",
          "- 실제 변경 이력이 생기면 설계 결정과 트레이드오프를 함께 설명하세요.",
          ""
        ].join("\n")
      : [
          `# ${projectName} AI Mentor`,
          "",
          "## Project Diagnosis",
          "No local sessions exist yet. Run `vibelog end` after meaningful work to generate a stronger mentor report.",
          "",
          "## Strengths",
          "- The project is ready for a local-first development history workflow.",
          "",
          "## Risks",
          "- There is not enough session evidence to assess repeated risks yet.",
          "",
          "## Recommended Next Steps",
          "- Record the next meaningful feature with the CLI.",
          "",
          "## Technical Debt",
          "- Revisit testing and documentation gaps after more sessions are captured.",
          "",
          "## Portfolio Advice",
          "- Keep the project goal and local-first constraints clear in README material.",
          "",
          "## Interview Advice",
          "- Once sessions exist, explain concrete design decisions and tradeoffs.",
          ""
        ].join("\n");
  }

  if (language === "ko") {
    return [
      `# ${projectName} AI Mentor`,
      "",
      "## Project Diagnosis",
      `${projectName}에는 ${sessions.length}개의 로컬 세션이 기록되어 있습니다. 최근 흐름은 ${tags.length > 0 ? tags.slice(0, 6).join(", ") : "기능 확장"} 중심이며, 변경 파일 ${changedFiles.length}개를 기반으로 제품 기능을 점진적으로 확장하고 있습니다.`,
      "",
      "## Strengths",
      "- 로컬 JSON 세션과 Markdown export 기반의 local-first 방향이 일관됩니다.",
      dashboardSignals > 0
        ? "- 대시보드와 프로젝트별 워크플로가 꾸준히 확장되고 있습니다."
        : "- CLI와 로컬 기록 흐름을 중심으로 개발 이력이 쌓이고 있습니다.",
      "- OpenAI가 없어도 mock fallback으로 주요 기능을 사용할 수 있습니다.",
      "",
      "## Risks",
      risks.length > 0
        ? risks.slice(0, 5).map((risk) => `- ${risk}`).join("\n")
        : "- 세션에 명시된 반복 리스크는 많지 않습니다. release 전에 에러 처리와 빈 상태를 수동 점검하세요.",
      "",
      "## Recommended Next Steps",
      "- 핵심 페이지의 빈 상태, 로딩 상태, export 실패 상태를 실제로 눌러보며 검증하세요.",
      testSignals === 0
        ? "- 현재 변경 이력에서 테스트 파일 신호가 약합니다. 주요 서버 액션과 Markdown export에 최소 테스트를 추가하세요."
        : "- 기존 테스트 신호를 유지하면서 주요 생성 흐름의 회귀 테스트를 넓히세요.",
      todos.length > 0
        ? `- 세션 todo를 우선 정리하세요: ${todos.slice(0, 3).join(", ")}`
        : "- 다음 phase 전에 사용자가 가장 자주 쓰는 dashboard, session detail, export 흐름을 우선 polish 하세요.",
      "",
      "## Technical Debt",
      docSignals === 0
        ? "- 문서 변경 신호가 약합니다. 새 AI/mentor 기능을 README나 docs에 추후 반영하세요."
        : "- 문서 업데이트는 진행되고 있지만 기능 증가 속도에 맞춰 사용 예시를 계속 갱신해야 합니다.",
      "- OpenAI 호출, mock fallback, export action 사이에 반복 코드가 늘고 있어 공통 helper 후보입니다.",
      "- 한국어 fallback 문구와 UI 번역이 깨지지 않는지 Windows 환경에서 계속 확인해야 합니다.",
      "",
      "## Portfolio Advice",
      "- LetsVibe를 'AI-assisted coding history를 로컬 파일로 설명 가능한 산출물로 바꾸는 도구'로 설명하세요.",
      "- 기능 나열보다 문제, 제약(local-first), 구현한 흐름(CLI -> JSON/Markdown -> dashboard -> export)을 연결하세요.",
      "",
      "## Interview Advice",
      "- 데이터베이스와 auth를 의도적으로 넣지 않은 이유를 local-first MVP 관점에서 설명하세요.",
      "- OpenAI optional과 mock fallback이 제품 접근성과 테스트 가능성을 어떻게 높였는지 말하세요.",
      "- 최근 주요 세션 예시:",
      ...recentSessions.slice(0, 4).map(formatSession),
      futureImprovements.length > 0
        ? `- 미래 개선 후보: ${futureImprovements.slice(0, 3).join(", ")}`
        : "- 앞으로는 테스트, 문서화, 공통 provider helper 정리가 좋은 후속 작업입니다.",
      ""
    ].join("\n");
  }

  return [
    `# ${projectName} AI Mentor`,
    "",
    "## Project Diagnosis",
    `${projectName} has ${sessions.length} local sessions. Recent direction is centered on ${tags.length > 0 ? tags.slice(0, 6).join(", ") : "incremental product development"}, with ${changedFiles.length} changed-file references across recorded work.`,
    "",
    "## Strengths",
    "- The project has a consistent local-first architecture based on JSON sessions and Markdown exports.",
    dashboardSignals > 0
      ? "- Dashboard and project-aware workflows are expanding steadily."
      : "- The CLI and local development history flow provide a clear foundation.",
    "- OpenAI remains optional because mock fallback keeps the workflow usable without billing.",
    "",
    "## Risks",
    risks.length > 0
      ? risks.slice(0, 5).map((risk) => `- ${risk}`).join("\n")
      : "- Few repeated risks are recorded. Manually verify empty states, errors, and export behavior before release.",
    "",
    "## Recommended Next Steps",
    "- Validate the most common flows end to end: dashboard, session detail, generators, copy, and export.",
    testSignals === 0
      ? "- Test coverage signals are weak in changed files. Add focused coverage for server actions and Markdown export paths."
      : "- Keep expanding regression coverage around the generator and export flows.",
    todos.length > 0
      ? `- Resolve recorded todos first: ${todos.slice(0, 3).join(", ")}`
      : "- Prioritize polish for the most frequently used dashboard and export workflows.",
    "",
    "## Technical Debt",
    docSignals === 0
      ? "- Documentation signals are weak. Update README/docs after the mentor workflow stabilizes."
      : "- Documentation exists, but examples should keep pace with the growing feature set.",
    "- OpenAI calls, mock fallback, and export actions are repeated across several features and could later share a small helper.",
    "- Keep checking Korean fallback text and UI translation behavior on Windows.",
    "",
    "## Portfolio Advice",
    "- Describe LetsVibe as a local-first tool that turns AI-assisted coding history into explainable artifacts.",
    "- Connect the problem, constraints, and implementation flow: CLI capture -> JSON/Markdown -> dashboard review -> career exports.",
    "",
    "## Interview Advice",
    "- Explain why database, auth, and cloud sync were intentionally excluded from the MVP.",
    "- Highlight optional OpenAI plus mock fallback as a product and testing decision.",
    "- Recent sessions to cite:",
    ...recentSessions.slice(0, 4).map(formatSession),
    futureImprovements.length > 0
      ? `- Future improvement candidates: ${futureImprovements.slice(0, 3).join(", ")}`
      : "- Good next discussion topics: tests, docs, and shared provider helpers.",
    ""
  ].join("\n");
}

function buildPrompt(
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage
): string {
  const compactSessions = sessions.slice(0, 30).map((session) => ({
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
    `Generate an AI mentor report for ${projectName}.`,
    getLanguageInstruction(language),
    "Use only the local VibeLog sessions below.",
    "Analyze recent development direction, technical debt, missing tests, weak documentation, repeated risk patterns, next feature priorities, and portfolio improvement opportunities.",
    "Return Markdown only with exactly these sections:",
    "Project Diagnosis, Strengths, Risks, Recommended Next Steps, Technical Debt, Portfolio Advice, Interview Advice.",
    "Be concrete, practical, and grounded in session evidence. Say when evidence is limited.",
    "Do not invent database, auth, cloud sync, payments, hosted SaaS, or external facts.",
    "",
    "Sessions JSON:",
    JSON.stringify(compactSessions).slice(0, 28000)
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
            "You are a pragmatic senior engineering mentor reviewing local development history only.",
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
    throw new Error("OpenAI mentor request failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const markdown = payload.choices?.[0]?.message?.content?.trim();

  if (!markdown) {
    throw new Error("OpenAI mentor response was empty.");
  }

  return markdown;
}

export async function generateMentorReport(
  projectId: string,
  languageInput: string = "en"
): Promise<MentorResult> {
  const project = resolveProject(projectId);
  const language = normalizeLanguage(languageInput);
  const sessions = getSearchSessions(project.projectId);
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      markdown: buildMockMentorReport(project.projectName, sessions, language),
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
      markdown: buildMockMentorReport(project.projectName, sessions, language),
      provider: "mock"
    };
  }
}

export async function exportMentorReportMarkdown(
  projectId: string,
  markdown: string
): Promise<string> {
  const project = resolveProject(projectId);
  const mentorDir = join(getCurrentProjectDir(project.projectId), "mentor");
  await mkdir(mentorDir, { recursive: true });

  const filePath = join(
    mentorDir,
    `mentor-report-${createExportId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
