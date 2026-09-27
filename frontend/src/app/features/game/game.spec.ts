import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
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
  let gameStatePush: Subject<GameState>;
  let connectionError: ReturnType<typeof signal<string | null>>;

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
      startPosition: { x: 0, y: 0 },
      wumpusKilled: false,
      ...overrides,
    }) as GameState;

  beforeEach(async () => {
    gameStatePush = new Subject<GameState>();
    connectionError = signal<string | null>(null);
    createGame = vi.fn().mockReturnValue(of(state({ gameId: 'game-2' })));
    getGame = vi.fn().mockReturnValue(of(state()));
    sendAction = vi.fn();
    routerNavigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        { provide: GameApiService, useValue: { createGame, getGame } },
        {
          provide: GameWsService,
          useValue: {
            gameState$: gameStatePush.asObservable(),
            gameError$: new Subject<string>().asObservable(),
            isConnected: signal(true),
            connectionError,
            sendAction,
          },
        },
        { provide: Router, useValue: { navigate: routerNavigate } },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'game-1' })) },
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
    it('réutilise la configuration de la partie en cours', () => {
      const game = component();
      game.gameState.set(state({ boardSize: 6, pitCount: 4, arrows: 5 }));

      game.newGame();

      expect(createGame).toHaveBeenCalledWith({ boardSize: 6, pitCount: 4, arrows: 5 });
    });

    it('navigue vers la nouvelle partie', () => {
      const game = component();
      game.gameState.set(state());

      game.newGame();

      expect(routerNavigate).toHaveBeenCalledWith(['/game', 'game-2'], expect.anything());
    });

    it('utilise la configuration par défaut si aucune partie n\'est chargée', () => {
      const game = component();
      game.gameState.set(null);

      game.newGame();

      expect(createGame).toHaveBeenCalledWith({ boardSize: 4, pitCount: 2, arrows: 1 });
    });

    it('affiche une erreur si la création de la partie échoue', () => {
      createGame.mockReturnValue(throwError(() => new Error('boom')));
      const game = component();
      game.gameState.set(state());

      game.newGame();

      expect(game.error()).toBe("La partie n'a pas pu être créée.");
      expect(routerNavigate).not.toHaveBeenCalled();
    });
  });

  describe('acciones', () => {
    it('envoie l\'action tant que la partie est en cours', () => {
      const game = component();
      game.gameState.set(state({ status: GameStatus.PLAYING }));

      game.onActionSelected(Action.ORIENT_NORTH);

      expect(sendAction).toHaveBeenCalledWith('game-1', Action.ORIENT_NORTH);
    });

    it('n\'envoie aucune action si la partie est terminée', () => {
      const game = component();
      game.gameState.set(state({ status: GameStatus.WON }));

      game.onActionSelected(Action.ORIENT_NORTH);

      expect(sendAction).not.toHaveBeenCalled();
    });
  });

  describe('efectos', () => {
    it('déclenche l\'éclat doré quand l\'or est ramassé', () => {
      const game = component();
      expect(game.goldFlash()).toBe(false);

      gameStatePush.next(
        state({ playerState: { ...state().playerState, hasGold: true } }),
      );

      expect(game.goldFlash()).toBe(true);
    });

    it('ne déclenche pas l\'éclat si l\'or était déjà ramassé avant la mise à jour', () => {
      const conOro = state({ playerState: { ...state().playerState, hasGold: true } });
      getGame.mockReturnValue(of(conOro));
      const game = component();

      gameStatePush.next(state({ ...conOro, turns: 1 }));

      expect(game.goldFlash()).toBe(false);
    });

    it('ne rejoue pas l\'éclat au chargement d\'une partie qui a déjà l\'or', () => {
      getGame.mockReturnValue(
        of(state({ playerState: { ...state().playerState, hasGold: true } })),
      );
      const game = component();

      expect(game.goldFlash()).toBe(false);
    });

    it('dispara la alarma al matar al Wumpus', () => {
      const game = component();
      expect(game.wumpusFlash()).toBe(false);

      gameStatePush.next(state({ wumpusKilled: true }));

      expect(game.wumpusFlash()).toBe(true);
      expect(game.goldFlash()).toBe(false);
    });
  });

  describe('errores de conexión', () => {
    it('affiche le motif de l\'échec de connexion', () => {
      const game = component();
      expect(game.displayedError()).toBeNull();

      connectionError.set('Erreur de connexion au serveur : timeout');

      expect(game.displayedError()).toBe('Erreur de connexion au serveur : timeout');
    });
  });
});
