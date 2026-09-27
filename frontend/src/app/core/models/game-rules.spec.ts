import { GameConfig } from './game-config.model';
import { maxPitCountFor, validateGameConfig } from './game-rules';

const config = (overrides: Partial<GameConfig> = {}): GameConfig => ({
  boardSize: 4,
  pitCount: 2,
  arrows: 1,
  ...overrides,
});

describe('game-rules', () => {
  describe('maxPitCountFor', () => {
    it('déduit 6 gouffres en 3x3 (9 cases - sortie - Wumpus - or)', () => {
      expect(maxPitCountFor(3)).toBe(6);
    });

    it('est plafonné par MAX_PIT_COUNT à partir de 4x4', () => {
      expect(maxPitCountFor(4)).toBe(10);
      expect(maxPitCountFor(10)).toBe(10);
    });
  });

  describe('validateGameConfig', () => {
    it('accepte la configuration par défaut', () => {
      expect(validateGameConfig(config())).toEqual([]);
    });

    it('accepte les bornes inclusives', () => {
      expect(validateGameConfig(config({ boardSize: 3, pitCount: 1, arrows: 1 }))).toEqual([]);
      expect(validateGameConfig(config({ boardSize: 10, pitCount: 10, arrows: 5 }))).toEqual([]);
    });

    it('refuse une grotte hors limites', () => {
      expect(validateGameConfig(config({ boardSize: 2 }))[0]).toContain('entre 3 et 10');
      expect(validateGameConfig(config({ boardSize: 11 }))[0]).toContain('entre 3 et 10');
    });

    it('refuse des gouffres hors limites', () => {
      expect(validateGameConfig(config({ pitCount: 0 }))[0]).toContain('entre 1 et 10');
      expect(validateGameConfig(config({ pitCount: 11 }))[0]).toContain('entre 1 et 10');
    });

    it('refuse des flèches hors limites', () => {
      expect(validateGameConfig(config({ arrows: 0 }))[0]).toContain('entre 1 et 5');
      expect(validateGameConfig(config({ arrows: 6 }))[0]).toContain('entre 1 et 5');
    });

    it('refuse les valeurs non entières', () => {
      expect(validateGameConfig(config({ boardSize: 4.5 }))).toHaveSize(1);
      expect(validateGameConfig(config({ arrows: Number.NaN }))).toHaveSize(1);
    });

    it('refuse plus de gouffres que la grotte n\'en peut contenir', () => {
      const errors = validateGameConfig(config({ boardSize: 3, pitCount: 7 }));
      expect(errors).toHaveSize(1);
      expect(errors[0]).toContain('ne peut pas contenir plus de 6 gouffres');
    });

    it('accepte 6 gouffres en 3x3', () => {
      expect(validateGameConfig(config({ boardSize: 3, pitCount: 6 }))).toEqual([]);
    });

    it('accumule plusieurs erreurs', () => {
      expect(validateGameConfig(config({ boardSize: 2, pitCount: 0, arrows: 9 }))).toHaveSize(3);
    });

    it('ne signale pas deux fois la même grotte', () => {
      // boardSize 3 + 7 gouffres : une seule erreur, pas une par paramètre.
      expect(validateGameConfig(config({ boardSize: 3, pitCount: 7 }))).toHaveSize(1);
    });
  });
});
