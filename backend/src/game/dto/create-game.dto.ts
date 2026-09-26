import { IsInt, IsOptional, Max, Min, Validate } from 'class-validator';
import {
  MAX_ARROWS,
  MAX_BOARD_SIZE,
  MAX_PIT_COUNT,
  MIN_ARROWS,
  MIN_BOARD_SIZE,
  MIN_PIT_COUNT,
} from '../domain/game-rules.js';
import { PitsFitInBoardConstraint } from './pit-count-fits-board.constraint.js';

export class CreateGameDto {
  @IsOptional()
  @IsInt()
  @Min(MIN_BOARD_SIZE)
  @Max(MAX_BOARD_SIZE)
  boardSize?: number;

  @IsOptional()
  @IsInt()
  @Min(MIN_PIT_COUNT)
  @Max(MAX_PIT_COUNT)
  @Validate(PitsFitInBoardConstraint)
  pitCount?: number;

  @IsOptional()
  @IsInt()
  @Min(MIN_ARROWS)
  @Max(MAX_ARROWS)
  arrows?: number;
}
