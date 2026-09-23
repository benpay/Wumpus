import { Action } from '../enums/action.enum.js';
import { Direction } from '../enums/direction.enum.js';
import { GameStatus } from '../enums/game-status.enum.js';
import { Perception } from '../enums/perception.enum.js';
import { Position } from '../interfaces/position.interface.js';
import { Board, BoardConfig } from './board.entity.js';
import { Player, PlayerConfig } from './player.entity.js';
export interface GameConfig {
    id: string;
    boardConfig: BoardConfig;
    playerConfig: PlayerConfig;
}
export interface GameActionResult {
    status: GameStatus;
    perceptions: Perception[];
    playerState: {
        position: Position;
        direction: Direction;
        arrows: number;
        hasGold: boolean;
    };
    message: string;
    turns: number;
    visitedPositions: Position[];
}
export declare class Game {
    readonly id: string;
    readonly board: Board;
    readonly player: Player;
    readonly startPosition: Position;
    status: GameStatus;
    turns: number;
    visitedPositions: Position[];
    lastPerceptions: Perception[];
    logs: string[];
    constructor(config: GameConfig);
    static createGame(id: string, size?: number, pitCount?: number, arrows?: number, startPosition?: Position): Game;
    executeAction(action: Action): GameActionResult;
    private checkArrowHit;
    private recordVisited;
    private buildResult;
}
