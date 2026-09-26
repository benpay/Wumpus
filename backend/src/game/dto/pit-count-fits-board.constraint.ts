import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import type { CreateGameDto } from './create-game.dto.js';
import { DEFAULT_BOARD_SIZE, DEFAULT_PIT_COUNT, maxPitCountFor } from '../domain/game-rules.js';

@ValidatorConstraint({ name: 'pitsFitInBoard', async: false })
export class PitsFitInBoardConstraint implements ValidatorConstraintInterface {
  validate(_value: number, args: ValidationArguments): boolean {
    const { boardSize = DEFAULT_BOARD_SIZE, pitCount = DEFAULT_PIT_COUNT } = args.object as CreateGameDto;
    return pitCount <= maxPitCountFor(boardSize);
  }

  defaultMessage(args: ValidationArguments): string {
    const { boardSize = DEFAULT_BOARD_SIZE } = args.object as CreateGameDto;
    const maxPits = maxPitCountFor(boardSize);
    return `pitCount ne peut pas dépasser ${maxPits} pour une grotte de ${boardSize}x${boardSize} : ` +
      `la sortie, le Wumpus et l'or occupent 3 cases.`;
  }
}
