import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@Req() req: Request & { user: User }) {
    return this.users.getMe(req.user.id);
  }

  @Patch('me')
  updateMe(@Body() body: unknown, @Req() req: Request & { user: User }) {
    return this.users.updateProfile(req.user.id, body);
  }

  @Get('search')
  search(@Query('q') q: string, @Req() req: Request & { user: User }) {
    return this.users.search(q ?? '', req.user.id);
  }
}
