import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HomeComponent } from './home';
import { GameApiService } from '../../core/services/game-api.service';
import { GameState } from '../../core/models/game-state.model';

describe('HomeComponent', () => {
  let createGame: ReturnType<typeof vi.fn>;
  let getGameHistory: ReturnType<typeof vi.fn>;
  let routerNavigate: ReturnType<typeof vi.fn>;

  const state = { gameId: 'game-1' } as GameState;

  beforeEach(async () => {
    createGame = vi.fn().mockReturnValue(of(state));
    getGameHistory = vi.fn().mockReturnValue(of([]));
    routerNavigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: GameApiService, useValue: { createGame, getGameHistory } },
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    }).compileComponents();
  });

  const component = () => TestBed.createComponent(HomeComponent).componentInstance;

  describe('configuration', () => {
    it('a la configuration por defecto del backend', () => {
      const home = component();
      expect(home.config).toEqual({ boardSize: 4, pitCount: 2, arrows: 1 });
      expect(home.canStartGame).toBe(true);
    });

    it('bloquea el botón si la configuración es inválida', () => {
      const home = component();
      home.arrows = 9;
      expect(home.canStartGame).toBe(false);
      expect(home.configErrors[0]).toContain('entre 1 et 5');
    });

    it('bloquea 7 gouffres en 3x3', () => {
      const home = component();
      home.boardSize = 3;
      home.pitCount = 7;
      expect(home.canStartGame).toBe(false);
    });
  });

  describe('startGame', () => {
    it('crea la partida y navega cuando la configuración es válida', () => {
      const home = component();
      home.startGame();

      expect(createGame).toHaveBeenCalledWith({ boardSize: 4, pitCount: 2, arrows: 1 });
      expect(routerNavigate).toHaveBeenCalledWith(['/game', 'game-1']);
      expect(home.errorMessage).toBeNull();
    });

    it('no llama a la API si la configuración es inválida', () => {
      const home = component();
      home.boardSize = 2;
      home.startGame();

      expect(createGame).not.toHaveBeenCalled();
      expect(routerNavigate).not.toHaveBeenCalled();
      expect(home.errorMessage).toContain('entre 3 et 10');
    });

    it('muestra el mensaje del 400 del backend', () => {
      createGame.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: ['boardSize must not be less than 3'] },
            }),
        ),
      );
      const home = component();
      home.startGame();

      expect(home.errorMessage).toBe('boardSize must not be less than 3');
      expect(home.creatingGame).toBe(false);
      expect(routerNavigate).not.toHaveBeenCalled();
    });

    it('avisa si el backend está apagado', () => {
      createGame.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 0 })),
      );
      const home = component();
      home.startGame();

      expect(home.errorMessage).toContain('backend');
    });
  });

  describe('historique', () => {
    it('affiche l\'historique renvoyé par l\'API', () => {
      getGameHistory.mockReturnValue(
        of([{ id: 'a', status: 'WON', turns: 12 } as never]),
      );
      const home = component();
      home.ngOnInit();

      expect(home.loadingHistory).toBe(false);
      expect(home.history).toHaveLength(1);
    });

    it('no bloquea l\'écran si l\'historique échoue', () => {
      getGameHistory.mockReturnValue(throwError(() => new Error('db down')));
      const home = component();
      home.ngOnInit();

      expect(home.loadingHistory).toBe(false);
      expect(home.history).toEqual([]);
    });
  });
});
