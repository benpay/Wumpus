import { Injectable } from '@nestjs/common';
import { GameStateDto } from './dto/game-state.dto.js';
import { PlayerStateDto } from './dto/player-state.dto.js';
import { Game } from './domain/entities/game.entity.js';

@Injectable()
export class GamePresenter {
  toState(game: Game): GameStateDto {
    return {
      gameId: game.id,
      boardSize: game.board.size,
      status: game.status,
      perceptions: [...game.lastPerceptions],
      playerState: this.toPlayerState(game),
      message: game.lastMessage,
      turns: game.turns,
      visitedPositions: game.visitedPositions.map((position) => ({ ...position })),
      logs: [...game.logs],
    };
  }

  private toPlayerState(game: Game): PlayerStateDto {
    return {
      position: { ...game.player.position },
      direction: game.player.direction,
      arrows: game.player.arrows,
      hasGold: game.player.hasGold,
    };
  }
}
