"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  type AppLanguage
} from "../lib/language";

type AppTheme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "vibelog-theme";

const TRANSLATIONS: Record<string, string> = {
  "Back to Dashboard": "\ub300\uc2dc\ubcf4\ub4dc\ub85c \ub3cc\uc544\uac00\uae30",
  "Overview": "\uac1c\uc694",
  "Reports": "\ub9ac\ud3ec\ud2b8",
  "Project Story": "\ud504\ub85c\uc81d\ud2b8 \uc2a4\ud1a0\ub9ac",
  "AI Chat": "AI \ucc44\ud305",
  "AI Mentor": "AI \uba58\ud1a0",
  "Career Mode": "\ucee4\ub9ac\uc5b4 \ubaa8\ub4dc",
  "Career Timeline": "\ucee4\ub9ac\uc5b4 \ud0c0\uc784\ub77c\uc778",
  "Interview Mode": "\uba74\uc811 \ubaa8\ub4dc",
  "Release Notes": "\ub9b4\ub9ac\uc2a4 \ub178\ud2b8",
  "Backup": "\ubc31\uc5c5",
  "Backup and Restore": "\ubc31\uc5c5 \ubc0f \ubcf5\uc6d0",
  "SaaS Shell": "SaaS \uc178",
  "SaaS Dashboard": "SaaS \ub300\uc2dc\ubcf4\ub4dc",
  "Local Dashboard": "\ub85c\uceec \ub300\uc2dc\ubcf4\ub4dc",
  "Open Local Dashboard": "\ub85c\uceec \ub300\uc2dc\ubcf4\ub4dc \uc5f4\uae30",
  "Open SaaS Shell": "SaaS \uc178 \uc5f4\uae30",
  "GitHub": "GitHub",
  "Local-first developer logs": "\ub85c\uceec \uc6b0\uc120 \uac1c\ubc1c \ub85c\uadf8",
  "Turn coding sessions into career-ready proof.": "\ucf54\ub529 \uc138\uc158\uc744 \ucee4\ub9ac\uc5b4\uc5d0 \uc4f8 \uc218 \uc788\ub294 \uc99d\uac70\ub85c \ubc14\uafb8\uc138\uc694.",
  "Problem": "\ubb38\uc81c",
  "Solution": "\ud574\uacb0",
  "Features": "\uae30\ub2a5",
  "Screenshots": "\uc2a4\ud06c\ub9b0\uc0f7",
  "How It Works": "\uc791\ub3d9 \ubc29\uc2dd",
  "CTA": "\uc2dc\uc791\ud558\uae30",
  "Fast coding sessions are hard to explain later.": "\ube60\ub978 \ucf54\ub529 \uc138\uc158\uc740 \ub098\uc911\uc5d0 \uc124\uba85\ud558\uae30 \uc5b4\ub835\uc2b5\ub2c8\ub2e4.",
  "Capture the work locally, then turn it into useful narratives.": "\uc791\uc5c5\uc744 \ub85c\uceec\uc5d0 \uae30\ub85d\ud558\uace0 \uc720\uc6a9\ud55c \uc2a4\ud1a0\ub9ac\ub85c \ubc14\uafb8\uc138\uc694.",
  "From raw code changes to reusable career material.": "\ucf54\ub4dc \ubcc0\uacbd\uc744 \uc7ac\uc0ac\uc6a9 \uac00\ub2a5\ud55c \ucee4\ub9ac\uc5b4 \uc790\ub8cc\ub85c \ubc14\uafb8\uc138\uc694.",
  "Dashboard preview placeholder": "\ub300\uc2dc\ubcf4\ub4dc \ubbf8\ub9ac\ubcf4\uae30 \ud50c\ub808\uc774\uc2a4\ud640\ub354",
  "A simple loop for explainable development.": "\uc124\uba85 \uac00\ub2a5\ud55c \uac1c\ubc1c\uc744 \uc704\ud55c \ub2e8\uc21c\ud55c \ub8e8\ud504",
  "Start with your local history.": "\ub85c\uceec \ud788\uc2a4\ud1a0\ub9ac\ubd80\ud130 \uc2dc\uc791\ud558\uc138\uc694.",
  "Development history": "\uac1c\ubc1c \ud788\uc2a4\ud1a0\ub9ac",
  "Portfolio content": "\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \ucf58\ud150\uce20",
  "Interview preparation": "\uba74\uc811 \uc900\ube44",
  "Local exports": "\ub85c\uceec \ub0b4\ubcf4\ub0b4\uae30",
  "Build locally": "\ub85c\uceec\uc5d0\uc11c \ube4c\ub4dc",
  "Run vibelog end": "vibelog end \uc2e4\ud589",
  "Review the dashboard": "\ub300\uc2dc\ubcf4\ub4dc \uac80\ud1a0",
  "Use the story": "\uc2a4\ud1a0\ub9ac \ud65c\uc6a9",
  "Settings": "\uc124\uc815",
  "Compare": "\ube44\uad50",
  "Search": "\uac80\uc0c9",
  "Timeline": "\ud0c0\uc784\ub77c\uc778",
  "README Generator": "README \uc0dd\uc131\uae30",
  "Portfolio Generator": "\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uc0dd\uc131\uae30",
  "VibeLog Dashboard": "VibeLog \ub300\uc2dc\ubcf4\ub4dc",
  "Project Overview": "\ud504\ub85c\uc81d\ud2b8 \uac1c\uc694",
  "Session Search": "\uc138\uc158 \uac80\uc0c9",
  "Session Analysis": "\uc138\uc158 \ubd84\uc11d",
  "User Note": "\uc0ac\uc6a9\uc790 \uba54\ubaa8",
  "Changed Files": "\ubcc0\uacbd\ub41c \ud30c\uc77c",
  "Risks": "\ub9ac\uc2a4\ud06c",
  "Todos": "\ud560 \uc77c",
  "Commit Metadata": "\ucee4\ubc0b \uba54\ud0c0\ub370\uc774\ud130",
  "Portfolio Text": "\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \ubb38\uad6c",
  "Future Improvements": "\ud5a5\ud6c4 \uac1c\uc120",
  "AI Usage": "AI \uc0ac\uc6a9\ub7c9",
  "Git Status": "Git \uc0c1\ud0dc",
  "Git Diff": "Git Diff",
  "Markdown Preview": "\ub9c8\ud06c\ub2e4\uc6b4 \ubbf8\ub9ac\ubcf4\uae30",
  "Search sessions": "\uc138\uc158 \uac80\uc0c9",
  "Sort": "\uc815\ub82c",
  "Today": "\uc624\ub298",
  "This Week": "\uc774\ubc88 \uc8fc",
  "All": "\uc804\uccb4",
  "Tags": "\ud0dc\uadf8",
  "All tags": "\uc804\uccb4 \ud0dc\uadf8",
  "Created": "\uc0dd\uc131\uc77c",
  "Updated": "\uc5c5\ub370\uc774\ud2b8",
  "Changed files": "\ubcc0\uacbd\ub41c \ud30c\uc77c",
  "Total sessions": "\uc804\uccb4 \uc138\uc158",
  "Total changed files": "\uc804\uccb4 \ubcc0\uacbd \ud30c\uc77c",
  "Total token usage": "\uc804\uccb4 \ud1a0\ud070 \uc0ac\uc6a9\ub7c9",
  "Estimated total cost": "\uc608\uc0c1 \ucd1d \ube44\uc6a9",
  "Most active day": "\uac00\uc7a5 \ud65c\ubc1c\ud55c \ub0a0",
  "Top Tags": "\uc0c1\uc704 \ud0dc\uadf8",
  "Recent Activity": "\ucd5c\uadfc \ud65c\ub3d9",
  "AI Provider": "AI \uc81c\uacf5\uc790",
  "API Key Status": "API \ud0a4 \uc0c1\ud0dc",
  "Local Usage Summary": "\ub85c\uceec \uc0ac\uc6a9 \uc694\uc57d",
  "Token Usage Breakdown": "\ud1a0\ud070 \uc0ac\uc6a9\ub7c9 \uc0c1\uc138",
  "Provider status": "\uc81c\uacf5\uc790 \uc0c1\ud0dc",
  "Model": "\ubaa8\ub378",
  "Secret value": "\ube44\ubc00 \uac12",
  "Hidden": "\uc228\uae40",
  "Output Style": "\ucd9c\ub825 \uc2a4\ud0c0\uc77c",
  "Style": "\uc2a4\ud0c0\uc77c",
  "Generate": "\uc0dd\uc131",
  "Copy": "\ubcf5\uc0ac",
  "Copied": "\ubcf5\uc0ac\ub428",
  "Export Markdown": "\ub9c8\ud06c\ub2e4\uc6b4 \ub0b4\ubcf4\ub0b4\uae30",
  "Career Markdown Preview": "\ucee4\ub9ac\uc5b4 \ub9c8\ud06c\ub2e4\uc6b4 \ubbf8\ub9ac\ubcf4\uae30",
  "Career Timeline Preview": "\ucee4\ub9ac\uc5b4 \ud0c0\uc784\ub77c\uc778 \ubbf8\ub9ac\ubcf4\uae30",
  "Generate Career Timeline": "\ucee4\ub9ac\uc5b4 \ud0c0\uc784\ub77c\uc778 \uc0dd\uc131",
  "Group By": "\uadf8\ub8f9 \uae30\uc900",
  "Week": "\uc8fc",
  "Month": "\uc6d4",
  "Timeline View": "\ud0c0\uc784\ub77c\uc778 \ubcf4\uae30",
  "Skills Demonstrated": "\ubcf4\uc5ec\uc900 \uae30\uc220",
  "Technical Growth": "\uae30\uc220\uc801 \uc131\uc7a5",
  "Portfolio-ready Bullet Points": "\ud3ec\ud2b8\ud3f4\ub9ac\uc624\uc6a9 \ubd88\ub9bf",
  "Restore": "\ubcf5\uc6d0",
  "Backup JSON": "\ubc31\uc5c5 JSON",
  "Restore Backup": "\ubc31\uc5c5 \ubcf5\uc6d0",
  "Create Backup": "\ubc31\uc5c5 \uc0dd\uc131",
  "Backup Contents": "\ubc31\uc5c5 \ub0b4\uc6a9",
  "Included": "\ud3ec\ud568\ub41c \ud56d\ubaa9",
  "Not Included": "\ud3ec\ud568\ub418\uc9c0 \uc54a\uc740 \ud56d\ubaa9",
  "Login": "\ub85c\uadf8\uc778",
  "Sign Up": "\uac00\uc785",
  "Logout": "\ub85c\uadf8\uc544\uc6c3",
  "Create Account": "\uacc4\uc815 \ub9cc\ub4e4\uae30",
  "Authentication": "\uc778\uc99d",
  "Authenticated Dashboard": "\uc778\uc99d\ub41c \ub300\uc2dc\ubcf4\ub4dc",
  "Login required": "\ub85c\uadf8\uc778\uc774 \ud544\uc694\ud569\ub2c8\ub2e4",
  "Supabase is not configured": "Supabase\uac00 \uc124\uc815\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4",
  "Logged in": "\ub85c\uadf8\uc778\ub428",
  "Logged out": "\ub85c\uadf8\uc544\uc6c3\ub428",
  "Not configured": "\uc124\uc815\ub418\uc9c0 \uc54a\uc74c",
  "Not logged in": "\ub85c\uadf8\uc778\ub418\uc9c0 \uc54a\uc74c",
  "Email": "\uc774\uba54\uc77c",
  "Password": "\ube44\ubc00\ubc88\ud638",
  "Interview Set": "\uba74\uc811 \uc9c8\ubb38 \uc138\ud2b8",
  "Interview Prep V2": "\uba74\uc811 \uc900\ube44 V2",
  "Generate Interview Set": "\uba74\uc811 \uc9c8\ubb38 \uc138\ud2b8 \uc0dd\uc131",
  "Regenerate Questions": "\uc9c8\ubb38 \ub2e4\uc2dc \uc0dd\uc131",
  "Copy Answer": "\ub2f5\ubcc0 \ubcf5\uc0ac",
  "Interview Markdown Preview": "\uba74\uc811 \ub9c8\ud06c\ub2e4\uc6b4 \ubbf8\ub9ac\ubcf4\uae30",
  "Suggested Answer": "\ucd94\ucc9c \ub2f5\ubcc0",
  "Key Points": "\ud575\uc2ec \ud3ec\uc778\ud2b8",
  "Follow-up Questions": "\ud6c4\uc18d \uc9c8\ubb38",
  "Common Mistakes": "\ud53c\ud574\uc57c \ud560 \uc2e4\uc218",
  "My Answer": "\ub0b4 \ub2f5\ubcc0",
  "Evaluate My Answer": "\ub0b4 \ub2f5\ubcc0 \ud3c9\uac00",
  "Evaluation": "\ud3c9\uac00",
  "Strengths": "\uac15\uc810",
  "Improvements": "\uac1c\uc120\uc810",
  "Improved Answer Example": "\uac1c\uc120\ub41c \ub2f5\ubcc0 \uc608\uc2dc",
  "Project overview": "\ud504\ub85c\uc81d\ud2b8 \uac1c\uc694",
  "Architecture": "\uc544\ud0a4\ud14d\ucc98",
  "Technical decisions": "\uae30\uc220\uc801 \uacb0\uc815",
  "Tradeoffs": "\ud2b8\ub808\uc774\ub4dc\uc624\ud504",
  "Challenges": "\uc5b4\ub824\uc6c0",
  "Future improvements": "\ud5a5\ud6c4 \uac1c\uc120",
  "Release Notes Preview": "\ub9b4\ub9ac\uc2a4 \ub178\ud2b8 \ubbf8\ub9ac\ubcf4\uae30",
  "Generate Release Notes": "\ub9b4\ub9ac\uc2a4 \ub178\ud2b8 \uc0dd\uc131",
  "Mentor Report Preview": "\uba58\ud1a0 \ub9ac\ud3ec\ud2b8 \ubbf8\ub9ac\ubcf4\uae30",
  "Generate Mentor Report": "\uba58\ud1a0 \ub9ac\ud3ec\ud2b8 \uc0dd\uc131",
  "Project Diagnosis": "\ud504\ub85c\uc81d\ud2b8 \uc9c4\ub2e8",
  "Recommended Next Steps": "\ucd94\ucc9c \ub2e4\uc74c \ub2e8\uacc4",
  "Technical Debt": "\uae30\uc220 \ubd80\ucc44",
  "Portfolio Advice": "\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uc870\uc5b8",
  "Interview Advice": "\uba74\uc811 \uc870\uc5b8",
  "Language": "\uc5b8\uc5b4",
  "Appearance": "\ud654\uba74 \ud14c\ub9c8",
  "Theme": "\ud14c\ub9c8",
  "Light": "\ub77c\uc774\ud2b8",
  "Dark": "\ub2e4\ud06c",
  "System": "\uc2dc\uc2a4\ud15c",
  "Korean": "\ud55c\uad6d\uc5b4",
  "English": "English",
  "Question": "\uc9c8\ubb38",
  "Ask": "\uc9c8\ubb38\ud558\uae30",
  "Ask about development history": "\uac1c\ubc1c \ud788\uc2a4\ud1a0\ub9ac\uc5d0 \ub300\ud574 \uc9c8\ubb38\ud558\uae30",
  "No sessions found": "\uc138\uc158\uc774 \uc5c6\uc2b5\ub2c8\ub2e4",
  "Create your first local development log from the CLI, then refresh this dashboard.": "CLI\uc5d0\uc11c \uccab \ub85c\uceec \uac1c\ubc1c \ub85c\uadf8\ub97c \ub9cc\ub4e0 \ub4a4 \uc774 \ub300\uc2dc\ubcf4\ub4dc\ub97c \uc0c8\ub85c\uace0\uce68\ud558\uc138\uc694.",
  "Record a local session first, then return here to generate portfolio Markdown from real project history.": "\uba3c\uc800 \ub85c\uceec \uc138\uc158\uc744 \uae30\ub85d\ud55c \ub4a4 \uc5ec\uae30\ub85c \ub3cc\uc544\uc640 \uc2e4\uc81c \ud504\ub85c\uc81d\ud2b8 \ud788\uc2a4\ud1a0\ub9ac\ub85c \ud3ec\ud2b8\ud3f4\ub9ac\uc624 Markdown\uc744 \uc0dd\uc131\ud558\uc138\uc694.",
  "No session found": "\uc138\uc158\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4",
  "None": "\uc5c6\uc74c"
};

const PLACEHOLDER_TRANSLATIONS: Record<string, string> = {
  "Search feature, summary, note, portfolio text, or files":
    "\uae30\ub2a5, \uc694\uc57d, \uba54\ubaa8, \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \ubb38\uad6c, \ud30c\uc77c \uac80\uc0c9",
  "Ask about this project's sessions":
    "\uc774 \ud504\ub85c\uc81d\ud2b8 \uc138\uc158\uc5d0 \ub300\ud574 \uc9c8\ubb38\ud558\uae30",
  "Write your answer, then evaluate it":
    "\ub2f5\ubcc0\uc744 \uc791\uc131\ud55c \ub4a4 \ud3c9\uac00\ud558\uc138\uc694"
};

function normalizeTheme(value: unknown): AppTheme {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function translateText(value: string, language: AppLanguage): string {
  if (language === "ko") {
    return TRANSLATIONS[value] ?? value;
  }

  const entry = Object.entries(TRANSLATIONS).find(([, korean]) => korean === value);

  return entry?.[0] ?? value;
}

function translateDocument(language: AppLanguage): void {
  document.documentElement.lang = language === "ko" ? "ko" : "en";

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;

    if (
      !parent ||
      ["CODE", "PRE", "SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)
    ) {
      continue;
    }

    nodes.push(node);
  }

  for (const node of nodes) {
    const text = node.nodeValue ?? "";
    const trimmed = text.trim();

    if (!trimmed) {
      continue;
    }

    const translated = translateText(trimmed, language);

    if (translated !== trimmed) {
      node.nodeValue = text.replace(trimmed, translated);
    }
  }

  for (const input of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "input[placeholder], textarea[placeholder]"
  )) {
    const placeholder = input.placeholder.trim();
    const translated =
      language === "ko"
        ? PLACEHOLDER_TRANSLATIONS[placeholder]
        : Object.entries(PLACEHOLDER_TRANSLATIONS).find(
            ([, korean]) => korean === placeholder
          )?.[0];

    if (translated) {
      input.placeholder = translated;
    }
  }
}

export function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "system";
  }

  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

function resolveTheme(theme: AppTheme): "light" | "dark" {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: AppTheme): void {
  const resolvedTheme = resolveTheme(theme);

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function LanguageClient(): null {
  useEffect(() => {
    const apply = (): void => translateDocument(readStoredLanguage());
    const observer = new MutationObserver(apply);

    apply();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    window.addEventListener("vibelog-language-change", apply);

    return () => {
      observer.disconnect();
      window.removeEventListener("vibelog-language-change", apply);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (): void => applyTheme(readStoredTheme());

    apply();
    window.addEventListener("vibelog-theme-change", apply);
    mediaQuery.addEventListener("change", apply);

    return () => {
      window.removeEventListener("vibelog-theme-change", apply);
      mediaQuery.removeEventListener("change", apply);
    };
  }, []);

  return null;
}

export function LanguageSelector(): ReactElement {
  const [language, setLanguage] = useState<AppLanguage>("en");

  useEffect(() => {
    setLanguage(readStoredLanguage());
  }, []);

  function updateLanguage(nextLanguage: AppLanguage): void {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setLanguage(nextLanguage);
    window.dispatchEvent(new Event("vibelog-language-change"));
  }

  return (
    <label className="sort-field language-selector">
      <span>Language</span>
      <select
        className="select-control"
        onChange={(event) =>
          updateLanguage(normalizeLanguage(event.target.value))
        }
        value={language}
      >
        <option value="ko">{"\ud55c\uad6d\uc5b4"}</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

export function ThemeSelector(): ReactElement {
  const [theme, setTheme] = useState<AppTheme>("system");

  useEffect(() => {
    const storedTheme = readStoredTheme();
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  function updateTheme(nextTheme: AppTheme): void {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event("vibelog-theme-change"));
  }

  return (
    <label className="sort-field language-selector">
      <span>Theme</span>
      <select
        className="select-control"
        onChange={(event) => updateTheme(normalizeTheme(event.target.value))}
        value={theme}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
