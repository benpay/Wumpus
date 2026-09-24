import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PersistenceService } from '../persistence/persistence.service.js';
import { Game } from './domain/entities/game.entity.js';
import { GameStatus } from './domain/enums/game-status.enum.js';
import { CreateGameDto } from './dto/create-game.dto.js';
import { GameActionDto } from './dto/game-action.dto.js';

@Injectable()
export class GameService {
  private games = new Map<string, Game>();

  constructor(private readonly persistenceService: PersistenceService) { }

  createGame(dto: CreateGameDto) {
    const gameId = randomUUID();
    const size = dto.boardSize ?? 4;
    const pitCount = dto.pitCount ?? 2;
    const arrows = dto.arrows ?? 1;

    const game = Game.createGame(gameId, size, pitCount, arrows);
    this.games.set(gameId, game);

    return {
      gameId: game.id,
      status: game.status,
      perceptions: game.lastPerceptions,
      playerState: {
        position: game.player.position,
        direction: game.player.direction,
        arrows: game.player.arrows,
        hasGold: game.player.hasGold,
      },
      turns: game.turns,
      visitedPositions: game.visitedPositions,
      boardSize: game.board.size,
      message: game.logs[0] ?? 'La partie commence!',
    };
  }

  getGame(gameId: string): Game {
    const game = this.games.get(gameId);
    if (!game) {
      throw new NotFoundException(`Partie avec ID ${gameId} non trouvée`);
    }
    return game;
  }

  async executeAction(dto: GameActionDto) {
    const game = this.getGame(dto.gameId);
    const result = game.executeAction(dto.action);

    if (result.status !== GameStatus.PLAYING) {
      await this.persistenceService.saveGameRecord(game).catch((err) => {
        console.error("Erreur lors de sauvegarde la partie dans la base de données: ", err);
      });
    }

    return result;
  }

  async getGameHistory() {
    return await this.persistenceService.findAll();
  }
}
