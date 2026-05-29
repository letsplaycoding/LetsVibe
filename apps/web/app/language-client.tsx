"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  type AppLanguage
} from "../lib/language";

const TRANSLATIONS: Record<string, string> = {
  "Back to Dashboard": "대시보드로 돌아가기",
  Overview: "개요",
  Reports: "리포트",
  "Project Story": "프로젝트 스토리",
  "AI Chat": "AI 채팅",
  "Career Mode": "커리어 모드",
  "Interview Mode": "면접 모드",
  "Release Notes": "릴리스 노트",
  Settings: "설정",
  Compare: "비교",
  Search: "검색",
  Timeline: "타임라인",
  "README Generator": "README 생성기",
  "Portfolio Generator": "포트폴리오 생성기",
  "VibeLog Dashboard": "VibeLog 대시보드",
  "Project Overview": "프로젝트 개요",
  "Session Search": "세션 검색",
  "Session Analysis": "세션 분석",
  "User Note": "사용자 메모",
  "Changed Files": "변경된 파일",
  Risks: "리스크",
  Todos: "할 일",
  "Commit Metadata": "커밋 메타데이터",
  "Portfolio Text": "포트폴리오 문구",
  "Future Improvements": "향후 개선",
  "AI Usage": "AI 사용량",
  "Git Status": "Git 상태",
  "Git Diff": "Git Diff",
  "Markdown Preview": "마크다운 미리보기",
  "Search sessions": "세션 검색",
  Sort: "정렬",
  Today: "오늘",
  "This Week": "이번 주",
  All: "전체",
  Tags: "태그",
  "All tags": "전체 태그",
  Created: "생성일",
  Updated: "업데이트",
  "Changed files": "변경된 파일",
  "Total sessions": "전체 세션",
  "Total changed files": "전체 변경 파일",
  "Total token usage": "전체 토큰 사용량",
  "Estimated total cost": "예상 총 비용",
  "Most active day": "가장 활발한 날",
  "Top Tags": "상위 태그",
  "Recent Activity": "최근 활동",
  "AI Provider": "AI 제공자",
  "API Key Status": "API 키 상태",
  "Local Usage Summary": "로컬 사용 요약",
  "Token Usage Breakdown": "토큰 사용량 상세",
  "Provider status": "제공자 상태",
  Model: "모델",
  "Secret value": "비밀 값",
  Hidden: "숨김",
  "Output Style": "출력 스타일",
  Style: "스타일",
  Generate: "생성",
  Copy: "복사",
  Copied: "복사됨",
  "Export Markdown": "마크다운 내보내기",
  "Career Markdown Preview": "커리어 마크다운 미리보기",
  "Interview Set": "면접 질문 세트",
  "Generate Interview Set": "면접 질문 세트 생성",
  "Regenerate Questions": "질문 다시 생성",
  "Copy Answer": "답변 복사",
  "Interview Markdown Preview": "면접 마크다운 미리보기",
  "Release Notes Preview": "릴리스 노트 미리보기",
  "Generate Release Notes": "릴리스 노트 생성",
  "Language": "언어",
  "Korean": "한국어",
  "English": "English",
  "Question": "질문",
  "Ask": "질문하기",
  "Ask about development history": "개발 히스토리에 대해 질문하기",
  "No sessions found": "세션이 없습니다",
  "No session found": "세션을 찾을 수 없습니다",
  None: "없음"
};

const PLACEHOLDER_TRANSLATIONS: Record<string, string> = {
  "Search feature, summary, note, portfolio text, or files":
    "기능, 요약, 메모, 포트폴리오 문구, 파일 검색",
  "Ask about this project's sessions": "이 프로젝트 세션에 대해 질문하기"
};

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
        <option value="ko">한국어</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
