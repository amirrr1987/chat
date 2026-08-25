import { Body, Controller, Delete, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() body: unknown, @Req() req: Request) {
    return this.auth.register(body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('login')
  login(@Body() body: unknown, @Req() req: Request) {
    return this.auth.login(body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('refresh')
  refresh(@Body() body: unknown, @Req() req: Request) {
    return this.auth.refresh(body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('logout')
  logout(@Body() body: { refreshToken?: string }) {
    return this.auth.logout(body.refreshToken ?? '');
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  sessions(
    @Req() req: Request & { user: User },
    @Headers('x-refresh-token') refresh?: string,
  ) {
    return this.auth.listSessions(req.user.id, refresh);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  revokeSession(@Param('id') id: string, @Req() req: Request & { user: User }) {
    return this.auth.revokeSession(req.user.id, id);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  revokeAll(
    @Req() req: Request & { user: User },
    @Headers('x-refresh-token') refresh?: string,
  ) {
    return this.auth.revokeAllSessions(req.user.id, refresh);
  }
}
