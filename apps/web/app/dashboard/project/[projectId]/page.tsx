import { DashboardView } from "../../dashboard-view";

export const dynamic = "force-dynamic";

type ProjectDashboardPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDashboardPage({
  params
}: ProjectDashboardPageProps) {
  const { projectId } = await params;

  return <DashboardView projectId={projectId} />;
}
