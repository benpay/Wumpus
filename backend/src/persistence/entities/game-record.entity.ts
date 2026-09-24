import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('games')
export class GameRecord {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  boardSize!: number;

  @Column({ type: 'int' })
  pitCount!: number;

  @Column({ type: 'int' })
  arrowsCount!: number;

  @Column({ type: 'varchar', length: 10 })
  status!: string;

  @Column({ type: 'int' })
  turns!: number;

  @Column({ type: 'boolean', default: false })
  hasGold!: boolean;

  @Column({ type: 'boolean', default: false })
  wumpusKilled!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  logs!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
