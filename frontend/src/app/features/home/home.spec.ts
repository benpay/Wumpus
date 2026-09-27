import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HomeComponent } from './home';
import { GameApiService } from '../../core/services/game-api.service';
import { GameState } from '../../core/models/game-state.model';

describe('HomeComponent', () => {
  let createGame: jasmine.Spy;
  let getGameHistory: jasmine.Spy;
  let routerNavigate: jasmine.Spy;

  const state = { gameId: 'game-1' } as GameState;

  beforeEach(async () => {
    createGame = jasmine.createSpy().and.returnValue(of(state));
    getGameHistory = jasmine.createSpy().and.returnValue(of([]));
    routerNavigate = jasmine.createSpy();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: GameApiService, useValue: { createGame, getGameHistory } },
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    }).compileComponents();
  });

  const component = () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  describe('configuration', () => {
    it('utilise la configuration par défaut du backend', () => {
      const home = component();
      expect(home.config).toEqual({ boardSize: 4, pitCount: 2, arrows: 1 });
      expect(home.canStartGame).toBe(true);
    });

    it('bloque le bouton si la configuration est invalide', () => {
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
    it('crée la partie et navigue quand la configuration est valide', () => {
      const home = component();
      home.startGame();

      expect(createGame).toHaveBeenCalledWith({ boardSize: 4, pitCount: 2, arrows: 1 });
      expect(routerNavigate).toHaveBeenCalledWith(
        ['/game', 'game-1'],
        jasmine.objectContaining({ state: jasmine.anything() }),
      );
      expect(home.errorMessage()).toBeNull();
      expect(home.creatingGame()).toBe(false);
    });

    it('n\'appelle pas l\'API si la configuration est invalide', () => {
      const home = component();
      home.boardSize = 2;
      home.startGame();

      expect(createGame).not.toHaveBeenCalled();
      expect(routerNavigate).not.toHaveBeenCalled();
      expect(home.errorMessage()).toContain('entre 3 et 10');
    });

    it('affiche le message du 400 renvoyé par le backend', () => {
      createGame.and.returnValue(
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

      expect(home.errorMessage()).toBe('boardSize must not be less than 3');
      expect(home.creatingGame()).toBe(false);
      expect(routerNavigate).not.toHaveBeenCalled();
    });

    it('avis si le backend est indisponible', () => {
      createGame.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
      const home = component();
      home.startGame();

      expect(home.errorMessage()).toContain('backend');
    });
  });

  describe('historique', () => {
    it('affiche l\'historique renvoyé par l\'API', () => {
      getGameHistory.and.returnValue(
        of([{ id: 'a', status: 'WON', turns: 12 } as never]),
      );
      const home = component();

      expect(home.loadingHistory()).toBe(false);
      expect(home.history()).toHaveSize(1);
    });

    it('ne bloque pas l\'écran si l\'historique échoue', () => {
      getGameHistory.and.returnValue(throwError(() => new Error('db down')));
      const home = component();

      expect(home.loadingHistory()).toBe(false);
      expect(home.history()).toEqual([]);
    });
  });
});
