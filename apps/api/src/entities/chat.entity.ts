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

export type ChatType = 'direct' | 'group' | 'saved';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: ChatType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'boolean', default: true })
  allowForward!: boolean;

  @Column({ type: 'boolean', default: true })
  allowScreenshot!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ChatParticipant, (p) => p.chat)
  participants!: ChatParticipant[];

  @OneToMany(() => Message, (m) => m.chat)
  messages!: Message[];
}
