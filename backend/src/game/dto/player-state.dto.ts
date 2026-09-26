import { Direction } from '../domain/enums/direction.enum.js';
import { Position } from '../domain/interfaces/position.interface.js';

export class PlayerStateDto {
  position!: Position;
  direction!: Direction;
  arrows!: number;
  hasGold!: boolean;
}
