import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import { UploadModule } from './upload/upload.module';
import { RedisModule } from './redis/redis.module';
import { GatewayModule } from './gateway/gateway.module';
import { User } from './entities/user.entity';
import { Chat } from './entities/chat.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { Message } from './entities/message.entity';
import { Session } from './entities/session.entity';
import { ChatRead } from './entities/chat-read.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [User, Chat, ChatParticipant, Message, Session, ChatRead],
        synchronize: true,
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    MessagesModule,
    UploadModule,
    GatewayModule,
  ],
})
export class AppModule {}
