import { GameStatus } from '../domain/enums/game-status.enum.js';
import { Perception } from '../domain/enums/perception.enum.js';
import { Position } from '../domain/interfaces/position.interface.js';
import { PlayerStateDto } from './player-state.dto.js';

export class GameStateDto {
  gameId!: string;
  boardSize!: number;
  pitCount!: number;
  arrows!: number;
  status!: GameStatus;
  perceptions!: Perception[];
  playerState!: PlayerStateDto;
  message!: string;
  turns!: number;
  visitedPositions!: Position[];
  /** Case de départ: c'est par là qu'il faut revenir pour s'enfuir avec l'or. */
  startPosition!: Position;
  wumpusKilled!: boolean;
}
