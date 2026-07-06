import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { NotificationType } from '@medlink/shared';
import { UserEntity } from './user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, (u) => u.notifications)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ length: 200, nullable: true })
  title!: string;

  @Column({ nullable: true, type: 'text' })
  message!: string;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ name: 'reference_id', nullable: true, type: 'uuid' })
  referenceId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
