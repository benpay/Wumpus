import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameActionDto } from './dto/game-action.dto.js';
import { GameService } from './game.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameService: GameService) { }

  @SubscribeMessage('gameAction')
  async handleGameAction(
    @MessageBody() dto: GameActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.gameService.executeAction(dto);
      client.emit('gameStateUpdate', state);
      return state;
    } catch (err: any) {
      const message = err?.message || "Erreur lors de l'exécution de l'action.";
      client.emit('gameError', { message });
    }
  }
}
