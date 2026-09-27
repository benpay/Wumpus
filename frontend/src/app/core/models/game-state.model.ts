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
  /** Les paramètres utilisés pour créer le jeu, afin qu'il puisse être recréé exactement à l'identique. */
  pitCount: number;
  arrows: number;
  message: string;
  /** Case de départ de la grotte, affichée pour savoir où revenir avec l'or. */
  startPosition?: Position;
  wumpusKilled?: boolean;
}

export interface GameRecord {
  id: string;
  boardSize: number;
  pitCount: number;
  status: GameStatus;
  turns: number;
  hasGold: boolean;
  wumpusKilled: boolean;
  createdAt: string;
}
