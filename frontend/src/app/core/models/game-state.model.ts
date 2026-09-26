import { Direction, GameStatus, Perception } from './enums';

export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Position;
  direction: Direction;
  arrows: number;
  hasGold: boolean;
}

export interface GameState {
  gameId: string;
  status: GameStatus;
  perceptions: Perception[];
  playerState: PlayerState;
  turns: number;
  visitedPositions: Position[];
  boardSize: number;
  message: string;
}

export interface GameRecord {
  id: string;
  boardSize: number;
  pitCount: number;
  arrowsCount: number;
  status: GameStatus;
  turns: number;
  hasGold: boolean;
  wumpusKilled: boolean;
  logs: string[];
  createdAt: string;
}
