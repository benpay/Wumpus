import { GameConfig } from './game-config.model';

export const MIN_BOARD_SIZE = 3;
export const MAX_BOARD_SIZE = 10;
export const MIN_PIT_COUNT = 1;
export const MAX_PIT_COUNT = 10;
export const MIN_ARROWS = 1;
export const MAX_ARROWS = 5;

export const DEFAULT_BOARD_SIZE = 4;
export const DEFAULT_PIT_COUNT = 2;
export const DEFAULT_ARROWS = 1;

/**
 * La sortie, le Wumpus et l'or occupent 3 cases qui ne peuvent pas être un gouffre.
 */
export function maxPitCountFor(boardSize: number): number {
  return Math.min(MAX_PIT_COUNT, boardSize * boardSize - 3);
}

const isIntegerInRange = (value: number, min: number, max: number): boolean =>
  Number.isInteger(value) && value >= min && value <= max;

/**
 * Renvoie la liste des erreurs en français. Vide = configuration valide.
 */
export function validateGameConfig(config: GameConfig): string[] {
  const errors: string[] = [];

  if (!isIntegerInRange(config.boardSize, MIN_BOARD_SIZE, MAX_BOARD_SIZE)) {
    errors.push(`La taille de la grotte doit être comprise entre ${MIN_BOARD_SIZE} et ${MAX_BOARD_SIZE}.`);
  }
  if (!isIntegerInRange(config.pitCount, MIN_PIT_COUNT, MAX_PIT_COUNT)) {
    errors.push(`Le nombre de gouffres doit être compris entre ${MIN_PIT_COUNT} et ${MAX_PIT_COUNT}.`);
  }
  if (!isIntegerInRange(config.arrows, MIN_ARROWS, MAX_ARROWS)) {
    errors.push(`Le nombre de flèches doit être compris entre ${MIN_ARROWS} et ${MAX_ARROWS}.`);
  }

  if (errors.length === 0) {
    const maxPits = maxPitCountFor(config.boardSize);
    if (config.pitCount > maxPits) {
      errors.push(
        `Une grotte de ${config.boardSize}x${config.boardSize} ne peut pas contenir plus de ${maxPits} gouffres ` +
        `(la sortie, le Wumpus et l'or occupent 3 cases).`,
      );
    }
  }

  return errors;
}
