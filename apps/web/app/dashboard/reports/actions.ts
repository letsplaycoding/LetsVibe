"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
}

function createReportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function sanitizeWeekId(weekId: string): string {
  return weekId.replace(/[^a-zA-Z0-9-]/g, "-") || "unknown-week";
}

export async function exportWeeklyReportMarkdown(
  weekId: string,
  markdown: string
): Promise<string> {
  const reportsDir = join(getRepositoryRoot(), ".vibelog", "reports");
  await mkdir(reportsDir, { recursive: true });

  const filePath = join(
    reportsDir,
    `weekly-report-${sanitizeWeekId(weekId)}-${createReportId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
