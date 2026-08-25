import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  AuthResponse,
  SessionDto,
} from '@arazchat/shared';
import { UsersService } from '../users/users.service';
import { toUserDto } from '../common/mappers';
import { Session } from '../entities/session.entity';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    @InjectRepository(Session) private sessions: Repository<Session>,
  ) {}

  async register(
    body: unknown,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthResponse> {
    const input = registerSchema.parse(body);
    const existing = await this.users.findByMobile(input.mobile);
    if (existing) {
      throw new ConflictException('Mobile number already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create({
      mobile: input.mobile,
      passwordHash,
      displayName: input.displayName ?? input.mobile,
      bio: null,
      avatarUrl: null,
      locale: 'fa',
      lastSeenVisibility: 'everyone',
    });

    return this.issueTokens(user.id, {
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  async login(
    body: unknown,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthResponse> {
    const input = loginSchema.parse(body);
    const user = await this.users.findByMobile(input.mobile);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, {
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  async refresh(
    body: unknown,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthResponse> {
    const input = refreshSchema.parse(body);
    const hash = this.hashToken(input.refreshToken);
    const session = await this.sessions.findOne({
      where: { refreshTokenHash: hash, revokedAt: IsNull() },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    session.revokedAt = new Date();
    await this.sessions.save(session);

    return this.issueTokens(session.userId, {
      deviceId: input.deviceId ?? session.deviceId ?? undefined,
      deviceName: session.deviceName ?? undefined,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const session = await this.sessions.findOne({
      where: { refreshTokenHash: hash, revokedAt: IsNull() },
    });
    if (session) {
      session.revokedAt = new Date();
      await this.sessions.save(session);
    }
    return { ok: true };
  }

  async listSessions(userId: string, currentRefresh?: string): Promise<SessionDto[]> {
    const rows = await this.sessions.find({
      where: { userId, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    const currentHash = currentRefresh ? this.hashToken(currentRefresh) : null;
    return rows.map((s) => ({
      id: s.id,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      ip: s.ip,
      userAgent: s.userAgent,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt?.toISOString() ?? null,
      current: !!currentHash && s.refreshTokenHash === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessions.findOne({
      where: { id: sessionId, userId, revokedAt: IsNull() },
    });
    if (session) {
      session.revokedAt = new Date();
      await this.sessions.save(session);
    }
    return { ok: true };
  }

  async revokeAllSessions(userId: string, exceptRefresh?: string) {
    const sessions = await this.sessions.find({
      where: { userId, revokedAt: IsNull() },
    });
    const exceptHash = exceptRefresh ? this.hashToken(exceptRefresh) : null;
    for (const s of sessions) {
      if (exceptHash && s.refreshTokenHash === exceptHash) continue;
      s.revokedAt = new Date();
    }
    await this.sessions.save(sessions);
    return { ok: true };
  }

  private async issueTokens(
    userId: string,
    meta: {
      deviceId?: string;
      deviceName?: string;
      ip?: string;
      userAgent?: string;
    },
  ): Promise<AuthResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();

    const accessToken = this.jwt.sign(
      { sub: userId, typ: 'access' },
      { expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as `${number}m` },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const days = Number(this.config.get('JWT_REFRESH_DAYS', '30'));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.sessions.save(
      this.sessions.create({
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        deviceId: meta.deviceId ?? null,
        deviceName: meta.deviceName ?? null,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        expiresAt,
        lastUsedAt: new Date(),
        revokedAt: null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      user: toUserDto(user),
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
