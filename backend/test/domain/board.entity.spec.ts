import { Board } from '../../src/game/domain/entities/board.entity.js';
import { Perception } from '../../src/game/domain/enums/perception.enum.js';

describe('Board Entity', () => {
  const boardConfig = {
    size: 4,
    wumpusPosition: { x: 2, y: 2 },
    goldPosition: { x: 3, y: 3 },
    pits: [{ x: 0, y: 1 }],
  };

  let board: Board;

  beforeEach(() => {
    board = new Board(boardConfig);
  });

  it('should initialize correctly with config', () => {
    expect(board.size).toBe(4);
    expect(board.wumpusPosition).toEqual({ x: 2, y: 2 });
    expect(board.goldPosition).toEqual({ x: 3, y: 3 });
    expect(board.pits).toEqual([{ x: 0, y: 1 }]);
    expect(board.isWumpusAlive).toBe(true);
    expect(board.isGoldPickedUp).toBe(false);
  });

  it('should validate bounds correctly', () => {
    expect(board.isWithinBounds({ x: 0, y: 0 })).toBe(true);
    expect(board.isWithinBounds({ x: 3, y: 3 })).toBe(true);
    expect(board.isWithinBounds({ x: -1, y: 0 })).toBe(false);
    expect(board.isWithinBounds({ x: 0, y: 4 })).toBe(false);
  });

  it('should return valid adjacent positions within bounds', () => {
    const adj = board.getAdjacentPositions({ x: 0, y: 0 });
    expect(adj).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ]);
  });

  it('should detect STENCH near alive Wumpus', () => {
    // Avec wumpusPosition: { x: 2, y: 2 }, case adjacente (2,1) doit avoir STENCH
    const perceptions = board.getPerceptionsAt({ x: 2, y: 1 });
    expect(perceptions).toContain(Perception.STENCH);
  });

  it('should not detect STENCH if Wumpus is dead', () => {
    board.killWumpus();
    const perceptions = board.getPerceptionsAt({ x: 2, y: 1 });
    expect(perceptions).not.toContain(Perception.STENCH);
  });

  it('should detect BREEZE near pit', () => {
    // Avec pit: { x: 0, y: 1 }, case adjacente (0,0) doit avoir BREEZE
    const perceptions = board.getPerceptionsAt({ x: 0, y: 0 });
    expect(perceptions).toContain(Perception.BREEZE);
  });

  it('should detect GLIMMER at gold position before pickup', () => {
    const perceptions = board.getPerceptionsAt({ x: 3, y: 3 });
    expect(perceptions).toContain(Perception.GLIMMER);

    board.pickUpGold();
    const afterPickup = board.getPerceptionsAt({ x: 3, y: 3 });
    expect(afterPickup).not.toContain(Perception.GLIMMER);
  });

  it('should generate a random board excluding start position', () => {
    const start = { x: 0, y: 0 };
    const randomBoard = Board.generateRandomBoard(4, 2, start);

    expect(randomBoard.size).toBe(4);
    expect(randomBoard.pits.length).toBe(2);
    expect(Board.isSamePosition(randomBoard.wumpusPosition, start)).toBe(false);
    expect(Board.isSamePosition(randomBoard.goldPosition, start)).toBe(false);
    expect(randomBoard.pits.some((p) => Board.isSamePosition(p, start))).toBe(false);
  });
});
