import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BranchService } from '../common/branch.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly branchService: BranchService,
  ) {}

  private resetFingerprint(passwordHash: string) {
    return createHmac(
      'sha256',
      process.env.JWT_SECRET || 'shop_nest_jwt_secret_key_2026_super_secure',
    )
      .update(passwordHash)
      .digest('base64url');
  }

  private resetFingerprintMatches(passwordHash: string, fingerprint?: string) {
    if (!fingerprint) return false;
    const expected = Buffer.from(this.resetFingerprint(passwordHash));
    const actual = Buffer.from(fingerprint);
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private generateTokens(userId: number, username: string) {
    const access = this.jwtService.sign(
      { sub: userId, username },
      {
        secret: process.env.JWT_SECRET || 'shop_nest_jwt_secret_key_2026_super_secure',
        expiresIn: '1d',
      },
    );

    const refresh = this.jwtService.sign(
      { sub: userId, username },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'shop_nest_jwt_refresh_secret_key_2026_super_secure',
        expiresIn: '7d',
      },
    );

    return { access, refresh };
  }

  async register(dto: RegisterDto) {
    const rawUsername = dto.username.trim();
    const rawEmail = dto.email ? dto.email.trim() : null;

    if (rawEmail) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: rawEmail },
      });
      if (existingEmail) {
        throw new ConflictException(
          'Пользователь с этим email уже зарегистрирован. Пожалуйста, войдите в систему.',
        );
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { username: rawUsername },
    });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким логином уже существует.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: rawUsername,
        email: rawEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await this.branchService.ensureMainBranch(user.id);

    const tokens = this.generateTokens(user.id, user.username);

    return {
      ...tokens,
      user,
    };
  }

  async login(dto: LoginDto) {
    const raw = dto.username.trim();

    // Поиск пользователя как по логину (username), так и по email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: raw }, { email: raw }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь с таким логином или email не найден');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Вы ввели неверный пароль. Пожалуйста, проверьте пароль');
    }

    const tokens = this.generateTokens(user.id, user.username);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.username && dto.username.trim()) {
      const u = dto.username.trim();
      const existing = await this.prisma.user.findFirst({
        where: {
          username: u,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Имя пользователя уже занято');
      }
      data.username = u;
    }

    if (dto.email !== undefined) {
      data.email = dto.email ? dto.email.trim() : null;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (!dto.oldPassword || !dto.newPassword) {
      throw new BadRequestException('Старый и новый пароль обязательны');
    }
    if (dto.newPassword.length < 6) {
      throw new BadRequestException('Новый пароль должен содержать минимум 6 символов');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Старый пароль указан неверно');
    }

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });

    return { message: 'Пароль успешно обновлен' };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token обязателен');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'shop_nest_jwt_refresh_secret_key_2026_super_secure',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      return this.generateTokens(user.id, user.username);
    } catch {
      throw new UnauthorizedException('Недействительный или истекший refresh token');
    }
  }

  async logout() {
    return { message: 'Успешный выход из системы' };
  }

  async forgotPassword(email: string) {
    const raw = (email || '').trim();
    if (!raw) {
      throw new BadRequestException('Email обязателен');
    }

    const message =
      'Если аккаунт с таким email существует, инструкция для сброса пароля отправлена.';
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: raw }, { username: raw }] },
    });

    if (!user) {
      return { message };
    }

    const token = this.jwtService.sign(
      {
        sub: user.id,
        purpose: 'reset-password',
        pv: this.resetFingerprint(user.password),
      },
      {
        secret: process.env.JWT_SECRET || 'shop_nest_jwt_secret_key_2026_super_secure',
        expiresIn: '30m',
      },
    );

    if (process.env.NODE_ENV !== 'production') {
      const baseUrl = (
        process.env.FRONTEND_URL ||
        process.env.APP_URL ||
        'http://localhost:3000'
      ).replace(/\/+$/, '');
      this.logger.log(
        `Password reset link for user ${user.id}: ${baseUrl}/reset-password?token=${encodeURIComponent(token)}`,
      );
    }

    return { message };
  }

  async resetPassword(dto: { token?: string; password: string }) {
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException(
        'Пароль должен содержать минимум 8 символов',
      );
    }
    if (!dto.token) {
      throw new BadRequestException('Токен сброса пароля обязателен');
    }

    let payload: { sub?: number; purpose?: string; pv?: string };
    try {
      payload = this.jwtService.verify(dto.token, {
        secret: process.env.JWT_SECRET || 'shop_nest_jwt_secret_key_2026_super_secure',
      });
    } catch {
      throw new BadRequestException(
        'Недействительный или истекший токен сброса пароля',
      );
    }

    const userId = Number(payload.sub);
    if (
      payload.purpose !== 'reset-password' ||
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new BadRequestException(
        'Недействительный или истекший токен сброса пароля',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !this.resetFingerprintMatches(user.password, payload.pv)) {
      throw new BadRequestException(
        'Недействительный или истекший токен сброса пароля',
      );
    }

    const hash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });
    return { message: 'Пароль успешно изменен. Теперь вы можете войти в систему.' };
  }
}
