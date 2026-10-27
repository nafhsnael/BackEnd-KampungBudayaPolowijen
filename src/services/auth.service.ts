import { LoginDTO, GoogleLoginDTO } from '../dtos/auth.dto';
import { IUserRepository } from '../repositories/user.repository.interface';
import { UnauthorizedError } from '../errors/app.error';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { TokenRepository } from '../repositories/token.repository';

export interface AuthResponseData {
  user: {
    id: string;
    email: string;
    username?: string;
    fullName: string;
    role: 'user' | 'admin';
    access?: 'user' | 'admin';
    roleTitle?: string;
    status?: 'Aktif' | 'Suspended';
    avatarUrl?: string;
  };
  accessToken: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository = new TokenRepository()
  ) {}

  /**
   * Standard Login with Email and Password
   */
  async login(dto: LoginDTO, adminOnly = false): Promise<AuthResponseData> {
    const identifier = dto.email.trim();
    let user = await this.userRepository.findByEmail(identifier);

    // Fallback: juga dukung login menggunakan username jika user memasukkan username
    if (!user) {
      user = await this.userRepository.findByUsername(identifier);
    }

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (adminOnly && user.role !== 'admin') {
      throw new UnauthorizedError('Akun ini tidak memiliki hak akses administrator');
    }

    if (user.status === 'Suspended') {
      throw new UnauthorizedError('Akun Anda sedang dinonaktifkan (Suspended). Silakan hubungi administrator.');
    }

    const isPasswordValid = await PasswordUtil.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role ?? 'user',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role ?? 'user',
        access: user.role ?? 'user',
        roleTitle: user.roleTitle,
        status: user.status ?? 'Aktif',
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    };
  }

  /**
   * OAuth Login using Google ID Token
   */
  async googleLogin(dto: GoogleLoginDTO): Promise<AuthResponseData> {
    // In production environment, verify token using google-auth-library
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
      user = await this.userRepository.create({
        email: mockGooglePayload.email,
        fullName: mockGooglePayload.fullName,
        username: mockGooglePayload.email.split('@')[0],
        roleTitle: 'User',
        role: 'user',
        status: 'Aktif',
        googleId: mockGooglePayload.googleId,
        avatarUrl: mockGooglePayload.avatarUrl,
      });
    }

    if (user.status === 'Suspended') {
      throw new UnauthorizedError('Akun Anda sedang dinonaktifkan (Suspended). Silakan hubungi administrator.');
    }

    const accessToken = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role ?? 'user',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role ?? 'user',
        access: user.role ?? 'user',
        roleTitle: user.roleTitle,
        status: user.status ?? 'Aktif',
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    };
  }

  async logout(token: { jti: string; exp: number }): Promise<void> {
    await this.tokenRepository.revoke(token.jti, new Date(token.exp * 1000));
  }
}
