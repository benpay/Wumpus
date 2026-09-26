import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Action } from '../../src/game/domain/enums/action.enum.js';
import { GameStatus } from '../../src/game/domain/enums/game-status.enum.js';
import { GamePresenter } from '../../src/game/game.presenter.js';
import { GameService } from '../../src/game/game.service.js';
import { PersistenceService } from '../../src/persistence/persistence.service.js';

describe('GameService', () => {
  let service: GameService;

  const mockPersistenceService = {
    saveGameRecord: vi.fn().mockResolvedValue({}),
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        GamePresenter,
        {
          provide: PersistenceService,
          useValue: mockPersistenceService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new game with default parameters', () => {
    const res = service.createGame({});

    expect(res.gameId).toBeDefined();
    expect(res.status).toBe(GameStatus.PLAYING);
    expect(res.boardSize).toBe(4);
    expect(res.turns).toBe(0);
    expect(res.message).toContain('La partie commence');
  });

  it('should expose the game state through getGameState', () => {
    const created = service.createGame({ boardSize: 5 });
    const state = service.getGameState(created.gameId);

    expect(state.gameId).toBe(created.gameId);
    expect(state.boardSize).toBe(5);
    expect(state.playerState.position).toEqual(created.playerState.position);
  });

  it('should retrieve a created game by ID', () => {
    const created = service.createGame({ boardSize: 5 });
    const game = service.getGame(created.gameId);

    expect(game).toBeDefined();
    expect(game.board.size).toBe(5);
  });

  it('should throw NotFoundException for non-existent game ID', () => {
    expect(() => service.getGame('invalid-id')).toThrow(NotFoundException);
  });

  it('should execute an action and persist game record if finished', async () => {
    const created = service.createGame({});
    const game = service.getGame(created.gameId);

    // Force le jeu en état de LOST
    game.status = GameStatus.LOST;

    const res = await service.executeAction({
      gameId: created.gameId,
      action: Action.ADVANCE,
    });

    expect(res.status).toBe(GameStatus.LOST);
    expect(mockPersistenceService.saveGameRecord).toHaveBeenCalledWith(game);
  });
});
