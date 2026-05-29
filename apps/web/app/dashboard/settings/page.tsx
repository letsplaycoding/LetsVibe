import Link from "next/link";
import { getSettingsSummary } from "../../../lib/sessions";

export const dynamic = "force-dynamic";

function formatCost(value: number): string {
  return `$${value.toFixed(6)}`;
}

type SettingsPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { project } = await searchParams;
  const settings = getSettingsSummary(project);
  const dashboardHref = project ? `/dashboard/project/${project}` : "/dashboard";

  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href={dashboardHref}>
            VibeLog
          </Link>
          <Link className="button secondary" href={dashboardHref}>
            Back to Dashboard
          </Link>
        </nav>

        <header className="dashboard-header">
          <h1>Settings</h1>
          <p>
            Review local AI configuration and usage totals without exposing
            secrets.
          </p>
        </header>

        <section className="detail-grid" aria-label="Settings summary">
          <article className="detail-panel">
            <h2>AI Configuration</h2>
            <dl className="usage-grid two-column">
              <div>
                <dt>Provider status</dt>
                <dd>{settings.providerStatus}</dd>
              </div>
              <div>
                <dt>API key</dt>
                <dd>{settings.apiKeyConfigured ? "Configured" : "Missing"}</dd>
              </div>
              <div>
                <dt>Model</dt>
                <dd>{settings.modelName}</dd>
              </div>
            </dl>
          </article>

          <article className="detail-panel">
            <h2>Local Sessions</h2>
            <dl className="usage-grid two-column">
              <div>
                <dt>Total sessions</dt>
                <dd>{settings.totalSessions}</dd>
              </div>
              <div>
                <dt>Total tokens</dt>
                <dd>{settings.totalTokens}</dd>
              </div>
              <div>
                <dt>Estimated cost</dt>
                <dd>{formatCost(settings.estimatedTotalCostUsd)}</dd>
              </div>
            </dl>
          </article>

          <article className="detail-panel wide">
            <h2>Token Usage</h2>
            <dl className="usage-grid">
              <div>
                <dt>Input tokens</dt>
                <dd>{settings.totalInputTokens}</dd>
              </div>
              <div>
                <dt>Output tokens</dt>
                <dd>{settings.totalOutputTokens}</dd>
              </div>
              <div>
                <dt>Total tokens</dt>
                <dd>{settings.totalTokens}</dd>
              </div>
              <div>
                <dt>Estimated total cost</dt>
                <dd>{formatCost(settings.estimatedTotalCostUsd)}</dd>
              </div>
            </dl>
          </article>
        </section>
      </div>
    </main>
  );
}
