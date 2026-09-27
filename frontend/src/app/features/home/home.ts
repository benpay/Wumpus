import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { GameConfig } from '../../core/models/game-config.model';
import { GameStatus } from '../../core/models/enums';
import {
  DEFAULT_ARROWS,
  DEFAULT_BOARD_SIZE,
  DEFAULT_PIT_COUNT,
  validateGameConfig,
} from '../../core/models/game-rules';
import { GameRecord } from '../../core/models/game-state.model';
import { GameApiService } from '../../core/services/game-api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  boardSize: number = DEFAULT_BOARD_SIZE;
  pitCount: number = DEFAULT_PIT_COUNT;
  arrows: number = DEFAULT_ARROWS;

  // En utilisant signal pour éviter les erreurs de détection de changements avec zoneless
  readonly history = signal<GameRecord[]>([]);
  readonly loadingHistory = signal(true);
  readonly creatingGame = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly GameStatus = GameStatus;

  constructor(
    private readonly gameApiService: GameApiService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.gameApiService.getGameHistory().subscribe({
      next: (records) => {
        this.history.set(records);
        this.loadingHistory.set(false);
      },
      error: () => {
        this.loadingHistory.set(false);
      },
    });
  }

  get config(): GameConfig {
    return { boardSize: this.boardSize, pitCount: this.pitCount, arrows: this.arrows };
  }

  get configErrors(): string[] {
    return validateGameConfig(this.config);
  }

  get canStartGame(): boolean {
    return !this.creatingGame() && this.configErrors.length === 0;
  }

  startGame(): void {
    if (this.configErrors.length > 0) {
      this.errorMessage.set(this.configErrors[0]);
      return;
    }

    this.creatingGame.set(true);
    this.errorMessage.set(null);
    this.gameApiService.createGame(this.config).subscribe({
      next: (state) => {
        this.creatingGame.set(false);
        this.router.navigate(['/game', state.gameId], { state: { gameState: state } });
      },
      error: (error: HttpErrorResponse) => {
        this.creatingGame.set(false);
        this.errorMessage.set(this.readApiError(error));
      },
    });
  }

  /**
   * Le ValidationPipe du serveur répond par une erreur 400 en utilisant `message` comme tableau de chaînes
   * de caractères s'il ne s'agit pas d'une erreur 400 connue, un message générique est affiché..
   */
  private readApiError(error: HttpErrorResponse): string {
    const message = error.error?.message;
    if (error.status === 400 && Array.isArray(message)) {
      return message.join(' ');
    }
    if (error.status === 0) {
      return "Impossible de joindre le serveur. Vérifiez que le backend est démarré.";
    }
    return "La partie n'a pas pu être créée. Réessayez.";
  }
}