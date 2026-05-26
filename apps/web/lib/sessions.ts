import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type DashboardSession = {
  id: string;
  createdAt: string;
  featureName: string;
  summary: string;
  changedFilesCount: number;
};

export type SessionDetail = DashboardSession & {
  userNote: string;
  changedFiles: string[];
  risks: string[];
  todos: string[];
  portfolioText: string;
  gitStatus: string;
  markdownPreview: string | null;
};

type RawSession = {
  id?: string;
  createdAt?: string;
  note?: string;
  git?: {
    changedFiles?: string[];
    status?: string;
  };
  analysis?: {
    feature_name?: string;
    summary?: string;
    risks?: string[];
    todos?: string[];
    portfolio_text?: string;
  };
};

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
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
    userNote: rawSession.note ?? "",
    changedFiles,
    risks: rawSession.analysis?.risks ?? [],
    todos: rawSession.analysis?.todos ?? [],
    portfolioText: rawSession.analysis?.portfolio_text ?? "",
    gitStatus: rawSession.git?.status ?? "",
    markdownPreview: readMarkdownPreview(id, featureName)
  };
}

export function getDashboardSessions(): DashboardSession[] {
  const sessionsDir = join(getRepositoryRoot(), ".vibelog", "sessions");

  if (!existsSync(sessionsDir)) {
    return [];
  }

  return readdirSync(sessionsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const rawSession = JSON.parse(
        readFileSync(join(sessionsDir, file), "utf8")
      ) as RawSession;
      const session = toSessionDetail(rawSession, file);

      return {
        id: session.id,
        createdAt: session.createdAt,
        featureName: session.featureName,
        summary: session.summary,
        changedFilesCount: session.changedFilesCount
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
