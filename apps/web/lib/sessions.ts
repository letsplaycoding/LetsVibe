import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export type DashboardSession = {
  id: string;
  projectId: string;
  projectName: string;
  repository: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
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
    projectId: string;
    projectName: string;
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
  sessionCount: number;
  isCurrent: boolean;
};

export type GitMetadata = {
  repository: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
};

type RawSession = {
  fileName?: string;
  logsDir?: string;
  id?: string;
  projectId?: string;
  projectName?: string;
  repository?: string;
  branch?: string;
  commitHash?: string;
  commitMessage?: string;
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

type SessionCacheEntry = {
  sessions: RawSession[];
  lastLoadedAt: number;
  signature: string;
  sourceDirectoryMtimeMs: number;
};

type SessionSource = {
  sessionsDir: string;
  logsDir: string;
};

type SessionDetailContext = {
  project: ProjectMetadata;
  gitMetadata: GitMetadata | null;
};

const sessionCache = new Map<string, SessionCacheEntry>();

function runGit(args: string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function findRepositoryRootFromFileSystem(startPath: string): string | null {
  let currentPath = resolve(startPath);

  while (true) {
    if (existsSync(join(currentPath, ".git"))) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);

    if (parentPath === currentPath) {
      return null;
    }

    currentPath = parentPath;
  }
}

function getRepositoryRoot(): string {
  try {
    return runGit(["rev-parse", "--show-toplevel"], process.cwd());
  } catch {
    return (
      findRepositoryRootFromFileSystem(process.cwd()) ??
      resolve(process.cwd(), "..", "..")
    );
  }
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
    projectName,
    sessionCount: 0,
    isCurrent: true
  };
}

function getGitValue(repositoryRoot: string, commands: string[][]): string {
  for (const command of commands) {
    try {
      const value = runGit(command, repositoryRoot);

      if (value) {
        return value;
      }
    } catch {
      continue;
    }
  }

  return "";
}

export function getGitMetadata(): GitMetadata {
  const repositoryRoot = getRepositoryRoot();
  const repository = basename(repositoryRoot.replace(/[\\/]+$/, "")) || "Project";

  return {
    repository,
    branch: getGitValue(repositoryRoot, [
      ["branch", "--show-current"],
      ["rev-parse", "--abbrev-ref", "HEAD"]
    ]),
    commitHash: getGitValue(repositoryRoot, [
      ["rev-parse", "HEAD"],
      ["log", "-1", "--format=%H"]
    ]),
    commitMessage: getGitValue(repositoryRoot, [
      ["log", "-1", "--format=%s"]
    ])
  };
}

export function getAvailableProjects(): ProjectMetadata[] {
  const repositoryRoot = getRepositoryRoot();
  const currentProject = getCurrentProject();
  const projectsDir = join(repositoryRoot, ".vibelog", "projects");
  const projects = new Map<string, ProjectMetadata>();

  projects.set(currentProject.projectId, currentProject);

  if (existsSync(projectsDir)) {
    for (const projectId of readdirSync(projectsDir)) {
      const projectDir = join(projectsDir, projectId);
      const sessionsDir = join(projectDir, "sessions");
      const sessionCount = existsSync(sessionsDir)
        ? readdirSync(sessionsDir).filter((file) => file.endsWith(".json")).length
        : 0;

      projects.set(projectId, {
        projectId,
        projectName: projectId,
        sessionCount,
        isCurrent: projectId === currentProject.projectId
      });
    }
  }

  const legacySessionsDir = join(repositoryRoot, ".vibelog", "sessions");
  const legacyCount = existsSync(legacySessionsDir)
    ? readdirSync(legacySessionsDir).filter((file) => file.endsWith(".json")).length
    : 0;

  if (legacyCount > 0) {
    const current = projects.get(currentProject.projectId) ?? currentProject;
    projects.set(currentProject.projectId, {
      ...current,
      projectName: currentProject.projectName,
      sessionCount: current.sessionCount + legacyCount,
      isCurrent: true
    });
  }

  return Array.from(projects.values()).sort((a, b) =>
    a.projectName.localeCompare(b.projectName)
  );
}

export function resolveProject(projectId?: string): ProjectMetadata {
  const projects = getAvailableProjects();
  const currentProject = getCurrentProject();

  return (
    projects.find((project) => project.projectId === projectId) ??
    projects.find((project) => project.projectId === currentProject.projectId) ??
    currentProject
  );
}

export function getCurrentProjectDir(projectId?: string): string {
  const project = resolveProject(projectId);

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

function getDirectoryMtimeMs(directory: string): number {
  try {
    return existsSync(directory) ? statSync(directory).mtimeMs : 0;
  } catch {
    return 0;
  }
}

function getSessionSourceSignature(source: SessionSource): string {
  if (!existsSync(source.sessionsDir)) {
    return `${source.sessionsDir}:missing`;
  }

  const files = readdirSync(source.sessionsDir)
    .filter((file) => file.endsWith(".json"))
    .sort();
  const fileSignature = files
    .map((file) => {
      const filePath = join(source.sessionsDir, file);

      try {
        const stats = statSync(filePath);

        return `${file}:${stats.mtimeMs}:${stats.size}`;
      } catch {
        return `${file}:missing`;
      }
    })
    .join(",");

  return `${source.sessionsDir}:${getDirectoryMtimeMs(source.sessionsDir)}:${fileSignature}`;
}

function getSessionSources(
  repositoryRoot: string,
  project: ProjectMetadata,
  currentProject: ProjectMetadata
): SessionSource[] {
  const projectDir = join(repositoryRoot, ".vibelog", "projects", project.projectId);
  const sources: SessionSource[] = [
    {
      sessionsDir: join(projectDir, "sessions"),
      logsDir: join(projectDir, "logs")
    }
  ];

  if (project.projectId === currentProject.projectId) {
    sources.push({
      sessionsDir: join(repositoryRoot, ".vibelog", "sessions"),
      logsDir: join(repositoryRoot, ".vibelog", "logs")
    });
  }

  return sources;
}

function shouldLogSessionLoad(): boolean {
  return process.env.NODE_ENV === "development";
}

function readRawSessions(projectId?: string): RawSession[] {
  const repositoryRoot = getRepositoryRoot();
  const project = resolveProject(projectId);
  const currentProject = getCurrentProject();
  const sources = getSessionSources(repositoryRoot, project, currentProject);
  const signature = sources.map(getSessionSourceSignature).join("|");
  const sourceDirectoryMtimeMs = Math.max(
    ...sources.map((source) => getDirectoryMtimeMs(source.sessionsDir)),
    0
  );
  const cached = sessionCache.get(project.projectId);

  if (cached?.signature === signature) {
    return cached.sessions;
  }

  const startedAt = Date.now();
  const sessionsById = new Map<string, RawSession>();

  for (const source of sources) {
    for (const session of readRawSessionsFromDir(
      source.sessionsDir,
      source.logsDir
    )) {
      const key = session.fileName ?? session.id ?? "";

      if (!sessionsById.has(key)) {
        sessionsById.set(key, session);
      }
    }
  }

  const sessions = Array.from(sessionsById.values());
  const loadDurationMs = Date.now() - startedAt;
  sessionCache.set(project.projectId, {
    sessions,
    lastLoadedAt: Date.now(),
    signature,
    sourceDirectoryMtimeMs
  });

  if (shouldLogSessionLoad()) {
    console.info(
      `[VibeLog] loaded ${sessions.length} sessions for ${project.projectId} in ${loadDurationMs}ms`
    );
  }

  return sessions;
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

function toSessionDetail(
  rawSession: RawSession,
  file: string,
  selectedProjectId?: string,
  context?: SessionDetailContext
): SessionDetail {
  const project = context?.project ?? resolveProject(selectedProjectId);
  const gitMetadata =
    context?.gitMetadata ?? (project.isCurrent ? getGitMetadata() : null);
  const id = file.replace(/\.json$/, "");
  const featureName = rawSession.analysis?.feature_name ?? "Development Session";
  const changedFiles = rawSession.git?.changedFiles ?? [];

  return {
    id,
    projectId: rawSession.projectId ?? project.projectId,
    projectName: rawSession.projectName ?? project.projectName,
    repository: rawSession.repository || gitMetadata?.repository || project.projectName,
    branch: rawSession.branch || gitMetadata?.branch || "",
    commitHash: rawSession.commitHash || gitMetadata?.commitHash || "",
    commitMessage: rawSession.commitMessage || gitMetadata?.commitMessage || "",
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
      rawSession.logsDir ?? join(getCurrentProjectDir(project.projectId), "logs")
    )
  };
}

export function getDashboardSessions(projectId?: string): DashboardSession[] {
  const project = resolveProject(projectId);
  const context: SessionDetailContext = {
    project,
    gitMetadata: project.isCurrent ? getGitMetadata() : null
  };

  return readRawSessions(projectId)
    .map((rawSession) => {
      const session = toSessionDetail(
        rawSession,
        rawSession.fileName ?? `${rawSession.id ?? ""}.json`,
        project.projectId,
        context
      );

      return {
        id: session.id,
        projectId: session.projectId,
        projectName: session.projectName,
        repository: session.repository,
        branch: session.branch,
        commitHash: session.commitHash,
        commitMessage: session.commitMessage,
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

export function getPortfolioSessions(projectId?: string): PortfolioSession[] {
  const project = resolveProject(projectId);
  const context: SessionDetailContext = {
    project,
    gitMetadata: project.isCurrent ? getGitMetadata() : null
  };

  return readRawSessions(projectId)
    .map((rawSession) => {
      const session = toSessionDetail(
        rawSession,
        rawSession.fileName ?? `${rawSession.id ?? ""}.json`,
        project.projectId,
        context
      );

      return {
        id: session.id,
        projectId: session.projectId,
        projectName: session.projectName,
        repository: session.repository,
        branch: session.branch,
        commitHash: session.commitHash,
        commitMessage: session.commitMessage,
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

export function getSearchSessions(projectId?: string): SearchSession[] {
  const project = resolveProject(projectId);
  const context: SessionDetailContext = {
    project,
    gitMetadata: project.isCurrent ? getGitMetadata() : null
  };

  return readRawSessions(projectId)
    .map((rawSession) =>
      toSessionDetail(
        rawSession,
        rawSession.fileName ?? `${rawSession.id ?? ""}.json`,
        project.projectId,
        context
      )
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getCompareSessions(projectId?: string): CompareSession[] {
  return getSearchSessions(projectId);
}

export function getSettingsSummary(projectId?: string): SettingsSummary {
  const project = resolveProject(projectId);
  const context: SessionDetailContext = {
    project,
    gitMetadata: project.isCurrent ? getGitMetadata() : null
  };
  const sessions = readRawSessions(project.projectId).map((rawSession) =>
    toSessionDetail(
      rawSession,
      rawSession.fileName ?? `${rawSession.id ?? ""}.json`,
      project.projectId,
      context
    )
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

export function getOverviewSummary(projectId?: string): OverviewSummary {
  const project = resolveProject(projectId);
  const sessions = getSearchSessions(project.projectId);
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
      projectId: session.projectId,
      projectName: session.projectName,
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

export function getWeeklyReportGroups(projectId?: string): WeeklyReportGroup[] {
  const groups = new Map<string, WeeklyReportGroup>();

  for (const session of getSearchSessions(projectId)) {
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

export function getStorySessions(projectId?: string): StorySession[] {
  return getSearchSessions(projectId)
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

export function getDashboardSession(
  id: string,
  projectId?: string
): SessionDetail | null {
  const project = resolveProject(projectId);
  const context: SessionDetailContext = {
    project,
    gitMetadata: project.isCurrent ? getGitMetadata() : null
  };
  const rawSession = readRawSessions(project.projectId).find((session) => {
    const sessionId = session.fileName?.replace(/\.json$/, "") ?? session.id;

    return sessionId === id || session.id === id;
  });

  if (!rawSession) {
    return null;
  }

  return toSessionDetail(
    rawSession,
    rawSession.fileName ?? `${id}.json`,
    project.projectId,
    context
  );
}
