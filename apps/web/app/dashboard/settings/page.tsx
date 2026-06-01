import Link from "next/link";
import { LanguageSelector, ThemeSelector } from "../../language-client";
import { AuthStatus } from "../../auth-status";
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
            Review the local AI provider, model, API key status, token usage,
            and estimated cost for this project. LetsVibe never displays the
            actual API key.
          </p>
        </header>

        <section className="detail-grid" aria-label="Settings summary">
          <article className="detail-panel">
            <h2>Language</h2>
            <p className="settings-note no-divider">
              Choose the dashboard language. The preference is stored in this
              browser only.
            </p>
            <LanguageSelector />
          </article>

          <article className="detail-panel">
            <h2>Appearance</h2>
            <p className="settings-note no-divider">
              Choose light, dark, or system appearance. The preference is stored
              in this browser only.
            </p>
            <ThemeSelector />
          </article>

          <AuthStatus />

          <article className="detail-panel">
            <div className="panel-heading">
              <h2>AI Provider</h2>
              <span className="tag-pill">{settings.providerStatus}</span>
            </div>
            <dl className="usage-grid two-column">
              <div>
                <dt>Provider status</dt>
                <dd>{settings.providerStatus}</dd>
              </div>
              <div>
                <dt>Model</dt>
                <dd>{settings.modelName}</dd>
              </div>
            </dl>
            <p className="settings-note">
              Analysis falls back to mock mode when OpenAI is not configured or
              a request fails.
            </p>
          </article>

          <article className="detail-panel">
            <h2>API Key Status</h2>
            <dl className="usage-grid two-column">
              <div>
                <dt>OPENAI_API_KEY</dt>
                <dd>
                  {settings.apiKeyConfigured ? "Configured" : "Not configured"}
                </dd>
              </div>
              <div>
                <dt>Secret value</dt>
                <dd>Hidden</dd>
              </div>
            </dl>
            <p className="settings-note">
              The dashboard only checks whether a key exists. It does not print,
              store, or sync the key value.
            </p>
          </article>

          <article className="detail-panel">
            <h2>Local Usage Summary</h2>
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
            <h2>Token Usage Breakdown</h2>
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
            <p className="settings-note">
              Usage totals are calculated from local session JSON files. Mock
              sessions contribute zero token cost.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
