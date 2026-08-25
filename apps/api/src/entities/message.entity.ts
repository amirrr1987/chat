import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';

export type MessageType = 'text' | 'image';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  chatId!: string;

  @Column('uuid')
  senderId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: MessageType;

  @Column('text')
  content!: string;

  @Column({ type: 'uuid', nullable: true })
  replyToMessageId!: string | null;

  /** Keeps a stable reference to the original message (not a blind copy). */
  @Column({ type: 'uuid', nullable: true })
  forwardFromMessageId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  forwardFromSenderId!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  forwardFromSenderName!: string | null;

  /**
   * Privacy snapshot at send time (user settings ∩ chat settings ∩ per-message restrict).
   * Later changes to user/chat settings do not rewrite older messages.
   */
  @Column({ type: 'boolean', default: true })
  allowForward!: boolean;

  @Column({ type: 'boolean', default: true })
  allowScreenshot!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Chat, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat!: Chat;

  @ManyToOne(() => User, (u) => u.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replyToMessageId' })
  replyTo!: Message | null;
}
