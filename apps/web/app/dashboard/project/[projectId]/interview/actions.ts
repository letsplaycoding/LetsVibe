"use server";

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getLanguageInstruction,
  normalizeLanguage,
  type AppLanguage
} from "../../../../../lib/language";
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
  sessions: SearchSession[],
  language: AppLanguage = "en"
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
    if (language === "ko") {
      return [
        {
          category: "General project",
          question: "이 프로젝트는 무엇인가요?",
          answer:
            "아직 이 프로젝트의 로컬 세션이 없습니다. 먼저 VibeLog로 개발 세션을 기록한 뒤, 실제 구현 히스토리를 근거로 프로젝트를 설명할 수 있습니다."
        },
        {
          category: "Future improvement",
          question: "다음으로 무엇을 개선하겠습니까?",
          answer:
            "다음 단계는 실제 프로젝트 세션을 기록해서 이후 답변이 구체적인 구현 히스토리를 참조할 수 있게 만드는 것입니다."
        }
      ];
    }

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

  if (language === "ko") {
    return [
      {
        category: "General project",
        question: `${projectName}를 높은 수준에서 어떻게 설명하시겠습니까?`,
        answer: `${projectName}는 ${sessions.length}개의 기록된 세션을 통해 구축된 로컬 우선 개발 히스토리 도구입니다. Git 활동, 메모, 리스크, 할 일, AI/mock 분석을 설명 가능한 개발 히스토리와 커리어용 산출물로 변환합니다.`
      },
      {
        category: "Technical design",
        question: "주요 기술적 기여는 무엇이었나요?",
        answer: `로컬 JSON과 Markdown 파일을 중심으로 프로젝트별 워크플로를 구축했고, 세션 뷰, 검색, 타임라인, 비교, 리포트, 스토리 생성, 채팅, 커리어 요약을 추가했습니다. 기록된 히스토리는 총 ${totalChangedFiles}개의 변경 파일을 포함합니다.`
      },
      {
        category: "Architecture",
        question: "시스템 아키텍처는 어떻게 구성되어 있나요?",
        answer:
          "CLI가 Git 데이터를 수집하고 로컬 세션 산출물을 기록합니다. Next.js App Router 대시보드는 해당 파일을 서버에서 읽어 프로젝트별 뷰를 렌더링합니다. 데이터베이스, 인증, 클라우드 동기화 없이 파일시스템을 기준으로 동작합니다."
      },
      {
        category: "Tradeoff",
        question: "로컬 우선 접근의 트레이드오프는 무엇인가요?",
        answer:
          "로컬 우선 접근은 설정을 단순하게 만들고 민감한 데이터가 기본적으로 로컬에 남게 합니다. 대신 협업과 원격 동기화는 현재 범위 밖이며, 프로젝트 데이터가 로컬 파일에 묶입니다."
      },
      {
        category: "Future improvement",
        question: "다음에는 무엇을 개선하시겠습니까?",
        answer: `더 풍부한 프로젝트 전환, 강화된 export 템플릿, 깊은 프로젝트 인사이트를 개선하고 싶습니다. 현재 주요 주제는 ${tags.length > 0 ? tags.join(", ") : "아직 태그 없음"}입니다.`
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

function buildPrompt(
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage
): string {
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
    getLanguageInstruction(language),
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
  sessions: SearchSession[],
  language: AppLanguage
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
          content: [
            "You create interview preparation questions and answers from local development session data only.",
            getLanguageInstruction(language)
          ].join(" ")
        },
        {
          role: "user",
          content: buildPrompt(projectName, sessions, language)
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
  projectId: string,
  languageInput: string = "en"
): Promise<InterviewResult> {
  const project = resolveProject(projectId);
  const language = normalizeLanguage(languageInput);
  const sessions = getSearchSessions(project.projectId);
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    const questions = buildMockQuestions(project.projectName, sessions, language);

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
      sessions,
      language
    );

    return {
      markdown: buildMarkdown(project.projectName, questions),
      provider: "openai",
      questions
    };
  } catch {
    const questions = buildMockQuestions(project.projectName, sessions, language);

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
