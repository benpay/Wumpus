import { IsEnum, IsUUID } from 'class-validator';
import { Action } from '../domain/enums/action.enum.js';

export class GameActionDto {
  @IsUUID()
  gameId!: string;

  @IsEnum(Action)
  action!: Action;
}
