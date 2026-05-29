import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type DashboardSession = {
  id: string;
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

type RawSession = {
  id?: string;
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

function getSessionsDir(): string {
  return join(getRepositoryRoot(), ".vibelog", "sessions");
}

function readRawSessions(): RawSession[] {
  const sessionsDir = getSessionsDir();

  if (!existsSync(sessionsDir)) {
    return [];
  }

  return readdirSync(sessionsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      return JSON.parse(readFileSync(join(sessionsDir, file), "utf8")) as RawSession;
    });
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

function readMarkdownPreview(id: string, featureName: string): string | null {
  const markdownPath = join(
    getRepositoryRoot(),
    ".vibelog",
    "logs",
    `${id}-${createSlug(featureName)}.md`
  );

  if (!existsSync(markdownPath)) {
    return null;
  }

  return readFileSync(markdownPath, "utf8");
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
  const id = rawSession.id ?? file.replace(/\.json$/, "");
  const featureName = rawSession.analysis?.feature_name ?? "Development Session";
  const changedFiles = rawSession.git?.changedFiles ?? [];

  return {
    id,
    createdAt: rawSession.createdAt ?? "",
    featureName,
    summary: rawSession.analysis?.summary ?? "",
    changedFilesCount: changedFiles.length,
    tags: normalizeTags(rawSession),
    userNote: rawSession.note ?? "",
    changedFiles,
    risks: rawSession.analysis?.risks ?? [],
    todos: rawSession.analysis?.todos ?? [],
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
    markdownPreview: readMarkdownPreview(id, featureName)
  };
}

export function getDashboardSessions(): DashboardSession[] {
  return readRawSessions()
    .map((rawSession) => {
      const session = toSessionDetail(rawSession, `${rawSession.id ?? ""}.json`);

      return {
        id: session.id,
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
      const session = toSessionDetail(rawSession, `${rawSession.id ?? ""}.json`);

      return {
        id: session.id,
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
    .map((rawSession) => toSessionDetail(rawSession, `${rawSession.id ?? ""}.json`))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getCompareSessions(): CompareSession[] {
  return getSearchSessions();
}

export function getSettingsSummary(): SettingsSummary {
  const sessions = readRawSessions().map((rawSession) =>
    toSessionDetail(rawSession, `${rawSession.id ?? ""}.json`)
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

export function getDashboardSession(id: string): SessionDetail | null {
  const sessionsDir = join(getRepositoryRoot(), ".vibelog", "sessions");
  const sessionPath = join(sessionsDir, `${id}.json`);

  if (!existsSync(sessionPath)) {
    return null;
  }

  const rawSession = JSON.parse(readFileSync(sessionPath, "utf8")) as RawSession;

  return toSessionDetail(rawSession, `${id}.json`);
}
