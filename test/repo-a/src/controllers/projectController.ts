import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { BaseController } from './taskController';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { parsePagination } from '../middleware/validation';
import { paginate } from '../utils/helpers';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProjectController');

export class ProjectController extends BaseController {
  private projectService: ProjectService;

  constructor(projectService: ProjectService) {
    super();
    this.projectService = projectService;
  }

  protected getBasePath(): string {
    return '/api/projects';
  }

  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req);
    const projects = this.projectService.findAll();
    this.sendSuccess(res, paginate(projects, pagination));
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const summary = this.projectService.getProjectSummary(req.params.id);
    this.sendSuccess(res, summary);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    logger.info('Creating project', { userId: req.user?.id });
    const dto = { ...req.body, ownerId: req.user?.id };
    const project = this.projectService.createProject(dto);
    this.sendCreated(res, project);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const project = this.projectService.updateProject(
      req.params.id,
      req.body,
      req.user!.id,
    );
    this.sendSuccess(res, project);
  });

  addMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;
    const project = this.projectService.addMember(req.params.id, userId);
    this.sendSuccess(res, project);
  });

  getMyProjects = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const projects = this.projectService.findByMember(req.user!.id);
    const pagination = parsePagination(req);
    this.sendSuccess(res, paginate(projects, pagination));
  });
}
