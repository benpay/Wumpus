import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRecord } from './entities/game-record.entity.js';
import { PersistenceService } from './persistence.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([GameRecord])],
  providers: [PersistenceService],
  exports: [PersistenceService],
})
export class PersistenceModule {}
