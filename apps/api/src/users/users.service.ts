import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { updateProfileSchema } from '@arazchat/shared';
import { User } from '../entities/user.entity';
import { toUserDto, publicLastSeen } from '../common/mappers';
import { REDIS_CLIENT, RedisKeys } from '../redis/redis.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  create(data: Partial<User> & Pick<User, 'mobile' | 'passwordHash' | 'displayName'>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByMobile(mobile: string) {
    return this.repo.findOne({ where: { mobile } });
  }

  async getMe(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException();
    return toUserDto(user, { isOnline: true, lastSeenAt: null });
  }

  async updateProfile(userId: string, body: unknown) {
    const input = updateProfileSchema.parse(body);
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException();

    if (input.displayName !== undefined) user.displayName = input.displayName;
    if (input.bio !== undefined) user.bio = input.bio;
    if (input.locale !== undefined) user.locale = input.locale;
    if (input.lastSeenVisibility !== undefined) {
      user.lastSeenVisibility = input.lastSeenVisibility;
    }
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
    if (input.allowForward !== undefined) user.allowForward = input.allowForward;
    if (input.allowScreenshot !== undefined) user.allowScreenshot = input.allowScreenshot;

    const saved = await this.repo.save(user);
    return toUserDto(saved, { isOnline: true });
  }

  async search(query: string, excludeId: string) {
    const users = await this.repo
      .createQueryBuilder('u')
      .where('u.mobile LIKE :q OR u.displayName ILIKE :q', {
        q: `%${query}%`,
      })
      .andWhere('u.id != :excludeId', { excludeId })
      .take(20)
      .getMany();

    return Promise.all(users.map((u) => this.toPublicUser(excludeId, u)));
  }

  async toPublicUser(viewerId: string, user: User) {
    const online = !!(await this.redis.get(RedisKeys.userOnline(user.id)));
    const lastSeen = await this.redis.get(RedisKeys.userLastSeen(user.id));
    const visibility = publicLastSeen(viewerId, user, online, lastSeen);
    return toUserDto(user, visibility);
  }
}
