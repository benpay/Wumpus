import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto.js';
import { GameService } from './game.service.js';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  createGame(@Body() createGameDto: CreateGameDto) {
    return this.gameService.createGame(createGameDto);
  }

  @Get('history')
  getHistory() {
    return this.gameService.getGameHistory();
  }

  @Get(':id')
  getGame(@Param('id') id: string) {
    const game = this.gameService.getGame(id);
    return {
      gameId: game.id,
      status: game.status,
      perceptions: game.lastPerceptions,
      playerState: {
        position: game.player.position,
        direction: game.player.direction,
        arrows: game.player.arrows,
        hasGold: game.player.hasGold,
      },
      turns: game.turns,
      visitedPositions: game.visitedPositions,
      boardSize: game.board.size,
      logs: game.logs,
    };
  }
}
