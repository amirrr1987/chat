import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { MessagesService } from './messages.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get('chats/:chatId/messages')
  list(
    @Param('chatId') chatId: string,
    @Query('limit') limit: string,
    @Query('before') before: string,
    @Req() req: Request & { user: User },
  ) {
    return this.messages.list(
      chatId,
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
      before,
    );
  }

  @Post('chats/:chatId/messages')
  send(
    @Param('chatId') chatId: string,
    @Body() body: unknown,
    @Req() req: Request & { user: User },
  ) {
    return this.messages.send(req.user.id, { ...(body as object), chatId });
  }

  @Patch('messages/:id')
  edit(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request & { user: User },
  ) {
    return this.messages.edit(req.user.id, id, body);
  }

  @Delete('messages/:id')
  remove(@Param('id') id: string, @Req() req: Request & { user: User }) {
    return this.messages.softDelete(req.user.id, id);
  }

  @Post('messages/read')
  markRead(@Body() body: unknown, @Req() req: Request & { user: User }) {
    return this.messages.markRead(req.user.id, body);
  }
}
