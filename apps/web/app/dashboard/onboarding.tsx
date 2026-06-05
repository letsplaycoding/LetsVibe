"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readStoredLanguage } from "../language-client";

type OnboardingProps = {
  projectId: string;
  sessionCount: number;
};

type OnboardingProgress = {
  viewedDashboard: boolean;
  generatedPortfolio: boolean;
  openedInterviewMode: boolean;
  dismissedWelcome: boolean;
};

const PROGRESS_KEY = "vibelog-onboarding-progress";
const FIRST_VISIT_KEY = "vibelog-onboarding-first-visit";

const DEFAULT_PROGRESS: OnboardingProgress = {
  viewedDashboard: false,
  generatedPortfolio: false,
  openedInterviewMode: false,
  dismissedWelcome: false
};

function readProgress(): OnboardingProgress {
  try {
    const storedValue = window.localStorage.getItem(PROGRESS_KEY);

    if (!storedValue) {
      return DEFAULT_PROGRESS;
    }

    return {
      ...DEFAULT_PROGRESS,
      ...(JSON.parse(storedValue) as Partial<OnboardingProgress>)
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(progress: OnboardingProgress): void {
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function useKorean(): boolean {
  const [isKorean, setIsKorean] = useState(false);

  useEffect(() => {
    const update = (): void => setIsKorean(readStoredLanguage() === "ko");

    update();
    window.addEventListener("vibelog-language-change", update);

    return () => window.removeEventListener("vibelog-language-change", update);
  }, []);

  return isKorean;
}

export function Onboarding({ projectId, sessionCount }: OnboardingProps) {
  const isKorean = useKorean();
  const [progress, setProgress] = useState<OnboardingProgress>(DEFAULT_PROGRESS);
  const [showWelcome, setShowWelcome] = useState(false);
  const hasSession = sessionCount > 0;
  const dashboardHref = `/dashboard/project/${projectId}`;
  const portfolioHref = `/dashboard/portfolio?project=${encodeURIComponent(projectId)}`;
  const interviewHref = `/dashboard/project/${projectId}/interview`;

  useEffect(() => {
    const currentProgress = {
      ...readProgress(),
      viewedDashboard: true
    };
    const hasVisited = window.localStorage.getItem(FIRST_VISIT_KEY) === "true";

    saveProgress(currentProgress);
    window.localStorage.setItem(FIRST_VISIT_KEY, "true");
    setProgress(currentProgress);
    setShowWelcome(!hasVisited && !currentProgress.dismissedWelcome);

    const updateProgress = (): void => setProgress(readProgress());

    window.addEventListener("vibelog-onboarding-update", updateProgress);

    return () =>
      window.removeEventListener("vibelog-onboarding-update", updateProgress);
  }, []);

  const checklist = useMemo(
    () => [
      {
        done: hasSession,
        label: isKorean ? "첫 세션 만들기" : "Created first session",
        detail: isKorean
          ? "CLI에서 `npm run dev -- end`를 실행해 Git 변경사항을 기록하세요."
          : "Run `npm run dev -- end` in the CLI to record Git changes."
      },
      {
        done: progress.viewedDashboard,
        label: isKorean ? "대시보드 보기" : "Viewed dashboard",
        detail: isKorean
          ? "로컬 세션을 확인하고 주요 도구로 이동하세요."
          : "Review local sessions and open the main tools."
      },
      {
        done: progress.generatedPortfolio,
        label: isKorean ? "포트폴리오 생성하기" : "Generated portfolio",
        detail: isKorean
          ? "세션을 선택해 포트폴리오 Markdown을 만들어보세요."
          : "Select sessions and generate portfolio Markdown."
      },
      {
        done: progress.openedInterviewMode,
        label: isKorean ? "면접 모드 열기" : "Opened interview mode",
        detail: isKorean
          ? "프로젝트 히스토리 기반 면접 질문과 답변을 확인하세요."
          : "Practice questions and answers from project history."
      }
    ],
    [hasSession, isKorean, progress]
  );
  const completedCount = checklist.filter((item) => item.done).length;

  function dismissWelcome(): void {
    const nextProgress = {
      ...progress,
      dismissedWelcome: true
    };

    saveProgress(nextProgress);
    setProgress(nextProgress);
    setShowWelcome(false);
  }

  return (
    <>
      {showWelcome ? (
        <div className="onboarding-modal" role="dialog" aria-modal="true">
          <div className="onboarding-modal-card">
            <p className="eyebrow">
              {isKorean ? "환영합니다" : "Welcome"}
            </p>
            <h2>
              {isKorean
                ? "VibeLog를 시작해볼까요?"
                : "Start turning sessions into proof."}
            </h2>
            <p>
              {isKorean
                ? "VibeLog는 로컬 Git 변경사항을 개발 히스토리, 포트폴리오 문구, 면접 준비 자료로 바꿔줍니다."
                : "VibeLog turns local Git changes into development history, portfolio writing, and interview preparation."}
            </p>
            <div className="portfolio-actions">
              <button className="button" onClick={dismissWelcome} type="button">
                {isKorean ? "시작하기" : "Get Started"}
              </button>
              <button
                className="button secondary"
                onClick={dismissWelcome}
                type="button"
              >
                {isKorean ? "닫기" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="onboarding-card" aria-label="Getting started">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              {isKorean ? "빠른 시작" : "Quick Start"}
            </p>
            <h2>
              {isKorean
                ? "첫 세션에서 커리어 자료까지"
                : "From first session to career material"}
            </h2>
          </div>
          <span className="tag-pill">
            {completedCount}/{checklist.length}
          </span>
        </div>

        <div className="onboarding-layout">
          <div>
            <h3>{isKorean ? "샘플 워크플로" : "Sample workflow"}</h3>
            <ol className="onboarding-steps">
              <li>{isKorean ? "기능을 구현합니다." : "Build a feature."}</li>
              <li>
                {isKorean
                  ? "`vibelog end`로 세션을 저장합니다."
                  : "Run `vibelog end` to save a session."}
              </li>
              <li>
                {isKorean
                  ? "대시보드에서 변경 이력을 검토합니다."
                  : "Review the work in the dashboard."}
              </li>
              <li>
                {isKorean
                  ? "포트폴리오와 면접 자료를 생성합니다."
                  : "Generate portfolio and interview material."}
              </li>
            </ol>
            <div className="portfolio-actions">
              <Link className="button secondary" href={dashboardHref}>
                {isKorean ? "대시보드" : "Dashboard"}
              </Link>
              <Link className="button secondary" href={portfolioHref}>
                {isKorean ? "포트폴리오" : "Portfolio"}
              </Link>
              <Link className="button secondary" href={interviewHref}>
                {isKorean ? "면접 모드" : "Interview Mode"}
              </Link>
            </div>
          </div>

          <div>
            <h3>{isKorean ? "시작 체크리스트" : "Getting Started checklist"}</h3>
            <div className="onboarding-checklist">
              {checklist.map((item) => (
                <div
                  className={`onboarding-check ${item.done ? "complete" : ""}`}
                  key={item.label}
                >
                  <span aria-hidden="true">{item.done ? "OK" : ""}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function markOnboardingStep(step: keyof OnboardingProgress): void {
  if (typeof window === "undefined") {
    return;
  }

  const progress = readProgress();
  const nextProgress = {
    ...progress,
    [step]: true
  };

  saveProgress(nextProgress);
  window.dispatchEvent(new Event("vibelog-onboarding-update"));
}

export function OnboardingMarker({
  step
}: {
  step: keyof OnboardingProgress;
}) {
  useEffect(() => {
    markOnboardingStep(step);
  }, [step]);

  return null;
}
