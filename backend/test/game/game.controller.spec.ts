import { Test, TestingModule } from '@nestjs/testing';
import { GameStatus } from '../../src/game/domain/enums/game-status.enum.js';
import { GameController } from '../../src/game/game.controller.js';
import { GameService } from '../../src/game/game.service.js';

describe('GameController', () => {
  let controller: GameController;
  let service: GameService;

  const mockGameService = {
    createGame: vi.fn().mockReturnValue({
      gameId: 'game-123',
      status: GameStatus.PLAYING,
      perceptions: [],
      playerState: { position: { x: 0, y: 0 } },
      turns: 0,
      visitedPositions: [{ x: 0, y: 0 }],
      boardSize: 4,
      message: 'Comienza la partida',
    }),
    getGame: vi.fn().mockReturnValue({
      id: 'game-123',
      status: GameStatus.PLAYING,
      lastPerceptions: [],
      player: { position: { x: 0, y: 0 }, direction: 'NORTH', arrows: 1, hasGold: false },
      turns: 0,
      visitedPositions: [{ x: 0, y: 0 }],
      board: { size: 4 },
      logs: ['Log 1'],
    }),
    getGameHistory: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: mockGameService,
        },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a game', () => {
    const res = controller.createGame({ boardSize: 4 });
    expect(service.createGame).toHaveBeenCalledWith({ boardSize: 4 });
    expect(res.gameId).toBe('game-123');
  });

  it('should get game details by ID', () => {
    const res = controller.getGame('game-123');
    expect(service.getGame).toHaveBeenCalledWith('game-123');
    expect(res.gameId).toBe('game-123');
  });

  it('should return history from service', async () => {
    const res = await controller.getHistory();
    expect(service.getGameHistory).toHaveBeenCalled();
    expect(res).toEqual([]);
  });
});
