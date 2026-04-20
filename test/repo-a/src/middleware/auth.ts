import { Request, Response, NextFunction } from 'express';
import { UserRole, User, hasPermission } from '../models/user';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthMiddleware');

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);

  if (!token) {
    throw new UnauthorizedError('No authentication token provided');
  }

  // Simulated token verification - in production, verify JWT
  try {
    const decoded = decodeToken(token);
    req.user = decoded as unknown as User;
    req.token = token;
    logger.debug('User authenticated', { userId: decoded.id });
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasRequiredRole = roles.some((role) => hasPermission(req.user!, role));

    if (!hasRequiredRole) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      throw new ForbiddenError(
        `Requires one of: ${roles.join(', ')}`,
      );
    }

    next();
  };
}

export function decodeToken(token: string): Record<string, unknown> {
  // Simulated decode - replace with real JWT verification
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }
  const payload = Buffer.from(parts[1], 'base64').toString();
  return JSON.parse(payload);
}

export function generateToken(user: User, secret: string, expiresIn: string): string {
  // Simulated token generation - replace with real JWT signing
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, role: user.role }),
  ).toString('base64');
  const signature = Buffer.from(`${secret}:${expiresIn}`).toString('base64');
  return `${header}.${payload}.${signature}`;
}
