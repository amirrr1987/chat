import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column()
  refreshTokenHash!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  deviceId!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  deviceName!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @ManyToOne(() => User, (u) => u.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
