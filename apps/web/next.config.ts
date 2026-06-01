import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return values;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      values[key] = value;

      return values;
    }, {});
}

function firstValue(...values: Array<string | undefined>): string {
  return values.find((value) => value && value.trim()) ?? "";
}

const rootEnv = readEnvFile(join(process.cwd(), "..", "..", ".env"));
const rootLocalEnv = readEnvFile(join(process.cwd(), "..", "..", ".env.local"));
const localEnv = readEnvFile(join(process.cwd(), ".env"));
const localLocalEnv = readEnvFile(join(process.cwd(), ".env.local"));

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: firstValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      localLocalEnv.NEXT_PUBLIC_SUPABASE_URL,
      localEnv.NEXT_PUBLIC_SUPABASE_URL,
      rootLocalEnv.NEXT_PUBLIC_SUPABASE_URL,
      rootEnv.NEXT_PUBLIC_SUPABASE_URL
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: firstValue(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      localLocalEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      rootLocalEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      rootEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
};

export default nextConfig;
