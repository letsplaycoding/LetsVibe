"use server";

import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { getCurrentProject, getCurrentProjectDir } from "../../../../lib/sessions";

export type EditableSessionAnalysis = {
  featureName: string;
  summary: string;
  tags: string[];
  risks: string[];
  todos: string[];
  portfolioText: string;
  futureImprovements: string[];
};

type RawSession = {
  projectId?: string;
  projectName?: string;
  tags?: string[];
  analysis?: {
    feature_name?: string;
    summary?: string;
    tags?: string[];
    risks?: string[];
    todos?: string[];
    portfolio_text?: string;
    future_improvements?: string[];
  };
};

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
}

function getSessionPath(id: string): string {
  const projectSessionPath = join(getCurrentProjectDir(), "sessions", `${id}.json`);

  if (existsSync(projectSessionPath)) {
    return projectSessionPath;
  }

  return join(getRepositoryRoot(), ".vibelog", "sessions", `${id}.json`);
}

function normalizeList(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function normalizeTagList(values: string[]): string[] {
  return normalizeList(values).map((value) => value.toLowerCase());
}

function validateText(value: string, label: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }

  if (trimmed.length > 4000) {
    throw new Error(`${label} is too long.`);
  }

  return trimmed;
}

function validateList(values: string[], label: string): string[] {
  if (values.length > 50) {
    throw new Error(`${label} has too many items.`);
  }

  for (const value of values) {
    if (value.length > 1000) {
      throw new Error(`${label} contains an item that is too long.`);
    }
  }

  return values;
}

export async function saveSessionAnalysis(
  id: string,
  analysis: EditableSessionAnalysis,
  projectId?: string
): Promise<void> {
  const projectSessionPath = join(
    getCurrentProjectDir(projectId),
    "sessions",
    `${id}.json`
  );
  const sessionPath = existsSync(projectSessionPath)
    ? projectSessionPath
    : getSessionPath(id);

  if (!existsSync(sessionPath)) {
    throw new Error("Session not found.");
  }

  const rawSession = JSON.parse(readFileSync(sessionPath, "utf8")) as RawSession;
  const project = getCurrentProject();
  const featureName = validateText(analysis.featureName, "Feature name");
  const summary = validateText(analysis.summary, "Summary");
  const portfolioText = validateText(analysis.portfolioText, "Portfolio text");
  const tags = validateList(normalizeTagList(analysis.tags), "Tags");
  const risks = validateList(normalizeList(analysis.risks), "Risks");
  const todos = validateList(normalizeList(analysis.todos), "Todos");
  const futureImprovements = validateList(
    normalizeList(analysis.futureImprovements),
    "Future improvements"
  );

  rawSession.projectId = rawSession.projectId ?? project.projectId;
  rawSession.projectName = rawSession.projectName ?? project.projectName;
  rawSession.tags = tags;
  rawSession.analysis = {
    ...rawSession.analysis,
    feature_name: featureName,
    summary,
    tags,
    risks,
    todos,
    portfolio_text: portfolioText,
    future_improvements: futureImprovements
  };

  await writeFile(sessionPath, `${JSON.stringify(rawSession, null, 2)}\n`, "utf8");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/session/${id}`);
}
