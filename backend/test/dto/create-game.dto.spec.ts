import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateGameDto } from '../../src/game/dto/create-game.dto.js';
import { maxPitCountFor } from '../../src/game/domain/game-rules.js';

function errorsFor(payload: object): string[] {
  const dto = plainToInstance(CreateGameDto, payload);
  return validate(dto).then((errors) =>
    errors.flatMap((error) => Object.values(error.constraints ?? {})),
  );
}

describe('CreateGameDto', () => {
  describe('paramètres valides', () => {
    it('accepte un corps vide (tout prend la valeur par défaut)', async () => {
      expect(await errorsFor({})).toEqual([]);
    });

    it('accepte les bornes inclusives de chaque paramètre', async () => {
      expect(await errorsFor({ boardSize: 3, pitCount: 1, arrows: 1 })).toEqual([]);
      expect(await errorsFor({ boardSize: 10, pitCount: 10, arrows: 5 })).toEqual([]);
    });

    it('accepte le nombre maximal de puits pour chaque taille de grotte', async () => {
      for (let size = 3; size <= 10; size++) {
        expect(await errorsFor({ boardSize: size, pitCount: maxPitCountFor(size) })).toEqual([]);
      }
    });
  });

  describe('paramètres hors limites', () => {
    it('refuse une grotte trop petite', async () => {
      expect(await errorsFor({ boardSize: 2 })).toContain('boardSize must not be less than 3');
    });

    it('refuse une grotte trop grande', async () => {
      expect(await errorsFor({ boardSize: 11 })).toContain('boardSize must not be greater than 10');
    });

    it('refuse 0 puits', async () => {
      expect(await errorsFor({ pitCount: 0 })).toContain('pitCount must not be less than 1');
    });

    it('refuse plus de 10 puits', async () => {
      expect(await errorsFor({ boardSize: 10, pitCount: 11 })).toContain(
        'pitCount must not be greater than 10',
      );
    });

    it('refuse 0 fleches', async () => {
      expect(await errorsFor({ arrows: 0 })).toContain('arrows must not be less than 1');
    });

    it('refuse plus de 5 fleches', async () => {
      expect(await errorsFor({ arrows: 6 })).toContain('arrows must not be greater than 5');
    });

    it('refuse les valeurs non entières', async () => {
      expect(await errorsFor({ boardSize: 4.5 })).toContain('boardSize must be an integer number');
      expect(await errorsFor({ arrows: 'deux' })).toContain('arrows must be an integer number');
    });
  });

  describe('règle croisée : les puits doivent tenir dans la grotte', () => {
    it('refuse 7 puits dans une grotte de 3x3 (6 cases libres)', async () => {
      const errors = await errorsFor({ boardSize: 3, pitCount: 7 });
      expect(errors).toContain(
        "pitCount ne peut pas dépasser 6 pour une grotte de 3x3 : la sortie, le Wumpus et l'or occupent 3 cases.",
      );
    });

    it('refuse 10 puits dans une grotte de 3x3', async () => {
      expect(await errorsFor({ boardSize: 3, pitCount: 10 })).toHaveLength(1);
    });

    it('accepte 6 puits dans une grotte de 3x3', async () => {
      expect(await errorsFor({ boardSize: 3, pitCount: 6 })).toEqual([]);
    });

    it('tient compte de la taille de grotte fournie', async () => {
      // 7 puits ne tiennent pas dans 3x3 (6 max) mais tiennent dans 4x4 (10 max).
      expect(await errorsFor({ boardSize: 3, pitCount: 7 })).toHaveLength(1);
      expect(await errorsFor({ boardSize: 4, pitCount: 7 })).toEqual([]);
      // 4x4 ferait 13 cases disponibles : c'est MAX_PIT_COUNT (10) qui limite.
      expect(maxPitCountFor(4)).toBe(10);
    });

    it("n'échoue pas quand pitCount est absent (la valeur par défaut tient toujours)", async () => {
      expect(await errorsFor({ boardSize: 3 })).toEqual([]);
    });
  });
});
