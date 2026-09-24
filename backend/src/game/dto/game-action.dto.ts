import { Action } from '../domain/enums/action.enum.js';

export class GameActionDto {
  gameId!: string;
  action!: Action;
}
