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
  | "Project overview"
  | "Architecture"
  | "Technical decisions"
  | "Tradeoffs"
  | "Challenges"
  | "Future improvements";

export type InterviewQuestion = {
  category: InterviewCategory;
  question: string;
  suggestedAnswer: string;
  followUpQuestions: string[];
  keyPoints: string[];
  commonMistakes: string[];
};

export type InterviewEvaluation = {
  score: number;
  strengths: string[];
  improvements: string[];
  improvedAnswerExample: string;
  provider: "openai" | "mock";
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

const CATEGORIES: InterviewCategory[] = [
  "Project overview",
  "Architecture",
  "Technical decisions",
  "Tradeoffs",
  "Challenges",
  "Future improvements"
];

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

function formatList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function formatQuestionMarkdown(question: InterviewQuestion): string {
  return [
    `## ${question.category}`,
    "",
    `### Question`,
    question.question,
    "",
    "### Suggested Answer",
    question.suggestedAnswer,
    "",
    "### Follow-up Questions",
    formatList(question.followUpQuestions),
    "",
    "### Key Points to Mention",
    formatList(question.keyPoints),
    "",
    "### Common Mistakes to Avoid",
    formatList(question.commonMistakes),
    ""
  ].join("\n");
}

function buildMarkdown(
  projectName: string,
  questions: InterviewQuestion[]
): string {
  return [
    `# ${projectName} Interview Prep`,
    "",
    ...questions.map(formatQuestionMarkdown)
  ].join("\n");
}

function summarizeSessions(sessions: SearchSession[]): {
  totalChangedFiles: number;
  tags: string[];
  largestSession: SearchSession | undefined;
  recentFeatures: string;
} {
  return {
    totalChangedFiles: sessions.reduce(
      (total, session) => total + session.changedFilesCount,
      0
    ),
    tags: uniqueValues(sessions.flatMap((session) => session.tags)),
    largestSession: [...sessions].sort(
      (a, b) => b.changedFilesCount - a.changedFilesCount
    )[0],
    recentFeatures: sessions
      .slice(0, 5)
      .map((session) => session.featureName)
      .join(", ")
  };
}

function buildMockQuestions(
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage
): InterviewQuestion[] {
  const { totalChangedFiles, tags, largestSession, recentFeatures } =
    summarizeSessions(sessions);

  if (language === "ko") {
    return CATEGORIES.map((category) => ({
      category,
      question:
        category === "Project overview"
          ? `${projectName}를 면접에서 어떻게 소개하시겠습니까?`
          : `${category} 관점에서 ${projectName}를 어떻게 설명하시겠습니까?`,
      suggestedAnswer:
        sessions.length === 0
          ? "아직 기록된 로컬 세션이 없습니다. 먼저 vibelog end로 개발 세션을 저장한 뒤 실제 히스토리를 근거로 답변하는 것이 좋습니다."
          : `${projectName}는 ${sessions.length}개의 로컬 세션과 ${totalChangedFiles}개의 변경 파일을 바탕으로 발전한 로컬 우선 개발 히스토리 도구입니다. CLI가 Git 변경사항을 수집하고, Next.js 대시보드가 세션 검색, 타임라인, 리포트, 커리어 자료 생성을 제공합니다.`,
      followUpQuestions: [
        "이 설계를 선택한 이유는 무엇인가요?",
        "가장 어려웠던 구현 부분은 무엇이었나요?",
        "다음 단계에서 무엇을 개선하시겠습니까?"
      ],
      keyPoints: [
        "로컬 우선 아키텍처",
        "Git diff/status 기반 세션 수집",
        `최근 기능: ${recentFeatures || "기록된 기능 없음"}`,
        `주요 태그: ${tags.length > 0 ? tags.join(", ") : "기록 없음"}`
      ],
      commonMistakes: [
        "실제 세션 데이터에 없는 기능을 과장하기",
        "기술 선택의 이유를 설명하지 않기",
        "구체적인 파일/세션 근거 없이 일반론만 말하기"
      ]
    }));
  }

  return CATEGORIES.map((category) => ({
    category,
    question:
      category === "Project overview"
        ? `How would you introduce ${projectName} in an interview?`
        : `How would you explain ${projectName} from a ${category.toLowerCase()} perspective?`,
    suggestedAnswer:
      sessions.length === 0
        ? "There are no local sessions yet. I would first record sessions with vibelog end, then answer from actual implementation history."
        : `${projectName} is a local-first developer history tool built across ${sessions.length} recorded sessions and ${totalChangedFiles} changed files. The CLI captures Git changes, while the Next.js dashboard turns those sessions into searchable history, timelines, reports, and career-ready artifacts.`,
    followUpQuestions: [
      "Why did you choose this design?",
      "What was the hardest implementation detail?",
      "What would you improve next?"
    ],
    keyPoints: [
      "Local-first architecture",
      "Git diff/status based session capture",
      `Recent features: ${recentFeatures || "none recorded"}`,
      `Largest session: ${
        largestSession
          ? `${largestSession.featureName} (${largestSession.changedFilesCount} files)`
          : "none recorded"
      }`,
      `Tags: ${tags.length > 0 ? tags.join(", ") : "none recorded"}`
    ],
    commonMistakes: [
      "Inventing features not supported by session history",
      "Skipping why the technical choices were made",
      "Giving generic answers without project-specific evidence"
    ]
  }));
}

function normalizeQuestion(value: unknown): InterviewQuestion | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const category = String(record.category ?? "") as InterviewCategory;

  if (!CATEGORIES.includes(category)) {
    return null;
  }

  const question: InterviewQuestion = {
    category,
    question: String(record.question ?? "").trim(),
    suggestedAnswer: String(record.suggestedAnswer ?? record.answer ?? "").trim(),
    followUpQuestions: Array.isArray(record.followUpQuestions)
      ? record.followUpQuestions.map(String)
      : [],
    keyPoints: Array.isArray(record.keyPoints) ? record.keyPoints.map(String) : [],
    commonMistakes: Array.isArray(record.commonMistakes)
      ? record.commonMistakes.map(String)
      : []
  };

  return question.question && question.suggestedAnswer ? question : null;
}

function parseOpenAIQuestions(
  value: string,
  projectName: string,
  sessions: SearchSession[],
  language: AppLanguage
): InterviewQuestion[] {
  try {
    const parsed = JSON.parse(value) as { questions?: unknown[] };
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map(normalizeQuestion).filter(Boolean)
      : [];

    return questions.length > 0
      ? (questions as InterviewQuestion[])
      : buildMockQuestions(projectName, sessions, language);
  } catch {
    return buildMockQuestions(projectName, sessions, language);
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
    `Generate an interactive interview preparation set for ${projectName}.`,
    getLanguageInstruction(language),
    "Use only the local VibeLog session data below.",
    "Return only valid JSON with this exact top-level shape:",
    '{"questions":[{"category":"Project overview","question":"...","suggestedAnswer":"...","followUpQuestions":["..."],"keyPoints":["..."],"commonMistakes":["..."]}]}',
    `Categories must be exactly: ${CATEGORIES.join(", ")}.`,
    "Generate one strong question per category.",
    "Suggested answers must be grounded in actual project history. Say when evidence is limited.",
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

  return parseOpenAIQuestions(content, projectName, sessions, language);
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

function buildEvaluationPrompt(
  question: InterviewQuestion,
  answer: string,
  sessions: SearchSession[],
  language: AppLanguage
): string {
  const compactSessions = sessions.slice(0, 12).map((session) => ({
    feature_name: session.featureName,
    summary: session.summary,
    changed_files_count: session.changedFilesCount,
    tags: session.tags,
    portfolio_text: session.portfolioText
  }));

  return [
    "Evaluate the user's interview answer for a project-history interview.",
    getLanguageInstruction(language),
    "Use these criteria: clarity, technical depth, project-specific evidence, structure, interview readiness.",
    "Return only valid JSON in this shape:",
    '{"score":7,"strengths":["..."],"improvements":["..."],"improvedAnswerExample":"..."}',
    "Score must be an integer from 1 to 10.",
    "",
    `Question: ${question.question}`,
    "",
    `Suggested answer context: ${question.suggestedAnswer}`,
    "",
    `User answer: ${answer}`,
    "",
    "Sessions JSON:",
    JSON.stringify(compactSessions).slice(0, 16000)
  ].join("\n");
}

function buildMockEvaluation(
  answer: string,
  question: InterviewQuestion,
  language: AppLanguage
): InterviewEvaluation {
  const trimmedAnswer = answer.trim();
  const score = Math.max(
    4,
    Math.min(8, Math.round(trimmedAnswer.length / 120) + 4)
  );

  if (language === "ko") {
    return {
      score,
      strengths:
        trimmedAnswer.length > 0
          ? ["답변이 질문에 직접적으로 대응합니다.", "프로젝트 맥락을 설명하려는 방향이 있습니다."]
          : ["평가할 답변이 아직 충분하지 않습니다."],
      improvements: [
        "구체적인 세션, 기능, 변경 파일 근거를 더 넣어보세요.",
        "문제, 선택한 접근, 결과 순서로 구조화하면 더 좋습니다.",
        "기술적 트레이드오프를 한 문장으로 명확히 말해보세요."
      ],
      improvedAnswerExample: `${question.suggestedAnswer} 면접에서는 여기에 실제로 구현한 세션이나 파일 예시를 하나 덧붙여 근거를 강화하겠습니다.`,
      provider: "mock"
    };
  }

  return {
    score,
    strengths:
      trimmedAnswer.length > 0
        ? ["The answer addresses the question directly.", "It starts to connect the response to project context."]
        : ["There is not enough answer content to evaluate deeply yet."],
    improvements: [
      "Add concrete session, feature, or changed-file evidence.",
      "Structure the answer as problem, decision, implementation, and result.",
      "State the technical tradeoff more explicitly."
    ],
    improvedAnswerExample: `${question.suggestedAnswer} In an interview, I would add one concrete session or file example to make the evidence stronger.`,
    provider: "mock"
  };
}

function parseEvaluation(
  value: string,
  fallback: InterviewEvaluation
): InterviewEvaluation {
  try {
    const parsed = JSON.parse(value) as Partial<InterviewEvaluation>;

    return {
      score: Math.max(1, Math.min(10, Number(parsed.score ?? fallback.score))),
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.map(String)
        : fallback.strengths,
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.map(String)
        : fallback.improvements,
      improvedAnswerExample: String(
        parsed.improvedAnswerExample ?? fallback.improvedAnswerExample
      ),
      provider: "openai"
    };
  } catch {
    return fallback;
  }
}

async function evaluateWithOpenAI(
  apiKey: string,
  question: InterviewQuestion,
  answer: string,
  sessions: SearchSession[],
  language: AppLanguage
): Promise<InterviewEvaluation> {
  const fallback = buildMockEvaluation(answer, question, language);
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
            "You evaluate interview answers against local project history.",
            getLanguageInstruction(language)
          ].join(" ")
        },
        {
          role: "user",
          content: buildEvaluationPrompt(question, answer, sessions, language)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI interview evaluation failed.");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI interview evaluation response was empty.");
  }

  return parseEvaluation(content, fallback);
}

export async function evaluateInterviewAnswer(
  projectId: string,
  question: InterviewQuestion,
  answer: string,
  languageInput: string = "en"
): Promise<InterviewEvaluation> {
  const project = resolveProject(projectId);
  const language = normalizeLanguage(languageInput);
  const normalizedAnswer = answer.trim().slice(0, 4000);
  const sessions = getSearchSessions(project.projectId);
  const apiKey = readEnvValue("OPENAI_API_KEY");

  if (!normalizedAnswer) {
    return buildMockEvaluation("", question, language);
  }

  if (!apiKey) {
    return buildMockEvaluation(normalizedAnswer, question, language);
  }

  try {
    return await evaluateWithOpenAI(
      apiKey,
      question,
      normalizedAnswer,
      sessions,
      language
    );
  } catch {
    return buildMockEvaluation(normalizedAnswer, question, language);
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
    `interview-v2-${createExportId(new Date())}.md`
  );
  await writeFile(filePath, `${markdown.trimEnd()}\n`, "utf8");

  return filePath;
}
