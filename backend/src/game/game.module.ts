import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { GameController } from './game.controller.js';
import { GameGateway } from './game.gateway.js';
import { GamePresenter } from './game.presenter.js';
import { GameService } from './game.service.js';

@Module({
  imports: [PersistenceModule],
  controllers: [GameController],
  providers: [GameService, GamePresenter, GameGateway],
  exports: [GameService],
})
export class GameModule {}
