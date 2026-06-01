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

export type TimelineGrouping = "week" | "month";

type CareerTimelineResult = {
  markdown: string;
  provider: "openai" | "mock";
};

type TimelineGroup = {
  period: string;
  sessions: SearchSession[];
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

function normalizeGrouping(value: string): TimelineGrouping {
  return value === "month" ? "month" : "week";
}

function createExportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPeriodLabel(dateValue: string, grouping: TimelineGrouping): string {
  const date = new Date(dateValue);
  const validDate = Number.isNaN(date.getTime()) ? new Date(0) : date;

  if (grouping === "month") {
    return validDate.toISOString().slice(0, 7);
  }

  const weekStart = getWeekStart(validDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return `${formatDate(weekStart)} to ${formatDate(weekEnd)}`;
}

function groupSessions(
  sessions: SearchSession[],
  grouping: TimelineGrouping
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const session of sessions) {
    const period = getPeriodLabel(session.createdAt, grouping);
    const existingGroup = groups.get(period);

    if (existingGroup) {
      existingGroup.sessions.push(session);
      continue;
    }

    groups.set(period, {
      period,
      sessions: [session]
    });
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.period.localeCompare(a.period)
  );
}

function inferSkills(groupSessionsList: SearchSession[]): string[] {
  const text = groupSessionsList
    .flatMap((session) => [
      session.featureName,
      session.summary,
      session.userNote,
      session.tags.join(" "),
      session.changedFiles.join(" ")
    ])
    .join(" ")
    .toLowerCase();
  const skills: Array<[string, RegExp]> = [
    ["TypeScript", /typescript|tsx|\.ts|\.tsx/],
    ["Next.js App Router", /next|app router|dashboard|page\.tsx|route/],
    ["Local-first architecture", /local|filesystem|json|markdown|export/],
    ["AI integration", /openai|ai|mock|provider|chat|mentor/],
    ["Git workflow analysis", /git|diff|commit|branch|repository/],
    ["UI polish", /ui|css|dark|theme|card|layout/],
    ["Career storytelling", /career|portfolio|interview|readme|timeline/]
  ];
  const matchedSkills = skills
    .filter(([, pattern]) => pattern.test(text))
    .map(([skill]) => skill);

  return matchedSkills.length > 0 ? matchedSkills : ["Product iteration"];
}

function formatKeyWork(session: SearchSession): string {
  return `- ${session.featureName}: ${
    session.summary || "Implemented local development changes."
  }`;
}

function buildMockCareerTimeline(
  projectName: string,
  sessions: SearchSession[],
  grouping: TimelineGrouping,
  language: AppLanguage
): string {
  const groups = groupSessions(sessions, grouping);

  if (sessions.length === 0) {
    return language === "ko"
      ? [
          `# ${projectName} 커리어 타임라인`,
          "",
          "아직 기록된 세션이 없습니다. 의미 있는 작업 후 `vibelog end`를 실행하면 커리어 타임라인을 만들 수 있습니다.",
          "",
          "## 다음 단계",
          "- 기능 작업을 완료한 뒤 로컬 세션을 기록하세요.",
          "- 세션이 쌓이면 기술 성장과 포트폴리오 문구를 기간별로 정리할 수 있습니다.",
          ""
        ].join("\n")
      : [
          `# ${projectName} Career Timeline`,
          "",
          "No sessions exist yet. Run `vibelog end` after meaningful work to build a career-oriented timeline.",
          "",
          "## Next Steps",
          "- Record local sessions after feature work.",
          "- Use accumulated sessions to summarize skills, growth, and portfolio bullets by period.",
          ""
        ].join("\n");
  }

  if (language === "ko") {
    return [
      `# ${projectName} 커리어 타임라인`,
      "",
      `총 ${sessions.length}개의 로컬 세션을 ${grouping === "month" ? "월별" : "주별"}로 정리했습니다.`,
      "",
      ...groups.flatMap((group) => {
        const skills = inferSkills(group.sessions);
        const changedFilesCount = group.sessions.reduce(
          (total, session) => total + session.changedFilesCount,
          0
        );
        const tags = uniqueValues(group.sessions.flatMap((session) => session.tags));

        return [
          `## ${group.period}`,
          "",
          "### Key Work",
          ...group.sessions.slice(0, 6).map(formatKeyWork),
          "",
          "### Skills Demonstrated",
          ...skills.map((skill) => `- ${skill}`),
          "",
          "### Technical Growth",
          `- ${group.sessions.length}개 세션에서 ${changedFilesCount}개 변경 파일을 다루며 ${tags.length > 0 ? tags.slice(0, 5).join(", ") : "제품 개발"} 영역을 확장했습니다.`,
          "- 로컬 세션 기록을 기반으로 구현 내용을 설명 가능한 산출물로 전환했습니다.",
          "",
          "### Portfolio-ready Bullet Points",
          `- ${projectName}에서 ${group.period} 기간 동안 ${group.sessions.length}개 기능/개선 세션을 진행했습니다.`,
          "- Git 변경 이력과 세션 분석을 연결해 개발 히스토리를 커리어 문구로 정리했습니다.",
          ""
        ];
      })
    ].join("\n");
  }

  return [
    `# ${projectName} Career Timeline`,
    "",
    `Grouped ${sessions.length} local sessions by ${grouping}.`,
    "",
    ...groups.flatMap((group) => {
      const skills = inferSkills(group.sessions);
      const changedFilesCount = group.sessions.reduce(
        (total, session) => total + session.changedFilesCount,
        0
      );
      const tags = uniqueValues(group.sessions.flatMap((session) => session.tags));

      return [
        `## ${group.period}`,
        "",
        "### Key Work",
        ...group.sessions.slice(0, 6).map(formatKeyWork),
        "",
        "### Skills Demonstrated",
        ...skills.map((skill) => `- ${skill}`),
        "",
        "### Technical Growth",
        `- Worked across ${group.sessions.length} sessions and ${changedFilesCount} changed files, expanding ${tags.length > 0 ? tags.slice(0, 5).join(", ") : "product development"} capabilities.`,
        "- Turned local implementation history into explainable development artifacts.",
        "",
        "### Portfolio-ready Bullet Points",
        `- Delivered ${group.sessions.length} feature/improvement sessions for ${projectName} during ${group.period}.`,
        "- Connected Git-based development history with career-ready summaries and local exports.",
        ""
      ];
    })
  ].join("\n");
}

function buildPrompt(
  projectName: string,
  sessions: SearchSession[],
  grouping: TimelineGrouping,
  language: AppLanguage
): string {
  const groups = groupSessions(sessions, grouping).map((group) => ({
    period: group.period,
    sessions: group.sessions.map((session) => ({
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
    }))
  }));

  return [
    `Generate a career-oriented development timeline for ${projectName}.`,
    getLanguageInstruction(language),
    `Group the content by ${grouping}.`,
    "Use only the local VibeLog sessions below.",
    "Return Markdown only.",
    "For each period, include exactly these subsections: Key Work, Skills Demonstrated, Technical Growth, Portfolio-ready Bullet Points.",
    "Keep bullets concise, concrete, and useful for a resume, portfolio, LinkedIn, or interview.",
    "Do not invent database, auth, cloud sync, payments, hosted SaaS, or external facts.",
    "",
    "Grouped sessions JSON:",
    JSON.stringify(groups).slice(0, 28000)
  ].join("\n");
}

async function generateWithOpenAI(
  apiKey: string,
  projectName: string,
  sessions: SearchSession[],
  grouping: TimelineGrouping,
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
            "You create accurate career timeline summaries from local development session data only.",
            getLanguageInstruction(language)
          ].join(" ")
        },
        {
          role: "user",
          content: buildPrompt(projectName, sessions, grouping, language)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI career timeline request failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const markdown = payload.choices?.[0]?.message?.content?.trim();

  if (!markdown) {
    throw new Error("OpenAI career timeline response was empty.");
  }

  return markdown;
}

export async function generateCareerTimelineMarkdown(
  projectId: string,
  groupingInput: string = "week",
  languageInput: string = "en"
): Promise<CareerTimelineResult> {
  const project = resolveProject(projectId);
  const grouping = normalizeGrouping(groupingInput);
  const language = normalizeLanguage(languageInput);
  const sessions = getSearchSessions(project.projectId);
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      markdown: buildMockCareerTimeline(
        project.projectName,
        sessions,
        grouping,
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
        sessions,
        grouping,
        language
      ),
      provider: "openai"
    };
  } catch {
    return {
      markdown: buildMockCareerTimeline(
        project.projectName,
        sessions,
        grouping,
        language
      ),
      provider: "mock"
    };
  }
}

export async function exportCareerTimelineMarkdown(
  projectId: string,
  markdown: string
): Promise<string> {
  const project = resolveProject(projectId);
  const timelineDir = join(
    getCurrentProjectDir(project.projectId),
    "career-timeline"
  );
  await mkdir(timelineDir, { recursive: true });

  const filePath = join(
    timelineDir,
    `career-timeline-${createExportId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
