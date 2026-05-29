"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SessionDetail } from "../../../../lib/sessions";
import { saveSessionAnalysis } from "./actions";

type SessionEditorProps = {
  session: SessionDetail;
};

function listToText(values: string[]): string {
  return values.join("\n");
}

function textToList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SessionEditor({ session }: SessionEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [formState, setFormState] = useState({
    featureName: session.featureName,
    summary: session.summary,
    tags: session.tags.join(", "),
    risks: listToText(session.risks),
    todos: listToText(session.todos),
    portfolioText: session.portfolioText,
    futureImprovements: listToText(session.futureImprovements)
  });

  function updateField(
    field: keyof typeof formState,
    value: string
  ): void {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  }

  function cancelEdit(): void {
    setFormState({
      featureName: session.featureName,
      summary: session.summary,
      tags: session.tags.join(", "),
      risks: listToText(session.risks),
      todos: listToText(session.todos),
      portfolioText: session.portfolioText,
      futureImprovements: listToText(session.futureImprovements)
    });
    setErrorMessage("");
    setIsEditing(false);
  }

  function saveEdit(): void {
    setErrorMessage("");

    startTransition(async () => {
      try {
        await saveSessionAnalysis(session.id, {
          featureName: formState.featureName,
          summary: formState.summary,
          tags: textToList(formState.tags),
          risks: textToList(formState.risks),
          todos: textToList(formState.todos),
          portfolioText: formState.portfolioText,
          futureImprovements: textToList(formState.futureImprovements)
        });
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to save session."
        );
      }
    });
  }

  if (!isEditing) {
    return (
      <article className="detail-panel wide edit-panel">
        <div className="panel-heading">
          <h2>Session Analysis</h2>
          <button
            className="button secondary"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Edit
          </button>
        </div>
        <p>Manually refine generated analysis while preserving raw Git data.</p>
      </article>
    );
  }

  return (
    <section className="detail-panel wide edit-panel" aria-label="Edit session">
      <div className="panel-heading">
        <h2>Edit Analysis</h2>
        <span className="small-text">Git data is preserved</span>
      </div>

      <div className="edit-form">
        <label className="form-field">
          <span>Feature name</span>
          <input
            className="text-input"
            onChange={(event) => updateField("featureName", event.target.value)}
            value={formState.featureName}
          />
        </label>

        <label className="form-field">
          <span>Summary</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("summary", event.target.value)}
            rows={4}
            value={formState.summary}
          />
        </label>

        <label className="form-field">
          <span>Tags</span>
          <input
            className="text-input"
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder="dashboard, markdown, cli"
            value={formState.tags}
          />
        </label>

        <label className="form-field">
          <span>Risks</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("risks", event.target.value)}
            rows={4}
            value={formState.risks}
          />
        </label>

        <label className="form-field">
          <span>Todos</span>
          <textarea
            className="text-area"
            onChange={(event) => updateField("todos", event.target.value)}
            rows={4}
            value={formState.todos}
          />
        </label>

        <label className="form-field">
          <span>Portfolio text</span>
          <textarea
            className="text-area"
            onChange={(event) =>
              updateField("portfolioText", event.target.value)
            }
            rows={5}
            value={formState.portfolioText}
          />
        </label>

        <label className="form-field">
          <span>Future improvements</span>
          <textarea
            className="text-area"
            onChange={(event) =>
              updateField("futureImprovements", event.target.value)
            }
            rows={4}
            value={formState.futureImprovements}
          />
        </label>
      </div>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <div className="portfolio-actions">
        <button
          className="button"
          disabled={isPending}
          onClick={saveEdit}
          type="button"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          className="button secondary"
          disabled={isPending}
          onClick={cancelEdit}
          type="button"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
