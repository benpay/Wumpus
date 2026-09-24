import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { Action } from '../../src/game/domain/enums/action.enum.js';
import { GameStatus } from '../../src/game/domain/enums/game-status.enum.js';
import { GameGateway } from '../../src/game/game.gateway.js';
import { GameService } from '../../src/game/game.service.js';

describe('GameGateway', () => {
  let gateway: GameGateway;
  let service: GameService;

  const mockActionResult = {
    status: GameStatus.PLAYING,
    perceptions: [],
    playerState: { position: { x: 0, y: 1 }, direction: 'NORTH', arrows: 1, hasGold: false },
    message: 'Avanzaste',
    turns: 1,
    visitedPositions: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  };

  const mockGameService = {
    executeAction: vi.fn().mockResolvedValue(mockActionResult),
  };

  const mockClientSocket = {
    emit: vi.fn(),
  } as unknown as Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: GameService,
          useValue: mockGameService,
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should handle game action and emit update to client', async () => {
    const dto = { gameId: 'game-123', action: Action.ADVANCE };
    const res = await gateway.handleGameAction(dto, mockClientSocket);

    expect(service.executeAction).toHaveBeenCalledWith(dto);
    expect(mockClientSocket.emit).toHaveBeenCalledWith('gameStateUpdate', mockActionResult);
    expect(res).toEqual(mockActionResult);
  });
});
