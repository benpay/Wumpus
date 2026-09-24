import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../game/domain/entities/game.entity.js';
import { GameRecord } from './entities/game-record.entity.js';

@Injectable()
export class PersistenceService {
  constructor(
    @InjectRepository(GameRecord)
    private readonly gameRepository: Repository<GameRecord>,
  ) {}

  async saveGameRecord(game: Game): Promise<GameRecord> {
    const record = this.gameRepository.create({
      id: game.id,
      boardSize: game.board.size,
      pitCount: game.board.pits.length,
      arrowsCount: game.player.arrows,
      status: game.status,
      turns: game.turns,
      hasGold: game.player.hasGold,
      wumpusKilled: !game.board.isWumpusAlive,
      logs: game.logs,
    });

    return await this.gameRepository.save(record);
  }

  async findAll(): Promise<GameRecord[]> {
    return await this.gameRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<GameRecord | null> {
    return await this.gameRepository.findOne({
      where: { id },
    });
  }
}
