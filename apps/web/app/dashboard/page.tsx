import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const { project } = await searchParams;

  return <DashboardView projectId={project} />;
}
