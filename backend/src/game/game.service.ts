import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PersistenceService } from '../persistence/persistence.service.js';
import { GamePresenter } from './game.presenter.js';
import { GameStateDto } from './dto/game-state.dto.js';
import { Game } from './domain/entities/game.entity.js';
import { GameStatus } from './domain/enums/game-status.enum.js';
import {
  DEFAULT_ARROWS,
  DEFAULT_BOARD_SIZE,
  DEFAULT_PIT_COUNT,
} from './domain/game-rules.js';
import { CreateGameDto } from './dto/create-game.dto.js';
import { GameActionDto } from './dto/game-action.dto.js';

@Injectable()
export class GameService {
  private games = new Map<string, Game>();

  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly presenter: GamePresenter,
  ) { }

  createGame(dto: CreateGameDto): GameStateDto {
    const gameId = randomUUID();
    const size = dto.boardSize ?? DEFAULT_BOARD_SIZE;
    const pitCount = dto.pitCount ?? DEFAULT_PIT_COUNT;
    const arrows = dto.arrows ?? DEFAULT_ARROWS;

    const game = Game.createGame(gameId, size, pitCount, arrows);
    this.games.set(gameId, game);

    return this.presenter.toState(game);
  }

  getGame(gameId: string): Game {
    const game = this.games.get(gameId);
    if (!game) {
      throw new NotFoundException(`Partie avec ID ${gameId} non trouvée`);
    }
    return game;
  }

  getGameState(gameId: string): GameStateDto {
    return this.presenter.toState(this.getGame(gameId));
  }

  async executeAction(dto: GameActionDto): Promise<GameStateDto> {
    const game = this.getGame(dto.gameId);
    game.executeAction(dto.action);

    if (game.status !== GameStatus.PLAYING) {
      await this.persistenceService.saveGameRecord(game).catch((err) => {
        console.error("Erreur lors de sauvegarde la partie dans la base de données: ", err);
      });
    }

    return this.presenter.toState(game);
  }

  async getGameHistory() {
    return await this.persistenceService.findAll();
  }
}
