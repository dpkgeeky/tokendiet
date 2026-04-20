import { Task, TaskStatus } from './task';
import { User, UserPublicProfile, toPublicProfile } from './user';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  description: string;
  ownerId: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

export interface ProjectSummary {
  project: Project;
  owner: UserPublicProfile;
  memberCount: number;
  taskCounts: Record<TaskStatus, number>;
  completionPercentage: number;
}

export function computeProjectSummary(
  project: Project,
  owner: User,
  tasks: Task[],
): ProjectSummary {
  const taskCounts = Object.values(TaskStatus).reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status).length;
      return acc;
    },
    {} as Record<TaskStatus, number>,
  );

  const total = tasks.length;
  const done = taskCounts[TaskStatus.DONE] || 0;
  const completionPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    project,
    owner: toPublicProfile(owner),
    memberCount: project.memberIds.length,
    taskCounts,
    completionPercentage,
  };
}

export function isProjectMember(project: Project, userId: string): boolean {
  return project.ownerId === userId || project.memberIds.includes(userId);
}

export function getActiveProjects(projects: Project[]): Project[] {
  return projects.filter((p) => !p.isArchived);
}
