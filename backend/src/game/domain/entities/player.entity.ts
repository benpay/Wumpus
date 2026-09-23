import { Direction } from '../enums/direction.enum.js';
import { Position } from '../interfaces/position.interface.js';

export interface PlayerConfig {
  initialPosition: Position;
  initialDirection?: Direction;
  arrows?: number;
}

export class Player {
  position: Position;
  direction: Direction;
  arrows: number;
  hasGold: boolean = false;

  constructor(config: PlayerConfig) {
    this.position = { ...config.initialPosition };
    this.direction = config.initialDirection ?? Direction.NORTH;
    this.arrows = config.arrows ?? 1;
  }

  rotateLeft(): void {
    switch (this.direction) {
      case Direction.NORTH:
        this.direction = Direction.WEST;
        break;
      case Direction.WEST:
        this.direction = Direction.SOUTH;
        break;
      case Direction.SOUTH:
        this.direction = Direction.EAST;
        break;
      case Direction.EAST:
        this.direction = Direction.NORTH;
        break;
    }
  }

  rotateRight(): void {
    switch (this.direction) {
      case Direction.NORTH:
        this.direction = Direction.EAST;
        break;
      case Direction.EAST:
        this.direction = Direction.SOUTH;
        break;
      case Direction.SOUTH:
        this.direction = Direction.WEST;
        break;
      case Direction.WEST:
        this.direction = Direction.NORTH;
        break;
    }
  }

  getNextPosition(): Position {
    switch (this.direction) {
      case Direction.NORTH:
        return { x: this.position.x, y: this.position.y + 1 };
      case Direction.EAST:
        return { x: this.position.x + 1, y: this.position.y };
      case Direction.SOUTH:
        return { x: this.position.x, y: this.position.y - 1 };
      case Direction.WEST:
        return { x: this.position.x - 1, y: this.position.y };
    }
  }

  moveTo(newPosition: Position): void {
    this.position = { ...newPosition };
  }

  shootArrow(): boolean {
    if (this.arrows > 0) {
      this.arrows--;
      return true;
    }
    return false;
  }

  pickUpGold(): void {
    this.hasGold = true;
  }
}
