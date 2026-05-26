"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
}

function createPortfolioId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export async function exportPortfolioMarkdown(markdown: string): Promise<string> {
  const portfolioDir = join(getRepositoryRoot(), ".vibelog", "portfolio");
  await mkdir(portfolioDir, { recursive: true });

  const filePath = join(
    portfolioDir,
    `portfolio-${createPortfolioId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
