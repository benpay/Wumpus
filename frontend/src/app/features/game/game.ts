import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Action, GameStatus } from '../../core/models/enums';
import { GameConfig } from '../../core/models/game-config.model';
import {
  DEFAULT_ARROWS,
  DEFAULT_BOARD_SIZE,
  DEFAULT_PIT_COUNT,
} from '../../core/models/game-rules';
import { GameState } from '../../core/models/game-state.model';
import { GameApiService } from '../../core/services/game-api.service';
import { GameWsService } from '../../core/services/game-ws.service';
import { BoardComponent } from './components/board/board';
import { ControlsComponent } from './components/controls/controls';
import { LogComponent } from './components/log/log';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, BoardComponent, ControlsComponent, LogComponent],
  templateUrl: './game.html',
  styleUrls: ['./game.css'],
})
export class GameComponent implements OnInit, OnDestroy {
  gameId!: string;
  gameState: GameState | null = null;
  loading: boolean = true;
  error: string | null = null;
  isConnected: boolean = true;
  wsError: string | null = null;
  /** Declenche le destello dore quand le joueur vient de ramasser l'or. */
  goldFlash: boolean = false;
  wumpusFlash: boolean = false;

  readonly GameStatus = GameStatus;

  private subscription = new Subscription();
  private goldFlashTimeout?: ReturnType<typeof setTimeout>;
  private wumpusFlashTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameApiService: GameApiService,
    private readonly gameWsService: GameWsService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // 1. Écouter les changements de paramètres dans l'URL (/game/:id)
    this.subscription.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (!id) {
          this.router.navigate(['/']);
          return;
        }
        if (id !== this.gameId) {
          this.loadGameById(id);
        }
      }),
    );

    // 2. Souscrire aux mises à jour WebSocket
    this.subscription.add(
      this.gameWsService.gameState$.subscribe((updatedState) => {
        if (updatedState.gameId === this.gameId) {
          this.applyState(updatedState);
        }
      }),
    );

    // 3. Suivi de l'état de la connexion WebSocket
    this.subscription.add(
      this.gameWsService.isConnected$.subscribe((connected) => {
        this.isConnected = connected;
      }),
    );

    // 4. Erreurs en provenance du WebSocket
    this.subscription.add(
      this.gameWsService.gameError$.subscribe((errMsg) => {
        this.wsError = errMsg;
        setTimeout(() => {
          if (this.wsError === errMsg) {
            this.wsError = null;
          }
        }, 5000);
      }),
    );
  }

  private loadGameById(id: string): void {
    this.gameId = id;
    this.loading = true;
    this.error = null;

    // Récupérer l'état initial via le state de navigation s'il existe
    const stateFromHistory = history.state?.['gameState'];
    if (stateFromHistory && stateFromHistory.gameId === this.gameId) {
      this.applyState(stateFromHistory);
    } else {
      this.gameState = null;
    }

    // Charger/rafraîchir via REST
    this.gameApiService.getGame(this.gameId).subscribe({
      next: (state) => {
        this.applyState(state);
      },
      error: () => {
        if (!this.gameState) {
          this.error = "La partie n'a pas pu être chargée.";
        }
        this.loading = false;
        this.cdr.detectChanges(); // Forcer Angular à détecter le changement et à mettre à jour la vue.
      },
    });
  }

  /**
   * Point d'entrée unique pour tout nouvel état du jeu. Centraliser l'affectation
   * garantit que la détection du ramassage d'or fonctionne aussi bien via REST
   * que via WebSocket.
   */
  private applyState(state: GameState): void {
    const hadGold = this.gameState?.playerState.hasGold ?? false;
    const hadKilledWumpus = this.gameState?.wumpusKilled ?? false;
    this.gameState = state;
    this.loading = false;

    if (!hadGold && state.playerState.hasGold) {
      this.triggerGoldFlash();
    }
    if (!hadKilledWumpus && state.wumpusKilled) {
      this.triggerWumpusFlash();
    }

    this.cdr.detectChanges(); // Forcer Angular à détecter le changement et à mettre à jour la vue.
  }

  private triggerGoldFlash(): void {
    this.goldFlash = true;
    if (this.goldFlashTimeout) {
      clearTimeout(this.goldFlashTimeout);
    }
    this.goldFlashTimeout = setTimeout(() => {
      this.goldFlash = false;
      this.cdr.detectChanges();
    }, 1600);
  }

  /**
   * Effet d'alarme pour la mort du Wumpus
   */
  private triggerWumpusFlash(): void {
    this.wumpusFlash = true;
    if (this.wumpusFlashTimeout) {
      clearTimeout(this.wumpusFlashTimeout);
    }
    this.wumpusFlashTimeout = setTimeout(() => {
      this.wumpusFlash = false;
      this.cdr.detectChanges();
    }, 1100);
  }

  onActionSelected(action: Action): void {
    if (this.gameId && this.gameState?.status === GameStatus.PLAYING) {
      this.gameWsService.sendAction(this.gameId, action);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Nouvelle partie avec la meme configuration. L'etat de jeu expose desormais
   * pitCount et arrows, donc on peut rejouer exactement la meme grotte.
   */
  newGame(): void {
    const config: GameConfig = {
      boardSize: this.gameState?.boardSize ?? DEFAULT_BOARD_SIZE,
      pitCount: this.gameState?.pitCount ?? DEFAULT_PIT_COUNT,
      arrows: this.gameState?.arrows ?? DEFAULT_ARROWS,
    };
    this.gameApiService.createGame(config).subscribe({
      next: (state) => {
        this.gameId = state.gameId;
        this.error = null;
        this.applyState(state);
        this.router.navigate(['/game', state.gameId], { state: { gameState: state } });
      },
      error: () => {
        this.error = "La partie n'a pas pu être créée.";
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.goldFlashTimeout) {
      clearTimeout(this.goldFlashTimeout);
    }
    if (this.wumpusFlashTimeout) {
      clearTimeout(this.wumpusFlashTimeout);
    }
  }
}
