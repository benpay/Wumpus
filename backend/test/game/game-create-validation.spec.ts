import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { GameController } from '../../src/game/game.controller.js';
import { GameService } from '../../src/game/game.service.js';
import { GameStateDto } from '../../src/game/dto/game-state.dto.js';
import { GameStatus } from '../../src/game/domain/enums/game-status.enum.js';
import { Direction } from '../../src/game/domain/enums/direction.enum.js';

/**
 * Verifie que le ValidationPipe global (voir src/main.ts) rejette les parties
 * avec un 400 avant d'atteindre le service.
 */
describe('POST /games (validation)', () => {
  let app: INestApplication<App>;
  const createGame = vi.fn().mockImplementation(
    (): GameStateDto => ({
      gameId: 'game-1',
      boardSize: 4,
      status: GameStatus.PLAYING,
      perceptions: [],
      playerState: {
        position: { x: 0, y: 0 },
        direction: Direction.NORTH,
        arrowsRemaining: 1,
        hasGold: false,
        isAlive: true,
        canShoot: true,
      },
      message: '',
      turns: 0,
      visitedPositions: [],
      logs: [],
    }),
  );

  beforeEach(async () => {
    createGame.mockClear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [{ provide: GameService, useValue: { createGame } }],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mêmes options que dans main.ts
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepte un corps vide et crée la partie', async () => {
    const response = await request(app.getHttpServer())
      .post('/games')
      .send({})
      .expect(201);
    expect(response.body.gameId).toBe('game-1');
    expect(createGame).toHaveBeenCalledWith({});
  });

  it('accepte une configuration valide', async () => {
    await request(app.getHttpServer())
      .post('/games')
      .send({ boardSize: 5, pitCount: 3, arrows: 2 })
      .expect(201);
    expect(createGame).toHaveBeenCalledWith({ boardSize: 5, pitCount: 3, arrows: 2 });
  });

  describe('rejet avec 400', () => {
    it('grotte hors limites', async () => {
      for (const boardSize of [2, 11]) {
        const response = await request(app.getHttpServer())
          .post('/games')
          .send({ boardSize })
          .expect(400);
        expect(response.body.message).toEqual(
          expect.arrayContaining([expect.stringContaining('boardSize')]),
        );
      }
    });

    it('puits hors limites', async () => {
      const response = await request(app.getHttpServer())
        .post('/games')
        .send({ pitCount: 0 })
        .expect(400);
      expect(response.body.message).toContain('pitCount must not be less than 1');
    });

    it('puits qui ne tiennent pas dans la grotte', async () => {
      const response = await request(app.getHttpServer())
        .post('/games')
        .send({ boardSize: 3, pitCount: 7 })
        .expect(400);
      expect(response.body.message).toEqual([
        expect.stringContaining("la sortie, le Wumpus et l'or occupent 3 cases"),
      ]);
    });

    it('fleches hors limites', async () => {
      const response = await request(app.getHttpServer())
        .post('/games')
        .send({ arrows: 6 })
        .expect(400);
      expect(response.body.message).toContain('arrows must not be greater than 5');
    });

    it('type incorrect', async () => {
      await request(app.getHttpServer())
        .post('/games')
        .send({ boardSize: 'cinq' })
        .expect(400);
    });

    it('propriété inconnue', async () => {
      const response = await request(app.getHttpServer())
        .post('/games')
        .send({ taille: 4 })
        .expect(400);
      expect(response.body.message).toContain('property taille should not exist');
    });

    it('n\'atteint jamais le service', () => {
      expect(createGame).not.toHaveBeenCalled();
    });
  });
});
