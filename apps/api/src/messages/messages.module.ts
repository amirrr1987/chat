import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { ChatRead } from '../entities/chat-read.entity';
import { User } from '../entities/user.entity';
import { ChatsModule } from '../chats/chats.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatRead, User]), ChatsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
