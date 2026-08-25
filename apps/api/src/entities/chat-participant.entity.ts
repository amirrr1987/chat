import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Chat } from './chat.entity';

@Entity('chat_participants')
@Unique(['chatId', 'userId'])
export class ChatParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  chatId!: string;

  @Column('uuid')
  userId!: string;

  @CreateDateColumn()
  joinedAt!: Date;

  @ManyToOne(() => Chat, (c) => c.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat!: Chat;

  @ManyToOne(() => User, (u) => u.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
