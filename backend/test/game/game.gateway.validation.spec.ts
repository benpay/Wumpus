import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { GameController } from '../../src/game/game.controller.js';
import { GameGateway } from '../../src/game/game.gateway.js';
import { GamePresenter } from '../../src/game/game.presenter.js';
import { GameService } from '../../src/game/game.service.js';
import { PersistenceService } from '../../src/persistence/persistence.service.js';

/**
 * El ValidationPipe global tambien se aplica al @MessageBody() del gateway.
 * Si GameActionDto no estuviera decorado, `whitelist` lo vaciaria y el juego
 * se quedaria congelado sin avisar. Este test es el que lo detecta.
 */
describe('GameGateway (validation du payload WebSocket)', () => {
  let app: INestApplication;
  let socket: Socket;
  let port: number;
  const persistence = {
    saveGameRecord: vi.fn().mockResolvedValue(undefined),
    getGameHistory: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        GameGateway,
        GameService,
        GamePresenter,
        { provide: PersistenceService, useValue: persistence },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.listen(0);
    port = app.getHttpServer().address().port;

    socket = io(`http://localhost:${port}`, { transports: ['websocket'] });
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', reject);
    });
  });

  afterEach(async () => {
    socket.disconnect();
    await app.close();
  });

  const nextUpdate = (timeout = 3000) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout esperando gameStateUpdate')), timeout);
      socket.once('gameStateUpdate', (state) => {
        clearTimeout(timer);
        resolve(state as Record<string, unknown>);
      });
    });

  const createGame = async (): Promise<string> => {
    const response = await fetch(`http://localhost:${port}/games`, { method: 'POST' });
    return ((await response.json()) as { gameId: string }).gameId;
  };

  it('aplica la acción y emite el estado completo', async () => {
    const gameId = await createGame();
    const pending = nextUpdate();
    socket.emit('gameAction', { gameId, action: 'ADVANCE' });
    const state = await pending;

    expect(state['gameId']).toBe(gameId);
    expect(state['turns']).toBe(1);
    expect(state).toHaveProperty('playerState');
  });

  it('rechaza un gameId que no es un UUID sin tocar el estado', async () => {
    const pending = nextUpdate(1000);
    socket.emit('gameAction', { gameId: 'no-es-un-uuid', action: 'ADVANCE' });
    await expect(pending).rejects.toThrow('timeout');
  });

  it('rechaza una acción desconocida', async () => {
    const gameId = await createGame();
    const pending = nextUpdate(1000);
    socket.emit('gameAction', { gameId, action: 'DANZAR' });
    await expect(pending).rejects.toThrow('timeout');
  });

  it('rechaza un payload con propiedades de más', async () => {
    const gameId = await createGame();
    const pending = nextUpdate(1000);
    socket.emit('gameAction', { gameId, action: 'ADVANCE', trampa: true });
    await expect(pending).rejects.toThrow('timeout');
  });

  it('sigue aceptando la acción válida tras un payload inválido', async () => {
    const gameId = await createGame();
    socket.emit('gameAction', { gameId, action: 'INVALID' });
    await new Promise((r) => setTimeout(r, 200));

    const pending = nextUpdate();
    socket.emit('gameAction', { gameId, action: 'ROTATE_LEFT' });
    const state = await pending;
    expect(state['gameId']).toBe(gameId);
  });
});
