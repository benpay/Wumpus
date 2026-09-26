import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Action, GameStatus } from '../../core/models/enums';
import { GameState } from '../../core/models/game-state.model';
import { GameApiService } from '../../core/services/game-api.service';
import { GameWsService } from '../../core/services/game-ws.service';
import { BoardComponent } from './components/board/board';
import { ControlsComponent } from './components/controls/controls';
import { LogComponent } from './components/log/log';

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

  readonly GameStatus = GameStatus;

  private subscription = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameApiService: GameApiService,
    private readonly gameWsService: GameWsService,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }
    this.gameId = id;

    // Charger l'état initial via REST
    this.gameApiService.getGame(this.gameId).subscribe({
      next: (state) => {
        this.gameState = state;
        this.loading = false;
      },
      error: () => {
        this.error = "La partie n'a pas pu être chargée.";
        this.loading = false;
      },
    });

    // Souscrire aux mises à jour WebSocket
    this.subscription.add(
      this.gameWsService.gameState$.subscribe((updatedState) => {
        if (updatedState.gameId === this.gameId) {
          this.gameState = updatedState;
        }
      }),
    );
  }

  onActionSelected(action: Action): void {
    if (this.gameId && this.gameState?.status === GameStatus.PLAYING) {
      this.gameWsService.sendAction(this.gameId, action);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  newGame(): void {
    this.gameApiService
      .createGame({
        boardSize: this.gameState?.boardSize ?? 4,
        pitCount: 2,
        arrows: 1,
      })
      .subscribe((state) => {
        this.router.navigate(['/game', state.gameId]);
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
