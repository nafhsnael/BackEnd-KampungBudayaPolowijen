import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/response.util';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      ApiResponse.success({
        res,
        statusCode: 200,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/google
   */
  googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.googleLogin(req.body);
      ApiResponse.success({
        res,
        statusCode: 200,
        message: 'Google login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
