import { UserDto } from '@arazchat/shared';
import { User } from '../entities/user.entity';

export function toUserDto(
  user: User,
  extras?: Partial<Pick<UserDto, 'isOnline' | 'lastSeenAt'>>,
): UserDto {
  return {
    id: user.id,
    mobile: user.mobile,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    locale: user.locale ?? 'fa',
    lastSeenVisibility: user.lastSeenVisibility ?? 'everyone',
    allowForward: user.allowForward ?? true,
    allowScreenshot: user.allowScreenshot ?? true,
    isOnline: extras?.isOnline,
    lastSeenAt: extras?.lastSeenAt ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function publicLastSeen(
  viewerId: string,
  target: User,
  isOnline: boolean,
  lastSeenAt: string | null,
): Pick<UserDto, 'isOnline' | 'lastSeenAt'> {
  if (viewerId === target.id) {
    return { isOnline, lastSeenAt };
  }
  if (target.lastSeenVisibility === 'nobody') {
    return { isOnline: false, lastSeenAt: null };
  }
  return { isOnline, lastSeenAt };
}
