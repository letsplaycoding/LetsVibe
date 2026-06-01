"use server";

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync
} from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { revalidatePath } from "next/cache";
import {
  getCurrentProjectDir,
  resolveProject
} from "../../../../../lib/sessions";

type BackupFileMetadata = {
  fileName: string;
  relativePath: string;
  size: number;
  modifiedAt: string;
};

type BackupSession = {
  fileName: string;
  data: unknown;
};

type ProjectBackup = {
  version: 1;
  createdAt: string;
  project: {
    projectId: string;
    projectName: string;
  };
  sessions: BackupSession[];
  logs: BackupFileMetadata[];
  exports: BackupFileMetadata[];
};

type RestoreResult = {
  restoredSessions: number;
  projectId: string;
  projectName: string;
};

const EXPORT_DIRECTORIES = [
  "portfolio",
  "reports",
  "stories",
  "career",
  "interview",
  "release-notes",
  "mentor",
  "career-timeline",
  "readme"
];

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
}

function createExportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function toFileMetadata(projectDir: string, filePath: string): BackupFileMetadata {
  const stats = statSync(filePath);

  return {
    fileName: basename(filePath),
    relativePath: relative(projectDir, filePath).replace(/\\/g, "/"),
    size: stats.size,
    modifiedAt: stats.mtime.toISOString()
  };
}

function readFileMetadata(projectDir: string, directory: string): BackupFileMetadata[] {
  if (!existsSync(directory)) {
    return [];
  }

  const metadata: BackupFileMetadata[] = [];

  for (const fileName of readdirSync(directory)) {
    const filePath = join(directory, fileName);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      metadata.push(...readFileMetadata(projectDir, filePath));
      continue;
    }

    metadata.push(toFileMetadata(projectDir, filePath));
  }

  return metadata.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function readSessions(sessionsDir: string): BackupSession[] {
  if (!existsSync(sessionsDir)) {
    return [];
  }

  return readdirSync(sessionsDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => ({
      fileName,
      data: readJsonFile(join(sessionsDir, fileName))
    }));
}

function buildProjectBackup(projectId: string): ProjectBackup {
  const project = resolveProject(projectId);
  const projectDir = getCurrentProjectDir(project.projectId);
  const sessionsDir = join(projectDir, "sessions");
  const logsDir = join(projectDir, "logs");
  const exportMetadata = EXPORT_DIRECTORIES.flatMap((directoryName) =>
    readFileMetadata(projectDir, join(projectDir, directoryName))
  );

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    project: {
      projectId: project.projectId,
      projectName: project.projectName
    },
    sessions: readSessions(sessionsDir),
    logs: readFileMetadata(projectDir, logsDir),
    exports: exportMetadata
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBackupJson(json: string): ProjectBackup {
  const parsed = JSON.parse(json) as unknown;

  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error("Unsupported backup file.");
  }

  if (!isRecord(parsed.project) || !Array.isArray(parsed.sessions)) {
    throw new Error("Backup file is missing project or session data.");
  }

  return parsed as ProjectBackup;
}

function normalizeSessionFileName(fileName: string, index: number): string {
  const safeName = basename(fileName);

  if (safeName.endsWith(".json")) {
    return safeName;
  }

  return `restored-session-${index + 1}.json`;
}

export async function createProjectBackup(projectId: string): Promise<string> {
  const project = resolveProject(projectId);
  const backup = buildProjectBackup(project.projectId);
  const backupsDir = join(getRepositoryRoot(), ".vibelog", "backups");
  await mkdir(backupsDir, { recursive: true });

  const filePath = join(
    backupsDir,
    `${project.projectId}-backup-${createExportId(new Date())}.json`
  );
  await writeFile(filePath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");

  return filePath;
}

export async function restoreProjectBackup(
  projectId: string,
  backupJson: string
): Promise<RestoreResult> {
  const project = resolveProject(projectId);
  const backup = parseBackupJson(backupJson);
  const projectDir = getCurrentProjectDir(project.projectId);
  const sessionsDir = join(projectDir, "sessions");
  await mkdir(projectDir, { recursive: true });
  await mkdir(sessionsDir, { recursive: true });

  const projectName =
    typeof backup.project.projectName === "string" && backup.project.projectName
      ? backup.project.projectName
      : project.projectName;
  await writeFile(
    join(projectDir, "project.json"),
    `${JSON.stringify(
      {
        projectId: project.projectId,
        projectName,
        restoredFromProjectId: backup.project.projectId,
        restoredAt: new Date().toISOString()
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  for (const [index, session] of backup.sessions.entries()) {
    if (!isRecord(session)) {
      continue;
    }

    const fileName = normalizeSessionFileName(String(session.fileName), index);
    const data = isRecord(session.data)
      ? {
          ...session.data,
          projectId: project.projectId,
          projectName
        }
      : session.data;

    await writeFile(
      join(sessionsDir, fileName),
      `${JSON.stringify(data, null, 2)}\n`,
      "utf8"
    );
  }

  revalidatePath(`/dashboard/project/${project.projectId}`);
  revalidatePath(`/dashboard/project/${project.projectId}/backup`);

  return {
    restoredSessions: backup.sessions.length,
    projectId: project.projectId,
    projectName
  };
}
