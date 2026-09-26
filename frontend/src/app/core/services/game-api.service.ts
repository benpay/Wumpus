import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GameConfig } from '../models/game-config.model';
import { GameRecord, GameState } from '../models/game-state.model';

@Injectable({
  providedIn: 'root',
})
export class GameApiService {
  private readonly baseUrl = 'http://localhost:3000/games';

  constructor(private readonly http: HttpClient) { }

  // Creation d'une nouvelle partie
  createGame(config: GameConfig): Observable<GameState> {
    return this.http.post<GameState>(this.baseUrl, config);
  }

  // Recuperation de l'historique des parties
  getGameHistory(): Observable<GameRecord[]> {
    return this.http.get<GameRecord[]>(`${this.baseUrl}/history`);
  }

  // Recuperation d'une partie par son id
  getGame(gameId: string): Observable<GameState> {
    return this.http.get<GameState>(`${this.baseUrl}/${gameId}`);
  }
}
