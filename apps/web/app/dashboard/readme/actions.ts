"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentProjectDir } from "../../../lib/sessions";

function createReadmeId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export async function exportReadmeMarkdown(markdown: string): Promise<string> {
  const readmeDir = join(getCurrentProjectDir(), "readme");
  await mkdir(readmeDir, { recursive: true });

  const filePath = join(readmeDir, `readme-${createReadmeId(new Date())}.md`);
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
