/**
 * Limites du jeu. Source unique de verite : utilisee par le DTO (validation de l'API),
 * le service (valeurs par defaut) et le plateau (viabilite logique).
 *
 * Les maximums correspondent aux limites du formulaire de configuration du frontend.
 */
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
 * La case de sortie, le Wumpus et l'or occupent 3 cases qui ne peuvent pas etre un puits,
 * donc dans une grotte de N x N on peut placer au maximum N * N - 3 puits.
 */
export function maxPitCountFor(boardSize: number): number {
  return Math.min(MAX_PIT_COUNT, boardSize * boardSize - 3);
}
