"use client";

import { useRouter } from "next/navigation";
import type { ProjectMetadata } from "../../lib/sessions";

type ProjectSelectorProps = {
  currentProjectId: string;
  projects: ProjectMetadata[];
};

export function ProjectSelector({
  currentProjectId,
  projects
}: ProjectSelectorProps) {
  const router = useRouter();

  return (
    <label className="project-selector">
      <span>Project</span>
      <select
        className="select-control"
        onChange={(event) =>
          router.push(`/dashboard/project/${event.target.value}`)
        }
        value={currentProjectId}
      >
        {projects.map((project) => (
          <option key={project.projectId} value={project.projectId}>
            {project.projectName} ({project.sessionCount})
          </option>
        ))}
      </select>
    </label>
  );
}
