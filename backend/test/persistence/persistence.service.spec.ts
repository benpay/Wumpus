import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../../src/game/domain/entities/game.entity.js';
import { Direction } from '../../src/game/domain/enums/direction.enum.js';
import { GameStatus } from '../../src/game/domain/enums/game-status.enum.js';
import { GameRecord } from '../../src/persistence/entities/game-record.entity.js';
import { PersistenceService } from '../../src/persistence/persistence.service.js';

describe('PersistenceService', () => {
  let service: PersistenceService;
  let repository: Repository<GameRecord>;

  const mockGameRecord: GameRecord = {
    id: 'test-uuid-1',
    boardSize: 4,
    pitCount: 2,
    arrowsCount: 1,
    status: GameStatus.WON,
    turns: 5,
    hasGold: true,
    wumpusKilled: true,
    logs: ['Turn 1...', 'Turn 2...'],
    createdAt: new Date(),
  };

  const mockRepository = {
    create: vi.fn().mockImplementation((dto) => dto),
    save: vi.fn().mockResolvedValue(mockGameRecord),
    find: vi.fn().mockResolvedValue([mockGameRecord]),
    findOne: vi.fn().mockResolvedValue(mockGameRecord),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistenceService,
        {
          provide: getRepositoryToken(GameRecord),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PersistenceService>(PersistenceService);
    repository = module.get<Repository<GameRecord>>(getRepositoryToken(GameRecord));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save a finished game record', async () => {
    const game = new Game({
      id: 'test-uuid-1',
      boardConfig: {
        size: 4,
        wumpusPosition: { x: 0, y: 2 },
        goldPosition: { x: 1, y: 1 },
        pits: [{ x: 2, y: 0 }],
      },
      playerConfig: {
        initialPosition: { x: 0, y: 0 },
        initialDirection: Direction.NORTH,
        arrows: 1,
      },
    });

    const result = await service.saveGameRecord(game);

    expect(repository.create).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result).toEqual(mockGameRecord);
  });

  it('should return all game records ordered', async () => {
    const records = await service.findAll();
    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(records).toEqual([mockGameRecord]);
  });

  it('should return a game record by ID', async () => {
    const record = await service.findById('test-uuid-1');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'test-uuid-1' },
    });
    expect(record).toEqual(mockGameRecord);
  });
});
