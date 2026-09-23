import { Game } from '../../src/game/domain/entities/game.entity.js';
import { Action } from '../../src/game/domain/enums/action.enum.js';
import { Direction } from '../../src/game/domain/enums/direction.enum.js';
import { GameStatus } from '../../src/game/domain/enums/game-status.enum.js';
import { Perception } from '../../src/game/domain/enums/perception.enum.js';

describe('Game Entity', () => {
  let game: Game;

  beforeEach(() => {
    // setup jeu deterministe
    game = new Game({
      id: 'test-game-1',
      boardConfig: {
        size: 4,
        wumpusPosition: { x: 0, y: 2 },
        goldPosition: { x: 1, y: 1 },
        pits: [{ x: 2, y: 0 }],
      },
      playerConfig: {
        initialPosition: { x: 0, y: 0 },
        initialDirection: Direction.NORTH,
        arrows: 1,
      },
    });
  });

  it('should initialize game in PLAYING status', () => {
    expect(game.status).toBe(GameStatus.PLAYING);
    expect(game.turns).toBe(0);
    expect(game.visitedPositions).toEqual([{ x: 0, y: 0 }]);
  });

  it('should advance player northbound', () => {
    const res = game.executeAction(Action.ADVANCE);
    expect(res.status).toBe(GameStatus.PLAYING);
    expect(res.playerState.position).toEqual({ x: 0, y: 1 });
    expect(res.visitedPositions).toContainEqual({ x: 0, y: 1 });
  });

  it('should generate BUMP perception if advancing into wall', () => {
    game.executeAction(Action.ROTATE_LEFT); // Regarde a l'ouest
    const res = game.executeAction(Action.ADVANCE);
    expect(res.playerState.position).toEqual({ x: 0, y: 0 }); // Ne bouge pas!
    expect(res.perceptions).toContain(Perception.BUMP);
  });

  it('should pick up gold when stepping on gold cell', () => {
    game.executeAction(Action.ADVANCE); // (0,1)
    game.executeAction(Action.ROTATE_RIGHT); // Est
    const res = game.executeAction(Action.ADVANCE); // (1,1) -> Gold / Or!

    expect(res.playerState.hasGold).toBe(true);
    expect(res.message).toContain('or');
  });

  it('should lose if stepping into pit', () => {
    game.executeAction(Action.ROTATE_RIGHT); // Est
    game.executeAction(Action.ADVANCE); // (1,0)
    const res = game.executeAction(Action.ADVANCE); // (2,0) -> Pit / Trou!

    expect(res.status).toBe(GameStatus.LOST);
    expect(res.message).toContain('trou');
  });

  it('should lose if stepping into alive Wumpus', () => {
    game.executeAction(Action.ADVANCE); // (0,1)
    const res = game.executeAction(Action.ADVANCE); // (0,2) -> Wumpus!

    expect(res.status).toBe(GameStatus.LOST);
    expect(res.message).toContain('Wumpus');
  });

  it('should kill Wumpus with arrow and produce SCREAM perception', () => {
    // Le joueur est au (0,0) face au Nord. Wumpus est au (0,2).
    const res = game.executeAction(Action.SHOOT);
    expect(res.perceptions).toContain(Perception.SCREAM);
    expect(game.board.isWumpusAlive).toBe(false);

    // Maintenant, le joueur peut marcher jusqu'au (0,2) en toute securité!
    game.executeAction(Action.ADVANCE); // (0,1)
    const moveRes = game.executeAction(Action.ADVANCE); // (0,2)
    expect(moveRes.status).toBe(GameStatus.PLAYING);
  });

  it('should win game when exiting from start position with gold', () => {
    // 1. Aller a la case de l'or (1,1)
    game.executeAction(Action.ADVANCE); // (0,1)
    game.executeAction(Action.ROTATE_RIGHT); // Est
    game.executeAction(Action.ADVANCE); // (1,1) - Gold / Or!

    // 2. Retour a la case de depart (0,0)
    game.executeAction(Action.ROTATE_RIGHT); // Sud
    game.executeAction(Action.ADVANCE); // (1,0)
    game.executeAction(Action.ROTATE_RIGHT); // Ouest
    game.executeAction(Action.ADVANCE); // (0,0) - Case de depart!

    // 3. Sortie!
    const winRes = game.executeAction(Action.EXIT);
    expect(winRes.status).toBe(GameStatus.WON);
    expect(winRes.message).toContain('GANADO');
  });
});
