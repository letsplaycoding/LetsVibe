export type AppLanguage = "en" | "ko";

export const LANGUAGE_STORAGE_KEY = "vibelog-language";

export function normalizeLanguage(value: unknown): AppLanguage {
  return value === "ko" ? "ko" : "en";
}

export function getLanguageInstruction(language: unknown): string {
  return normalizeLanguage(language) === "ko"
    ? "Always respond in Korean."
    : "Always respond in English.";
}
