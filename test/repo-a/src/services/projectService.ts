import { Project, CreateProjectDTO, UpdateProjectDTO, ProjectSummary, computeProjectSummary, isProjectMember } from '../models/project';
import { BaseService } from './taskService';
import { TaskService } from './taskService';
import { UserService } from './userService';
import { generateId, slugify } from '../utils/helpers';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler';

export class ProjectService extends BaseService<Project> {
  private taskService: TaskService;
  private userService: UserService;

  constructor(taskService: TaskService, userService: UserService) {
    super('ProjectService');
    this.taskService = taskService;
    this.userService = userService;
  }

  createProject(dto: CreateProjectDTO): Project {
    this.validateCreateDTO(dto);

    const owner = this.userService.findById(dto.ownerId);
    if (!owner) throw new NotFoundError('User', dto.ownerId);

    const now = new Date();
    const project: Project = {
      id: generateId(),
      name: dto.name,
      slug: slugify(dto.name),
      description: dto.description,
      ownerId: dto.ownerId,
      memberIds: [dto.ownerId],
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(project.id, project);
    this.logger.info('Project created', { projectId: project.id, slug: project.slug });
    return project;
  }

  updateProject(id: string, dto: UpdateProjectDTO, userId: string): Project {
    const project = this.findById(id);
    if (!project) throw new NotFoundError('Project', id);

    if (project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can update project settings');
    }

    const updated: Project = {
      ...project,
      ...dto,
      slug: dto.name ? slugify(dto.name) : project.slug,
      updatedAt: new Date(),
    };

    this.store.set(id, updated);
    this.logger.info('Project updated', { projectId: id });
    return updated;
  }

  addMember(projectId: string, userId: string): Project {
    const project = this.findById(projectId);
    if (!project) throw new NotFoundError('Project', projectId);

    const user = this.userService.findById(userId);
    if (!user) throw new NotFoundError('User', userId);

    if (!project.memberIds.includes(userId)) {
      project.memberIds.push(userId);
      project.updatedAt = new Date();
      this.store.set(projectId, project);
      this.logger.info('Member added to project', { projectId, userId });
    }
    return project;
  }

  getProjectSummary(projectId: string): ProjectSummary {
    const project = this.findById(projectId);
    if (!project) throw new NotFoundError('Project', projectId);

    const owner = this.userService.findById(project.ownerId);
    if (!owner) throw new NotFoundError('User', project.ownerId);

    const tasks = this.taskService.findByProject(projectId);
    return computeProjectSummary(project, owner, tasks);
  }

  findByMember(userId: string): Project[] {
    return this.findAll().filter((p) => isProjectMember(p, userId));
  }

  private validateCreateDTO(dto: CreateProjectDTO): void {
    if (!dto.name || dto.name.trim().length < 2) {
      throw new ValidationError('Project name too short', { name: 'Min 2 characters' });
    }
  }
}
