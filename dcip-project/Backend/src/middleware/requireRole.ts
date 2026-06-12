import { Response, NextFunction } from 'express'
import { AuthRequest } from './authMiddleware'
import { UserRole } from '../models/User'

export const requireRole =
  (role: UserRole) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.userRole !== role) {
      res.status(403).json({ message: 'Access denied' })
      return
    }
    next()
  }
