import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Action } from '../models/enums';
import { GameState } from '../models/game-state.model';

@Injectable({
  providedIn: 'root',
})
export class GameWsService implements OnDestroy {
  private socket!: Socket;

  private gameStateSubject = new Subject<GameState>();
  public gameState$: Observable<GameState> = this.gameStateSubject.asObservable();

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$: Observable<boolean> = this.isConnectedSubject.asObservable();

  private connectionErrorSubject = new BehaviorSubject<string | null>(null);
  public connectionError$: Observable<string | null> = this.connectionErrorSubject.asObservable();

  private gameErrorSubject = new Subject<string>();
  public gameError$: Observable<string> = this.gameErrorSubject.asObservable();

  constructor(private readonly ngZone: NgZone) {
    this.connect();
  }

  connect(): void {
    if (!this.socket) {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.ngZone.run(() => {
          this.isConnectedSubject.next(true);
          this.connectionErrorSubject.next(null);
        });
      });

      this.socket.on('disconnect', (reason: string) => {
        this.ngZone.run(() => {
          this.isConnectedSubject.next(false);
          if (reason === 'io server disconnect') {
            this.socket.connect();
          }
        });
      });

      this.socket.on('connect_error', (error: Error) => {
        this.ngZone.run(() => {
          this.isConnectedSubject.next(false);
          this.connectionErrorSubject.next(`Erreur de connexion au serveur : ${error.message}`);
        });
      });

      this.socket.on('gameStateUpdate', (state: GameState) => {
        this.ngZone.run(() => {
          this.gameStateSubject.next(state);
        });
      });

      this.socket.on('gameError', (data: { message: string }) => {
        this.ngZone.run(() => {
          this.gameErrorSubject.next(data.message);
        });
      });

      this.socket.on('exception', (data: any) => {
        this.ngZone.run(() => {
          const msg = typeof data === 'string' ? data : data?.message || 'Erreur du serveur WebSocket';
          this.gameErrorSubject.next(msg);
        });
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  sendAction(gameId: string, action: Action): boolean {
    if (this.socket && this.socket.connected) {
      this.socket.emit('gameAction', { gameId, action });
      return true;
    } else {
      this.gameErrorSubject.next('Impossible d\'envoyer l\'action : connexion perdue avec le serveur.');
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

