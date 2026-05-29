import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

export type DashboardSession = {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  featureName: string;
  summary: string;
  changedFilesCount: number;
  tags: string[];
};

export type SessionDetail = DashboardSession & {
  userNote: string;
  changedFiles: string[];
  risks: string[];
  todos: string[];
  futureImprovements: string[];
  portfolioText: string;
  aiUsage: AiUsage;
  gitStatus: string;
  gitDiff: string;
  markdownPreview: string | null;
};

export type AiUsage = {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

export type PortfolioSession = DashboardSession & {
  portfolioText: string;
};

export type SearchSession = SessionDetail;

export type CompareSession = SessionDetail;

export type SettingsSummary = {
  projectId: string;
  projectName: string;
  apiKeyConfigured: boolean;
  providerStatus: "OpenAI" | "Mock";
  modelName: string;
  totalSessions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedTotalCostUsd: number;
};

export type OverviewSummary = {
  projectId: string;
  projectName: string;
  totalSessions: number;
  totalChangedFiles: number;
  totalTokens: number;
  estimatedTotalCostUsd: number;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
  mostActiveDay: {
    date: string;
    count: number;
  } | null;
  recentActivity: Array<{
    id: string;
    featureName: string;
    createdAt: string;
    summary: string;
  }>;
};

export type WeeklyReportSession = {
  id: string;
  createdAt: string;
  featureName: string;
  summary: string;
  changedFilesCount: number;
  changedFiles: string[];
  tags: string[];
  aiUsage: AiUsage;
  portfolioText: string;
  todos: string[];
};

export type WeeklyReportGroup = {
  weekId: string;
  weekRange: string;
  sessions: WeeklyReportSession[];
};

export type StorySession = {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  featureName: string;
  summary: string;
  changedFilesCount: number;
  tags: string[];
  risks: string[];
  todos: string[];
  futureImprovements: string[];
  portfolioText: string;
};

export type ProjectMetadata = {
  projectId: string;
  projectName: string;
};

type RawSession = {
  fileName?: string;
  logsDir?: string;
  id?: string;
  projectId?: string;
  projectName?: string;
  createdAt?: string;
  note?: string;
  tags?: string[];
  provider?: string;
  metadata?: {
    model?: string;
    provider?: string;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    estimated_cost_usd?: number;
  };
  git?: {
    changedFiles?: string[];
    status?: string;
    diff?: string;
  };
  analysis?: {
    feature_name?: string;
    summary?: string;
    risks?: string[];
    todos?: string[];
    tags?: string[];
    portfolio_text?: string;
    future_improvements?: string[];
  };
};

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
}

function createProjectId(projectName: string): string {
  const projectId = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return projectId || "project";
}

export function getCurrentProject(): ProjectMetadata {
  const repositoryRoot = getRepositoryRoot();
  const projectName = basename(repositoryRoot.replace(/[\\/]+$/, "")) || "Project";

  return {
    projectId: createProjectId(projectName),
    projectName
  };
}

export function getCurrentProjectDir(): string {
  const project = getCurrentProject();

  return join(getRepositoryRoot(), ".vibelog", "projects", project.projectId);
}

function readRawSessionsFromDir(sessionsDir: string, logsDir: string): RawSession[] {
  if (!existsSync(sessionsDir)) {
    return [];
  }

  return readdirSync(sessionsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const rawSession = JSON.parse(
        readFileSync(join(sessionsDir, file), "utf8")
      ) as RawSession;

      return {
        ...rawSession,
        fileName: file,
        logsDir
      };
    });
}

function readRawSessions(): RawSession[] {
  const repositoryRoot = getRepositoryRoot();
  const projectDir = getCurrentProjectDir();
  const projectSessions = readRawSessionsFromDir(
    join(projectDir, "sessions"),
    join(projectDir, "logs")
  );
  const legacySessions = readRawSessionsFromDir(
    join(repositoryRoot, ".vibelog", "sessions"),
    join(repositoryRoot, ".vibelog", "logs")
  );
  const sessionsById = new Map<string, RawSession>();

  for (const session of projectSessions) {
    sessionsById.set(session.fileName ?? session.id ?? "", session);
  }

  for (const session of legacySessions) {
    const key = session.fileName ?? session.id ?? "";

    if (!sessionsById.has(key)) {
      sessionsById.set(key, session);
    }
  }

  return Array.from(sessionsById.values());
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

function createSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "development-session";
}

function readMarkdownPreview(
  id: string,
  featureName: string,
  logsDir: string
): string | null {
  const markdownPath = join(logsDir, `${id}-${createSlug(featureName)}.md`);

  if (existsSync(markdownPath)) {
    return readFileSync(markdownPath, "utf8");
  }

  if (!existsSync(logsDir)) {
    return null;
  }

  const fallbackFile = readdirSync(logsDir).find(
    (file) => file.startsWith(`${id}-`) && file.endsWith(".md")
  );

  if (!fallbackFile) {
    return null;
  }

  return readFileSync(join(logsDir, fallbackFile), "utf8");
}

function generateTags(rawSession: RawSession): string[] {
  const searchableText = [
    rawSession.analysis?.feature_name ?? "",
    rawSession.analysis?.summary ?? "",
    rawSession.note ?? "",
    rawSession.git?.changedFiles?.join(" ") ?? ""
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

function normalizeTags(rawSession: RawSession): string[] {
  if (Array.isArray(rawSession.tags)) {
    return normalizeTagValues(rawSession.tags);
  }

  if (Array.isArray(rawSession.analysis?.tags)) {
    return normalizeTagValues(rawSession.analysis.tags);
  }

  return generateTags(rawSession);
}

function normalizeTagValues(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
      .map(String)
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
    )
  );
}

function toSessionDetail(rawSession: RawSession, file: string): SessionDetail {
  const project = getCurrentProject();
  const id = file.replace(/\.json$/, "");
  const featureName = rawSession.analysis?.feature_name ?? "Development Session";
  const changedFiles = rawSession.git?.changedFiles ?? [];

  return {
    id,
    projectId: rawSession.projectId ?? project.projectId,
    projectName: rawSession.projectName ?? project.projectName,
    createdAt: rawSession.createdAt ?? "",
    featureName,
    summary: rawSession.analysis?.summary ?? "",
    changedFilesCount: changedFiles.length,
    tags: normalizeTags(rawSession),
    userNote: rawSession.note ?? "",
    changedFiles,
    risks: rawSession.analysis?.risks ?? [],
    todos: rawSession.analysis?.todos ?? [],
    futureImprovements: rawSession.analysis?.future_improvements ?? [],
    portfolioText: rawSession.analysis?.portfolio_text ?? "",
    aiUsage: {
      provider: rawSession.metadata?.provider ?? rawSession.provider ?? "mock",
      model: rawSession.metadata?.model ?? "mock",
      inputTokens: rawSession.metadata?.input_tokens ?? 0,
      outputTokens: rawSession.metadata?.output_tokens ?? 0,
      totalTokens: rawSession.metadata?.total_tokens ?? 0,
      estimatedCostUsd: rawSession.metadata?.estimated_cost_usd ?? 0
    },
    gitStatus: rawSession.git?.status ?? "",
    gitDiff: rawSession.git?.diff ?? "",
    markdownPreview: readMarkdownPreview(
      id,
      featureName,
      rawSession.logsDir ?? join(getCurrentProjectDir(), "logs")
    )
  };
}

export function getDashboardSessions(): DashboardSession[] {
  return readRawSessions()
    .map((rawSession) => {
      const session = toSessionDetail(
        rawSession,
        rawSession.fileName ?? `${rawSession.id ?? ""}.json`
      );

      return {
        id: session.id,
        projectId: session.projectId,
        projectName: session.projectName,
        createdAt: session.createdAt,
        featureName: session.featureName,
        summary: session.summary,
        changedFilesCount: session.changedFilesCount,
        tags: session.tags
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getPortfolioSessions(): PortfolioSession[] {
  return readRawSessions()
    .map((rawSession) => {
      const session = toSessionDetail(
        rawSession,
        rawSession.fileName ?? `${rawSession.id ?? ""}.json`
      );

      return {
        id: session.id,
        projectId: session.projectId,
        projectName: session.projectName,
        createdAt: session.createdAt,
        featureName: session.featureName,
        summary: session.summary,
        changedFilesCount: session.changedFilesCount,
        tags: session.tags,
        portfolioText: session.portfolioText
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getSearchSessions(): SearchSession[] {
  return readRawSessions()
    .map((rawSession) =>
      toSessionDetail(rawSession, rawSession.fileName ?? `${rawSession.id ?? ""}.json`)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getCompareSessions(): CompareSession[] {
  return getSearchSessions();
}

export function getSettingsSummary(): SettingsSummary {
  const project = getCurrentProject();
  const sessions = readRawSessions().map((rawSession) =>
    toSessionDetail(rawSession, rawSession.fileName ?? `${rawSession.id ?? ""}.json`)
  );
  const apiKeyConfigured = readEnvValue("OPENAI_API_KEY") !== null;
  const totals = sessions.reduce(
    (usage, session) => {
      return {
        inputTokens: usage.inputTokens + session.aiUsage.inputTokens,
        outputTokens: usage.outputTokens + session.aiUsage.outputTokens,
        totalTokens: usage.totalTokens + session.aiUsage.totalTokens,
        estimatedCostUsd:
          usage.estimatedCostUsd + session.aiUsage.estimatedCostUsd
      };
    },
    {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0
    }
  );

  return {
    projectId: project.projectId,
    projectName: project.projectName,
    apiKeyConfigured,
    providerStatus: apiKeyConfigured ? "OpenAI" : "Mock",
    modelName: apiKeyConfigured ? "gpt-4.1-mini" : "mock",
    totalSessions: sessions.length,
    totalInputTokens: totals.inputTokens,
    totalOutputTokens: totals.outputTokens,
    totalTokens: totals.totalTokens,
    estimatedTotalCostUsd: Number(totals.estimatedCostUsd.toFixed(6))
  };
}

export function getOverviewSummary(): OverviewSummary {
  const project = getCurrentProject();
  const sessions = getSearchSessions();
  const tagCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();

  for (const session of sessions) {
    for (const tag of session.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }

    const date = new Date(session.createdAt);
    const dateLabel = Number.isNaN(date.getTime())
      ? "Unknown date"
      : date.toISOString().slice(0, 10);
    dayCounts.set(dateLabel, (dayCounts.get(dateLabel) ?? 0) + 1);
  }

  const mostActiveDay =
    Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count || b.date.localeCompare(a.date))[0] ??
    null;

  return {
    projectId: project.projectId,
    projectName: project.projectName,
    totalSessions: sessions.length,
    totalChangedFiles: sessions.reduce(
      (total, session) => total + session.changedFilesCount,
      0
    ),
    totalTokens: sessions.reduce(
      (total, session) => total + session.aiUsage.totalTokens,
      0
    ),
    estimatedTotalCostUsd: Number(
      sessions
        .reduce((total, session) => total + session.aiUsage.estimatedCostUsd, 0)
        .toFixed(6)
    ),
    topTags: Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 8),
    mostActiveDay,
    recentActivity: sessions.slice(0, 5).map((session) => ({
      id: session.id,
      featureName: session.featureName,
      createdAt: session.createdAt,
      summary: session.summary
    }))
  };
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

function formatDateLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toWeeklyReportSession(session: SearchSession): WeeklyReportSession {
  return {
    id: session.id,
    createdAt: session.createdAt,
    featureName: session.featureName,
    summary: session.summary,
    changedFilesCount: session.changedFilesCount,
    changedFiles: session.changedFiles,
    tags: session.tags,
    aiUsage: session.aiUsage,
    portfolioText: session.portfolioText,
    todos: session.todos
  };
}

export function getWeeklyReportGroups(): WeeklyReportGroup[] {
  const groups = new Map<string, WeeklyReportGroup>();

  for (const session of getSearchSessions()) {
    const createdAt = new Date(session.createdAt);
    const validDate = Number.isNaN(createdAt.getTime()) ? new Date(0) : createdAt;
    const weekStart = getWeekStart(validDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekId = formatDateLabel(weekStart);
    const existingGroup = groups.get(weekId);

    if (existingGroup) {
      existingGroup.sessions.push(toWeeklyReportSession(session));
      continue;
    }

    groups.set(weekId, {
      weekId,
      weekRange: `${formatDateLabel(weekStart)} to ${formatDateLabel(weekEnd)}`,
      sessions: [toWeeklyReportSession(session)]
    });
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.weekId.localeCompare(a.weekId)
  );
}

export function getStorySessions(): StorySession[] {
  return getSearchSessions()
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((session) => ({
      id: session.id,
      projectId: session.projectId,
      projectName: session.projectName,
      createdAt: session.createdAt,
      featureName: session.featureName,
      summary: session.summary,
      changedFilesCount: session.changedFilesCount,
      tags: session.tags,
      risks: session.risks,
      todos: session.todos,
      futureImprovements: session.futureImprovements,
      portfolioText: session.portfolioText
    }));
}

export function getDashboardSession(id: string): SessionDetail | null {
  const projectDir = getCurrentProjectDir();
  const projectSessionPath = join(projectDir, "sessions", `${id}.json`);
  const legacySessionPath = join(
    getRepositoryRoot(),
    ".vibelog",
    "sessions",
    `${id}.json`
  );
  const sessionPath = existsSync(projectSessionPath)
    ? projectSessionPath
    : legacySessionPath;

  if (!existsSync(sessionPath)) {
    return null;
  }

  const rawSession = JSON.parse(readFileSync(sessionPath, "utf8")) as RawSession;
  const logsDir =
    sessionPath === projectSessionPath
      ? join(projectDir, "logs")
      : join(getRepositoryRoot(), ".vibelog", "logs");

  return toSessionDetail({ ...rawSession, logsDir }, `${id}.json`);
}
