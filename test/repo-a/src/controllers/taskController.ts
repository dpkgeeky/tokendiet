import { Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { parsePagination } from '../middleware/validation';
import { paginate } from '../utils/helpers';
import { createLogger } from '../utils/logger';

const logger = createLogger('TaskController');

export abstract class BaseController {
  protected abstract getBasePath(): string;

  protected sendSuccess(res: Response, data: unknown, statusCode: number = 200): void {
    res.status(statusCode).json({ success: true, data });
  }

  protected sendCreated(res: Response, data: unknown): void {
    this.sendSuccess(res, data, 201);
  }

  protected sendNoContent(res: Response): void {
    res.status(204).send();
  }
}

export class TaskController extends BaseController {
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    super();
    this.taskService = taskService;
  }

  protected getBasePath(): string {
    return '/api/tasks';
  }

  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req);
    const tasks = this.taskService.findAll();
    const result = paginate(tasks, pagination);
    this.sendSuccess(res, result);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const task = this.taskService.findById(req.params.id);
    this.sendSuccess(res, task);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    logger.info('Creating task', { userId: req.user?.id });
    const task = this.taskService.createTask(req.body);
    this.sendCreated(res, task);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const task = this.taskService.updateTask(req.params.id, req.body);
    this.sendSuccess(res, task);
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.taskService.deleteById(req.params.id);
    this.sendNoContent(res);
  });

  getByProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tasks = this.taskService.findByProject(req.params.projectId);
    const pagination = parsePagination(req);
    this.sendSuccess(res, paginate(tasks, pagination));
  });
}
