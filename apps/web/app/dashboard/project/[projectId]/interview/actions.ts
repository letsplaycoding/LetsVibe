"use server";

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getCurrentProjectDir,
  getSearchSessions,
  resolveProject,
  type SearchSession
} from "../../../../../lib/sessions";

export type InterviewCategory =
  | "General project"
  | "Technical design"
  | "Architecture"
  | "Tradeoff"
  | "Future improvement";

export type InterviewQuestion = {
  answer: string;
  category: InterviewCategory;
  question: string;
};

type InterviewResult = {
  markdown: string;
  provider: "openai" | "mock";
  questions: InterviewQuestion[];
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getRepositoryRoot(): string {
  return join(process.cwd(), "..", "..");
}

function readEnvValue(key: string): string | null {
  const envValue = process.env[key]?.trim();

  if (envValue) {
    return envValue;
  }

  const envPath = join(getRepositoryRoot(), ".env");

  if (!existsSync(envPath)) {
    return null;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (name === key && value) {
      return value;
    }
  }

  return null;
}

function createExportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function formatQuestionMarkdown(question: InterviewQuestion): string {
  return [
    `### ${question.category}`,
    "",
    `**Q: ${question.question}**`,
    "",
    question.answer,
    ""
  ].join("\n");
}

function buildMarkdown(
  projectName: string,
  questions: InterviewQuestion[]
): string {
  return [
    `# ${projectName} Interview Set`,
    "",
    ...questions.map(formatQuestionMarkdown)
  ].join("\n");
}

function buildMockQuestions(
  projectName: string,
  sessions: SearchSession[]
): InterviewQuestion[] {
  const totalChangedFiles = sessions.reduce(
    (total, session) => total + session.changedFilesCount,
    0
  );
  const tags = uniqueValues(sessions.flatMap((session) => session.tags));
  const largestSession = [...sessions].sort(
    (a, b) => b.changedFilesCount - a.changedFilesCount
  )[0];
  const recentFeatures = sessions
    .slice(0, 5)
    .map((session) => session.featureName)
    .join(", ");

  if (sessions.length === 0) {
    return [
      {
        category: "General project",
        question: "What is this project about?",
        answer:
          "There are no local sessions for this project yet. I would first record development sessions with VibeLog, then use those sessions to explain the project accurately."
      },
      {
        category: "Future improvement",
        question: "What would you improve next?",
        answer:
          "The next step is to capture real project sessions so future answers can reference actual implementation history."
      }
    ];
  }

  return [
    {
      category: "General project",
      question: `How would you explain ${projectName} at a high level?`,
      answer: `${projectName} is a local-first developer history tool built across ${sessions.length} recorded sessions. It converts Git activity, notes, risks, todos, and AI/mock analysis into explainable development history and career-ready artifacts.`
    },
    {
      category: "Technical design",
      question: "What were your main technical contributions?",
      answer: `I built project-scoped workflows around local JSON and Markdown files, including session views, search, timeline, compare, reports, story generation, chat, and career summaries. The sessions represent ${totalChangedFiles} changed files across the recorded project history.`
    },
    {
      category: "Architecture",
      question: "How is the system architected?",
      answer:
        "The CLI captures Git data and writes local session artifacts. The Next.js App Router dashboard reads those files server-side and renders project-aware views. The architecture avoids a database, auth, and cloud sync, keeping the filesystem as the source of truth."
    },
    {
      category: "Tradeoff",
      question: "What tradeoffs did you make by keeping it local-first?",
      answer:
        "The local-first approach keeps setup simple and avoids sensitive data leaving the machine by default. The tradeoff is that project data is tied to local files, so collaboration and remote sync are intentionally out of scope for now."
    },
    {
      category: "Future improvement",
      question: "What would you improve next?",
      answer: `I would improve richer project switching, stronger export templates, and deeper project insights. The most active themes so far are ${tags.length > 0 ? tags.join(", ") : "not tagged yet"}.`
    },
    {
      category: "Technical design",
      question: "Which session had the largest implementation scope?",
      answer: largestSession
        ? `${largestSession.featureName} changed ${largestSession.changedFilesCount} files, making it the largest recorded session by changed-file count.`
        : "No large session is available yet."
    },
    {
      category: "General project",
      question: "What recent features should you mention?",
      answer: recentFeatures
        ? `Recent features include ${recentFeatures}.`
        : "No recent features are recorded yet."
    }
  ];
}

function parseOpenAIQuestions(
  value: string,
  projectName: string,
  sessions: SearchSession[]
): InterviewQuestion[] {
  try {
    const parsed = JSON.parse(value) as { questions?: InterviewQuestion[] };
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const normalized = questions
      .map((question) => ({
        answer: String(question.answer ?? "").trim(),
        category: question.category,
        question: String(question.question ?? "").trim()
      }))
      .filter(
        (question) =>
          question.answer &&
          question.question &&
          [
            "General project",
            "Technical design",
            "Architecture",
            "Tradeoff",
            "Future improvement"
          ].includes(question.category)
      );

    return normalized.length > 0
      ? normalized
      : buildMockQuestions(projectName, sessions);
  } catch {
    return buildMockQuestions(projectName, sessions);
  }
}

function buildPrompt(projectName: string, sessions: SearchSession[]): string {
  const compactSessions = sessions.map((session) => ({
    createdAt: session.createdAt,
    feature_name: session.featureName,
    summary: session.summary,
    user_note: session.userNote,
    changed_files_count: session.changedFilesCount,
    changed_files: session.changedFiles,
    tags: session.tags,
    risks: session.risks,
    todos: session.todos,
    portfolio_text: session.portfolioText,
    future_improvements: session.futureImprovements
  }));

  return [
    `Generate an interview preparation set for ${projectName}.`,
    "Use only the local VibeLog session data below.",
    "Return only valid JSON in this shape:",
    '{"questions":[{"category":"General project","question":"...","answer":"..."}]}',
    "Include questions across these categories: General project, Technical design, Architecture, Tradeoff, Future improvement.",
    "Answers must be grounded in actual project history. Say when evidence is limited.",
    "Do not invent database, auth, cloud sync, payments, or hosted backend details.",
    "",
    "Sessions JSON:",
    JSON.stringify(compactSessions).slice(0, 24000)
  ].join("\n");
}

async function generateWithOpenAI(
  apiKey: string,
  projectName: string,
  sessions: SearchSession[]
): Promise<InterviewQuestion[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You create interview preparation questions and answers from local development session data only."
        },
        {
          role: "user",
          content: buildPrompt(projectName, sessions)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI interview request failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI interview response was empty.");
  }

  return parseOpenAIQuestions(content, projectName, sessions);
}

export async function generateInterviewSet(
  projectId: string
): Promise<InterviewResult> {
  const project = resolveProject(projectId);
  const sessions = getSearchSessions(project.projectId);
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    const questions = buildMockQuestions(project.projectName, sessions);

    return {
      markdown: buildMarkdown(project.projectName, questions),
      provider: "mock",
      questions
    };
  }

  try {
    const questions = await generateWithOpenAI(
      apiKey,
      project.projectName,
      sessions
    );

    return {
      markdown: buildMarkdown(project.projectName, questions),
      provider: "openai",
      questions
    };
  } catch {
    const questions = buildMockQuestions(project.projectName, sessions);

    return {
      markdown: buildMarkdown(project.projectName, questions),
      provider: "mock",
      questions
    };
  }
}

export async function exportInterviewMarkdown(
  projectId: string,
  markdown: string
): Promise<string> {
  const project = resolveProject(projectId);
  const interviewDir = join(
    getCurrentProjectDir(project.projectId),
    "interview"
  );
  await mkdir(interviewDir, { recursive: true });

  const filePath = join(
    interviewDir,
    `interview-${createExportId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
