import { Perception } from '../enums/perception.enum.js';
import { Position } from '../interfaces/position.interface.js';
export interface BoardConfig {
    size: number;
    wumpusPosition: Position;
    goldPosition: Position;
    pits: Position[];
}
export declare class Board {
    readonly size: number;
    readonly wumpusPosition: Position;
    readonly goldPosition: Position;
    readonly pits: Position[];
    private wumpusAlive;
    private goldPickedUp;
    constructor(config: BoardConfig);
    static isSamePosition(a: Position, b: Position): boolean;
    isWithinBounds(pos: Position): boolean;
    getAdjacentPositions(pos: Position): Position[];
    get isWumpusAlive(): boolean;
    killWumpus(): void;
    get isGoldPickedUp(): boolean;
    pickUpGold(): void;
    hasPit(pos: Position): boolean;
    hasWumpus(pos: Position): boolean;
    hasGold(pos: Position): boolean;
    getPerceptionsAt(pos: Position): Perception[];
    static generateRandomBoard(size: number, pitCount: number, startPosition: Position): Board;
}
