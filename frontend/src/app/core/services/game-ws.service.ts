import { Injectable, OnDestroy, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Action } from '../models/enums';
import { GameState } from '../models/game-state.model';

/**
 * Transport WebSocket de la partie.
 *
 * L'application fonctionne en zoneless (comportement par défaut depuis
 * Angular 21) : l'écriture dans un signal suffit à planifier le rendu, il n'y a
 * donc aucun besoin de NgZone.run(). Les états de connexion sont exposés en
 * signaux ; les flux d'événements (état de jeu, erreurs) restent des observables
 * car ce sont des événements, pas des valeurs courantes.
 */
@Injectable({
  providedIn: 'root',
})
export class GameWsService implements OnDestroy {
  private socket!: Socket;

  private readonly gameStateSubject = new Subject<GameState>();
  public readonly gameState$: Observable<GameState> = this.gameStateSubject.asObservable();

  private readonly gameErrorSubject = new Subject<string>();
  public readonly gameError$: Observable<string> = this.gameErrorSubject.asObservable();

  private readonly connectedState = signal(false);
  /** Etat de la connexion au serveur. */
  public readonly isConnected = this.connectedState.asReadonly();

  private readonly connectionErrorState = signal<string | null>(null);
  /** Raison de la derniere echec de connexion, `null` si la connexion est saine. */
  public readonly connectionError = this.connectionErrorState.asReadonly();

  constructor() {
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
        this.connectedState.set(true);
        this.connectionErrorState.set(null);
      });

      this.socket.on('disconnect', (reason: string) => {
        this.connectedState.set(false);
        if (reason === 'io server disconnect') {
          this.socket.connect();
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        this.connectedState.set(false);
        this.connectionErrorState.set(`Erreur de connexion au serveur : ${error.message}`);
      });

      this.socket.on('gameStateUpdate', (state: GameState) => {
        this.gameStateSubject.next(state);
      });

      this.socket.on('gameError', (data: { message: string }) => {
        this.gameErrorSubject.next(data.message);
      });

      this.socket.on('exception', (data: any) => {
        const msg = typeof data === 'string' ? data : data?.message || 'Erreur du serveur WebSocket';
        this.gameErrorSubject.next(msg);
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  sendAction(gameId: string, action: Action): boolean {
    if (this.socket && this.socket.connected) {
      this.socket.emit('gameAction', { gameId, action });
      return true;
    }
    this.gameErrorSubject.next('Impossible d\'envoyer l\'action : connexion perdue avec le serveur.');
    return false;
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
