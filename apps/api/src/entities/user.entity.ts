import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { Message } from './message.entity';
import { Session } from './session.entity';

export type Locale = 'fa' | 'en';
export type LastSeenVisibility = 'everyone' | 'nobody';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 11 })
  mobile!: string;

  @Column()
  passwordHash!: string;

  @Column({ length: 50 })
  displayName!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 5, default: 'fa' })
  locale!: Locale;

  @Column({ type: 'varchar', length: 20, default: 'everyone' })
  lastSeenVisibility!: LastSeenVisibility;

  /** Others may forward my messages out of chats with me */
  @Column({ type: 'boolean', default: true })
  allowForward!: boolean;

  /** Soft restriction: peers asked not to screenshot chats with me */
  @Column({ type: 'boolean', default: true })
  allowScreenshot!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ChatParticipant, (p) => p.user)
  participations!: ChatParticipant[];

  @OneToMany(() => Message, (m) => m.sender)
  messages!: Message[];

  @OneToMany(() => Session, (s) => s.user)
  sessions!: Session[];
}
