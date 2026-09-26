import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Action } from '../models/enums';
import { GameState } from '../models/game-state.model';

@Injectable({
  providedIn: 'root',
})
export class GameWsService {
  private socket!: Socket;
  private gameStateSubject = new Subject<GameState>();
  public gameState$: Observable<GameState> = this.gameStateSubject.asObservable();

  constructor() {
    this.connect();
  }

  connect(): void {
    if (!this.socket || !this.socket.connected) {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('gameStateUpdate', (state: GameState) => {
        this.gameStateSubject.next(state);
      });
    }
  }

  sendAction(gameId: string, action: Action): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('gameAction', { gameId, action });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
