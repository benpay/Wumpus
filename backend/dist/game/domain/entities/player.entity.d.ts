import { Direction } from '../enums/direction.enum.js';
import { Position } from '../interfaces/position.interface.js';
export interface PlayerConfig {
    initialPosition: Position;
    initialDirection?: Direction;
    arrows?: number;
}
export declare class Player {
    position: Position;
    direction: Direction;
    arrows: number;
    hasGold: boolean;
    constructor(config: PlayerConfig);
    rotateLeft(): void;
    rotateRight(): void;
    getNextPosition(): Position;
    moveTo(newPosition: Position): void;
    shootArrow(): boolean;
    pickUpGold(): void;
}
