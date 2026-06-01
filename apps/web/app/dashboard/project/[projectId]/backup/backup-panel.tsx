"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { readStoredLanguage } from "../../../../../app/language-client";
import {
  createProjectBackup,
  restoreProjectBackup
} from "./actions";

type BackupPanelProps = {
  projectId: string;
  sessionCount: number;
};

function getMessage(
  language: "en" | "ko",
  english: string,
  korean: string
): string {
  return language === "ko" ? korean : english;
}

export function BackupPanel({ projectId, sessionCount }: BackupPanelProps) {
  const [backupMessage, setBackupMessage] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [backupJson, setBackupJson] = useState("");
  const [isBackingUp, startBackupTransition] = useTransition();
  const [isRestoring, startRestoreTransition] = useTransition();

  function createBackup(): void {
    setBackupMessage("");
    setRestoreMessage("");
    setErrorMessage("");

    startBackupTransition(async () => {
      try {
        const filePath = await createProjectBackup(projectId);
        const language = readStoredLanguage();
        setBackupMessage(
          getMessage(
            language,
            `Backup saved to ${filePath}`,
            `백업을 저장했습니다: ${filePath}`
          )
        );
      } catch (error) {
        const language = readStoredLanguage();
        setErrorMessage(
          getMessage(
            language,
            error instanceof Error ? error.message : "Backup failed.",
            error instanceof Error ? error.message : "백업에 실패했습니다."
          )
        );
      }
    });
  }

  async function readBackupFile(
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    setBackupMessage("");
    setRestoreMessage("");
    setErrorMessage("");

    const file = event.target.files?.[0];

    if (!file) {
      setBackupJson("");
      return;
    }

    setBackupJson(await file.text());
  }

  function restoreBackup(): void {
    setBackupMessage("");
    setRestoreMessage("");
    setErrorMessage("");

    if (!backupJson.trim()) {
      const language = readStoredLanguage();
      setErrorMessage(
        getMessage(
          language,
          "Choose a backup JSON file first.",
          "먼저 백업 JSON 파일을 선택하세요."
        )
      );
      return;
    }

    startRestoreTransition(async () => {
      try {
        const result = await restoreProjectBackup(projectId, backupJson);
        const language = readStoredLanguage();
        setRestoreMessage(
          getMessage(
            language,
            `Restored ${result.restoredSessions} sessions into ${result.projectName}.`,
            `${result.projectName}에 세션 ${result.restoredSessions}개를 복원했습니다.`
          )
        );
      } catch (error) {
        const language = readStoredLanguage();
        setErrorMessage(
          getMessage(
            language,
            error instanceof Error ? error.message : "Restore failed.",
            error instanceof Error ? error.message : "복원에 실패했습니다."
          )
        );
      }
    });
  }

  return (
    <section className="portfolio-layout" aria-label="Project backup and restore">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Backup</h2>
          <span className="tag-pill">local</span>
        </div>
        <p className="preview-placeholder">
          Export this project's local sessions and file metadata to a backup JSON
          file. This prepares the data shape for future sync without adding cloud
          services.
        </p>

        <dl className="usage-grid two-column compact-stats">
          <div>
            <dt>Project</dt>
            <dd>{projectId}</dd>
          </div>
          <div>
            <dt>Sessions</dt>
            <dd>{sessionCount}</dd>
          </div>
        </dl>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isBackingUp}
            onClick={createBackup}
            type="button"
          >
            {isBackingUp ? "Creating Backup..." : "Create Backup"}
          </button>
        </div>

        {backupMessage ? (
          <p className="success-message">{backupMessage}</p>
        ) : null}
      </div>

      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Restore</h2>
          <span className="tag-pill">JSON</span>
        </div>
        <p className="preview-placeholder">
          Choose a local backup JSON file and restore its sessions into this
          project. Existing session files with the same name will be replaced.
        </p>

        <label className="sort-field">
          <span>Backup JSON</span>
          <input
            accept="application/json,.json"
            className="text-input"
            onChange={readBackupFile}
            type="file"
          />
        </label>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isRestoring || !backupJson.trim()}
            onClick={restoreBackup}
            type="button"
          >
            {isRestoring ? "Restoring..." : "Restore Backup"}
          </button>
        </div>

        {restoreMessage ? (
          <p className="success-message">{restoreMessage}</p>
        ) : null}
        {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      </div>

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Backup Contents</h2>
        </div>
        <div className="markdown-preview">
          <h3>Included</h3>
          <ul>
            <li>Project metadata</li>
            <li>Session JSON data</li>
            <li>Markdown log metadata</li>
            <li>Generated export metadata</li>
          </ul>
          <h3>Not Included</h3>
          <ul>
            <li>Cloud sync</li>
            <li>Authentication</li>
            <li>Database records</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
