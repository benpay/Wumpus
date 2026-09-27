import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
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

const GOLD_FLASH_MS = 1600;
const WUMPUS_FLASH_MS = 1100;
const WS_ERROR_MS = 5000;

type FlashKind = 'gold' | 'wumpus';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, BoardComponent, ControlsComponent, LogComponent],
  templateUrl: './game.html',
  styleUrls: ['./game.css'],
})
export class GameComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameApiService = inject(GameApiService);
  private readonly gameWsService = inject(GameWsService);

  private readonly gameId = signal<string | null>(null);
  readonly gameState = signal<GameState | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Déclenche l'éclat doré quand le joueur vient de ramasser l'or. */
  readonly goldFlash = signal(false);
  /** Déclenche l'effet d'alarme quand le joueur tue le Wumpus d'une flèche. */
  readonly wumpusFlash = signal(false);

  readonly isConnected = this.gameWsService.isConnected;

  readonly GameStatus = GameStatus;

  private readonly wsError = signal<string | null>(null);
  /** Erreur affichee dans le toast : une erreur de jeu prime sur une erreur de connexion. */
  readonly displayedError = computed<string | null>(
    () => this.wsError() ?? this.gameWsService.connectionError(),
  );

  private readonly timers: Partial<Record<FlashKind | 'wsError', ReturnType<typeof setTimeout>>> = {};

  constructor() {
    // 1. Écouter les changements de paramètres dans l'URL (/game/:id)
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/']);
        return;
      }
      if (id !== this.gameId()) {
        this.loadGameById(id);
      }
    });

    // 2. Souscrire aux mises à jour WebSocket
    this.gameWsService.gameState$
      .pipe(takeUntilDestroyed())
      .subscribe((updatedState) => {
        if (updatedState.gameId === this.gameId()) {
          this.applyState(updatedState);
        }
      });

    // 3. Erreurs en provenance du WebSocket
    this.gameWsService.gameError$
      .pipe(takeUntilDestroyed())
      .subscribe((message) => {
        this.wsError.set(message);
        this.scheduleReset('wsError', WS_ERROR_MS, () => this.wsError.set(null));
      });
  }

  /** Arme un one-shot : la cle est reprogrammée à chaque appel, jamais empilée. */
  private scheduleReset(
    kind: FlashKind | 'wsError',
    delayMs: number,
    apply: () => void,
  ): void {
    const pending = this.timers[kind];
    if (pending) {
      clearTimeout(pending);
    }
    this.timers[kind] = setTimeout(() => {
      apply();
      delete this.timers[kind];
    }, delayMs);
  }

  private loadGameById(id: string): void {
    this.gameId.set(id);
    this.loading.set(true);
    this.error.set(null);

    // Récupérer l'état initial via le state de navigation s'il existe
    const stateFromHistory = history.state?.['gameState'];
    if (stateFromHistory && stateFromHistory.gameId === id) {
      this.applyState(stateFromHistory);
    } else {
      this.gameState.set(null);
    }

    // Charger/rafraîchir via REST
    this.gameApiService.getGame(id).subscribe({
      next: (state) => this.applyState(state),
      error: () => {
        if (!this.gameState()) {
          this.error.set("La partie n'a pas pu être chargée.");
        }
        this.loading.set(false);
      },
    });
  }

  /**
   * Point d'entrée unique pour tout nouvel état du jeu. Centraliser l'affectation
   * garantit que les effets (or, mort du Wumpus) se déclenchent aussi bien via
   * REST que via WebSocket.
   */
  private applyState(state: GameState): void {
    const previous = this.gameState();
    this.gameState.set(state);
    this.loading.set(false);

    // Le tout premier etat est un affichage, pas un evenement: recharger une
    // partie ou la restaurer depuis l'historique ne doit pas rejouer les effets.
    if (previous === null) return;

    if (!previous.playerState.hasGold && state.playerState.hasGold) {
      this.triggerFlash('gold', GOLD_FLASH_MS);
    }
    if (!previous.wumpusKilled && state.wumpusKilled) {
      this.triggerFlash('wumpus', WUMPUS_FLASH_MS);
    }
  }

  private triggerFlash(kind: FlashKind, durationMs: number): void {
    const target = kind === 'gold' ? this.goldFlash : this.wumpusFlash;
    target.set(true);
    this.scheduleReset(kind, durationMs, () => target.set(false));
  }

  onActionSelected(action: Action): void {
    const id = this.gameId();
    if (id && this.gameState()?.status === GameStatus.PLAYING) {
      this.gameWsService.sendAction(id, action);
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
    const state = this.gameState();
    const config: GameConfig = {
      boardSize: state?.boardSize ?? DEFAULT_BOARD_SIZE,
      pitCount: state?.pitCount ?? DEFAULT_PIT_COUNT,
      arrows: state?.arrows ?? DEFAULT_ARROWS,
    };
    this.gameApiService.createGame(config).subscribe({
      next: (created) => {
        this.error.set(null);
        this.applyState(created);
        this.gameId.set(created.gameId);
        this.router.navigate(['/game', created.gameId], { state: { gameState: created } });
      },
      error: () => this.error.set("La partie n'a pas pu être créée."),
    });
  }

  ngOnDestroy(): void {
    for (const pending of Object.values(this.timers)) {
      if (pending) {
        clearTimeout(pending);
      }
    }
  }
}
