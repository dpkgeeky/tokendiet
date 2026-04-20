import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { UserController } from '../controllers/userController';
import { ProjectController } from '../controllers/projectController';
import { TaskService } from '../services/taskService';
import { UserService } from '../services/userService';
import { ProjectService } from '../services/projectService';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, required, minLength, emailValidator, validateTaskStatus, validateTaskPriority } from '../middleware/validation';
import { UserRole } from '../models/user';
import { createLogger } from '../utils/logger';

const logger = createLogger('Router');

export function createRouter(): Router {
  const router = Router();

  // Initialize services
  const taskService = new TaskService();
  const userService = new UserService();
  const projectService = new ProjectService(taskService, userService);

  // Initialize controllers
  const taskCtrl = new TaskController(taskService);
  const userCtrl = new UserController(userService);
  const projectCtrl = new ProjectController(projectService);

  logger.info('Registering routes');

  // Auth routes (public)
  router.post('/api/auth/register',
    validateBody({ email: [required('email'), emailValidator()], password: [required('password'), minLength('password', 8)] }),
    userCtrl.register,
  );
  router.post('/api/auth/login', userCtrl.login);

  // User routes
  router.get('/api/users', authenticate, userCtrl.list);
  router.get('/api/users/me', authenticate, userCtrl.getMe);
  router.get('/api/users/:id', authenticate, userCtrl.getProfile);
  router.put('/api/users/:id', authenticate, userCtrl.update);
  router.delete('/api/users/:id', authenticate, requireRole(UserRole.ADMIN), userCtrl.deactivate);

  // Task routes
  router.get('/api/tasks', authenticate, taskCtrl.list);
  router.get('/api/tasks/:id', authenticate, taskCtrl.getById);
  router.post('/api/tasks', authenticate,
    validateBody({ title: [required('title'), minLength('title', 3)] }),
    validateTaskStatus, validateTaskPriority,
    taskCtrl.create,
  );
  router.put('/api/tasks/:id', authenticate, validateTaskStatus, validateTaskPriority, taskCtrl.update);
  router.delete('/api/tasks/:id', authenticate, taskCtrl.delete);

  // Project routes
  router.get('/api/projects', authenticate, projectCtrl.list);
  router.get('/api/projects/mine', authenticate, projectCtrl.getMyProjects);
  router.get('/api/projects/:id', authenticate, projectCtrl.getById);
  router.post('/api/projects', authenticate,
    validateBody({ name: [required('name'), minLength('name', 2)] }),
    projectCtrl.create,
  );
  router.put('/api/projects/:id', authenticate, projectCtrl.update);
  router.post('/api/projects/:id/members', authenticate, requireRole(UserRole.MANAGER), projectCtrl.addMember);

  // Task by project
  router.get('/api/projects/:projectId/tasks', authenticate, taskCtrl.getByProject);

  return router;
}
