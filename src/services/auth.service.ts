import { LoginDTO, GoogleLoginDTO } from '../dtos/auth.dto';
import { IUserRepository } from '../repositories/user.repository.interface';
import { UnauthorizedError } from '../errors/app.error';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';

export interface AuthResponseData {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
  accessToken: string;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Standard Login with Email and Password
   */
  async login(dto: LoginDTO): Promise<AuthResponseData> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await PasswordUtil.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    };
  }

  /**
   * OAuth Login using Google ID Token
   */
  async googleLogin(dto: GoogleLoginDTO): Promise<AuthResponseData> {
    // In production environment, verify token using google-auth-library (OAuth2Client.verifyIdToken)
    // Here we simulate Google token payload verification
    const mockGooglePayload = {
      googleId: 'google-sub-id-123456',
      email: 'googleuser@example.com',
      fullName: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/a/mock-photo',
    };

    let user = await this.userRepository.findByGoogleId(mockGooglePayload.googleId);

    if (!user) {
      user = await this.userRepository.findByEmail(mockGooglePayload.email);
    }

    if (!user) {
      // If user doesn't exist, create user automatically from Google Profile
      user = await this.userRepository.create({
        email: mockGooglePayload.email,
        fullName: mockGooglePayload.fullName,
        googleId: mockGooglePayload.googleId,
        avatarUrl: mockGooglePayload.avatarUrl,
      });
    }

    const accessToken = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    };
  }
}
