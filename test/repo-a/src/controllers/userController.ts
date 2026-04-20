import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { BaseController } from './taskController';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { parsePagination } from '../middleware/validation';
import { paginate } from '../utils/helpers';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserController');

export class UserController extends BaseController {
  private userService: UserService;

  constructor(userService: UserService) {
    super();
    this.userService = userService;
  }

  protected getBasePath(): string {
    return '/api/users';
  }

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Registering new user', { email: req.body.email });
    const user = await this.userService.createUser(req.body);
    this.sendCreated(res, this.userService.getPublicProfile(user.id));
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await this.userService.authenticate(email, password);
    this.sendSuccess(res, result);
  });

  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req);
    const users = this.userService.findAll();
    const profiles = users.map((u) => this.userService.getPublicProfile(u.id));
    this.sendSuccess(res, paginate(profiles, pagination));
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profile = this.userService.getPublicProfile(req.params.id);
    this.sendSuccess(res, profile);
  });

  getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const profile = this.userService.getPublicProfile(req.user.id);
    this.sendSuccess(res, profile);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.params.id;
    logger.info('Updating user', { userId });
    const user = this.userService.updateUser(userId, req.body);
    this.sendSuccess(res, this.userService.getPublicProfile(user.id));
  });

  deactivate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.userService.deactivateUser(req.params.id);
    this.sendNoContent(res);
  });
}
