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

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('gameAction')
  async handleGameAction(
    @MessageBody() dto: GameActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.gameService.executeAction(dto);
    client.emit('gameStateUpdate', result);
    return result;
  }
}
