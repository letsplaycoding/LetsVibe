"use client";

import { useState, useTransition } from "react";
import { askProjectHistory } from "./actions";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  provider?: "openai" | "mock";
};

type ChatViewProps = {
  projectId: string;
  sessionCount: number;
};

const EXAMPLE_QUESTIONS = [
  "What did I build this week?",
  "Summarize dashboard-related work",
  "Which sessions changed the most files?",
  "What should I say about this project in an interview?",
  "What are the main technical highlights?"
];

export function ChatView({ projectId, sessionCount }: ChatViewProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();

  function askQuestion(value?: string): void {
    const nextQuestion = (value ?? question).trim();

    if (!nextQuestion || isPending) {
      return;
    }

    setQuestion("");
    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: nextQuestion
      }
    ]);

    startTransition(async () => {
      const result = await askProjectHistory(projectId, nextQuestion);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
          provider: result.provider
        }
      ]);
    });
  }

  return (
    <section className="chat-layout" aria-label="Project AI chat">
      {sessionCount === 0 ? (
        <div className="empty-state">
          No sessions exist for this project yet. Chat answers will be limited
          until VibeLog has local session data.
        </div>
      ) : null}

      <div className="chat-panel">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <h2>Ask about development history</h2>
            <p>
              Answers are based only on local sessions for this selected
              project.
            </p>
            <div className="chat-suggestions">
              {EXAMPLE_QUESTIONS.map((example) => (
                <button
                  className="button secondary"
                  key={example}
                  onClick={() => askQuestion(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((message, index) => (
              <article
                className={`chat-message chat-message-${message.role}`}
                key={`${message.role}-${index}`}
              >
                <div className="panel-heading">
                  <strong>{message.role === "user" ? "You" : "VibeLog"}</strong>
                  {message.provider ? (
                    <span className="tag-pill">{message.provider}</span>
                  ) : null}
                </div>
                <pre>{message.content}</pre>
              </article>
            ))}
          </div>
        )}
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          askQuestion();
        }}
      >
        <label className="form-field">
          <span>Question</span>
          <textarea
            className="text-area"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about this project's sessions"
            rows={4}
            value={question}
          />
        </label>
        <button className="button" disabled={isPending || !question.trim()} type="submit">
          {isPending ? "Answering..." : "Ask"}
        </button>
      </form>
    </section>
  );
}
