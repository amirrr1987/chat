import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { Message } from '../entities/message.entity';
import { ChatRead } from '../entities/chat-read.entity';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatParticipant, Message, ChatRead])],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
