import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GameModule } from './game/game.module.js';
import { PersistenceModule } from './persistence/persistence.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'wumpus',
      password: process.env.DB_PASSWORD ?? 'wumpus_secret',
      database: process.env.DB_NAME ?? 'wumpus',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PersistenceModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
