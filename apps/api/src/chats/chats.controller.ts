import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { ChatsService } from './chats.service';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chats: ChatsService) {}

  @Get()
  list(@Req() req: Request & { user: User }) {
    return this.chats.listForUser(req.user.id);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: Request & { user: User }) {
    return this.chats.getChatDto(id, req.user.id);
  }

  @Patch(':id/privacy')
  updatePrivacy(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request & { user: User },
  ) {
    return this.chats.updatePrivacy(id, req.user.id, body);
  }

  @Post('direct')
  createDirect(@Body() body: unknown, @Req() req: Request & { user: User }) {
    return this.chats.createDirect(req.user.id, body);
  }

  @Post('group')
  createGroup(@Body() body: unknown, @Req() req: Request & { user: User }) {
    return this.chats.createGroup(req.user.id, body);
  }
}
