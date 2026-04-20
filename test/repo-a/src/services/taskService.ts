import { Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus, getDefaultTask } from '../models/task';
import { generateId } from '../utils/helpers';
import { createLogger, Logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export abstract class BaseService<T extends { id: string }> {
  protected logger: Logger;
  protected store: Map<string, T> = new Map();

  constructor(context: string) {
    this.logger = createLogger(context);
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }

  findAll(): T[] {
    return Array.from(this.store.values());
  }

  deleteById(id: string): boolean {
    return this.store.delete(id);
  }

  count(): number {
    return this.store.size;
  }
}

export class TaskService extends BaseService<Task> {
  constructor() {
    super('TaskService');
  }

  createTask(dto: CreateTaskDTO): Task {
    this.validateCreateDTO(dto);
    const defaults = getDefaultTask(dto.projectId);
    const now = new Date();

    const task: Task = {
      id: generateId(),
      title: dto.title,
      description: dto.description,
      status: defaults.status!,
      priority: dto.priority ?? defaults.priority!,
      assigneeId: dto.assigneeId ?? null,
      projectId: dto.projectId,
      tags: dto.tags ?? [],
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(task.id, task);
    this.logger.info('Task created', { taskId: task.id, projectId: task.projectId });
    return task;
  }

  updateTask(id: string, dto: UpdateTaskDTO): Task {
    const task = this.findById(id);
    if (!task) throw new NotFoundError('Task', id);

    const updated: Task = {
      ...task,
      ...dto,
      dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : task.dueDate,
      updatedAt: new Date(),
    };

    this.store.set(id, updated);
    this.logger.info('Task updated', { taskId: id });
    return updated;
  }

  findByProject(projectId: string): Task[] {
    return this.findAll().filter((t) => t.projectId === projectId);
  }

  findByAssignee(assigneeId: string): Task[] {
    return this.findAll().filter((t) => t.assigneeId === assigneeId);
  }

  findByStatus(status: TaskStatus): Task[] {
    return this.findAll().filter((t) => t.status === status);
  }

  private validateCreateDTO(dto: CreateTaskDTO): void {
    if (!dto.title || dto.title.trim().length < 3) {
      throw new ValidationError('Task title must be at least 3 characters', {
        title: 'Too short',
      });
    }
    if (!dto.projectId) {
      throw new ValidationError('Project ID is required', { projectId: 'Required' });
    }
  }
}
