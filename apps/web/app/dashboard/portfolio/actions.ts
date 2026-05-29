"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentProjectDir } from "../../../lib/sessions";

function createPortfolioId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export async function exportPortfolioMarkdown(markdown: string): Promise<string> {
  const portfolioDir = join(getCurrentProjectDir(), "portfolio");
  await mkdir(portfolioDir, { recursive: true });

  const filePath = join(
    portfolioDir,
    `portfolio-${createPortfolioId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
