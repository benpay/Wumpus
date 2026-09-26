import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GameComponent } from './game';
import { GameApiService } from '../../core/services/game-api.service';
import { GameWsService } from '../../core/services/game-ws.service';
import { GameState } from '../../core/models/game-state.model';
import { Action, Direction, GameStatus } from '../../core/models/enums';

describe('GameComponent', () => {
  let createGame: ReturnType<typeof vi.fn>;
  let getGame: ReturnType<typeof vi.fn>;
  let sendAction: ReturnType<typeof vi.fn>;
  let routerNavigate: ReturnType<typeof vi.fn>;

  const state = (overrides: Partial<GameState> = {}): GameState =>
    ({
      gameId: 'game-1',
      status: GameStatus.PLAYING,
      perceptions: [],
      playerState: {
        position: { x: 0, y: 0 },
        direction: Direction.NORTH,
        arrows: 2,
        hasGold: false,
      },
      turns: 0,
      visitedPositions: [],
      boardSize: 4,
      pitCount: 2,
      arrows: 1,
      message: 'La partie commence',
      logs: [],
      ...overrides,
    }) as GameState;

  beforeEach(async () => {
    createGame = vi.fn().mockReturnValue(of(state({ gameId: 'game-2' })));
    getGame = vi.fn().mockReturnValue(of(state()));
    sendAction = vi.fn();
    routerNavigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        {
          provide: GameApiService,
          useValue: { createGame, getGame, sendAction },
        },
        {
          provide: GameWsService,
          useValue: { gameState$: of(state()), sendAction },
        },
        { provide: Router, useValue: { navigate: routerNavigate } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'game-1' }) },
            paramMap: of(convertToParamMap({ id: 'game-1' })),
          },
        },
      ],
    }).compileComponents();
  });

  const component = () => {
    const fixture = TestBed.createComponent(GameComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  describe('newGame', () => {
    it('reutiliza la configuración de la partida actual', () => {
      const game = component();
      game.gameState = state({ boardSize: 6, pitCount: 4, arrows: 5 });

      game.newGame();

      expect(createGame).toHaveBeenCalledWith({ boardSize: 6, pitCount: 4, arrows: 5 });
    });

    it('navega a la nueva partida', () => {
      const game = component();
      game.gameState = state();

      game.newGame();

      expect(routerNavigate).toHaveBeenCalledWith(
        ['/game', 'game-2'],
        expect.objectContaining({ state: expect.anything() }),
      );
    });

    it('usa la configuración por defecto si no hay partida cargada', () => {
      const game = component();
      game.gameState = null;

      game.newGame();

      expect(createGame).toHaveBeenCalledWith({ boardSize: 4, pitCount: 2, arrows: 1 });
    });

    it('muestra un error si no puede crear la partida', () => {
      createGame.mockReturnValue(throwError(() => new Error('boom')));
      const game = component();
      game.gameState = state();

      game.newGame();

      expect(game.error).toBe("La partie n'a pas pu être créée.");
      expect(routerNavigate).not.toHaveBeenCalled();
    });
  });

  describe('acciones', () => {
    it('no envía acciones si la partida ya terminó', () => {
      const game = component();
      game.gameState = state({ status: GameStatus.WON });

      game.onActionSelected(Action.MOVE_NORTH);

      expect(sendAction).not.toHaveBeenCalled();
    });
  });
});
