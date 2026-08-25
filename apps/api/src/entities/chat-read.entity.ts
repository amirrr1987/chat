import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('chat_reads')
@Unique(['chatId', 'userId'])
export class ChatRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  chatId!: string;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  lastReadMessageId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat!: Chat;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Message, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lastReadMessageId' })
  lastReadMessage!: Message | null;
}
