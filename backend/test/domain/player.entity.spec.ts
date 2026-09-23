import { Player } from '../../src/game/domain/entities/player.entity.js';
import { Direction } from '../../src/game/domain/enums/direction.enum.js';

describe('Player Entity', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player({
      initialPosition: { x: 1, y: 1 },
      initialDirection: Direction.NORTH,
      arrows: 2,
    });
  });

  it('should initialize correctly', () => {
    expect(player.position).toEqual({ x: 1, y: 1 });
    expect(player.direction).toBe(Direction.NORTH);
    expect(player.arrows).toBe(2);
    expect(player.hasGold).toBe(false);
  });

  it('should rotate left correctly (NORTH -> WEST -> SOUTH -> EAST -> NORTH)', () => {
    player.rotateLeft();
    expect(player.direction).toBe(Direction.WEST);
    player.rotateLeft();
    expect(player.direction).toBe(Direction.SOUTH);
    player.rotateLeft();
    expect(player.direction).toBe(Direction.EAST);
    player.rotateLeft();
    expect(player.direction).toBe(Direction.NORTH);
  });

  it('should rotate right correctly (NORTH -> EAST -> SOUTH -> WEST -> NORTH)', () => {
    player.rotateRight();
    expect(player.direction).toBe(Direction.EAST);
    player.rotateRight();
    expect(player.direction).toBe(Direction.SOUTH);
    player.rotateRight();
    expect(player.direction).toBe(Direction.WEST);
    player.rotateRight();
    expect(player.direction).toBe(Direction.NORTH);
  });

  it('should compute next position accurately based on direction', () => {
    player.direction = Direction.NORTH;
    expect(player.getNextPosition()).toEqual({ x: 1, y: 2 });

    player.direction = Direction.EAST;
    expect(player.getNextPosition()).toEqual({ x: 2, y: 1 });

    player.direction = Direction.SOUTH;
    expect(player.getNextPosition()).toEqual({ x: 1, y: 0 });

    player.direction = Direction.WEST;
    expect(player.getNextPosition()).toEqual({ x: 0, y: 1 });
  });

  it('should decrement arrows when firing', () => {
    expect(player.shootArrow()).toBe(true);
    expect(player.arrows).toBe(1);

    expect(player.shootArrow()).toBe(true);
    expect(player.arrows).toBe(0);

    expect(player.shootArrow()).toBe(false);
    expect(player.arrows).toBe(0);
  });

  it('should pickup gold', () => {
    player.pickUpGold();
    expect(player.hasGold).toBe(true);
  });
});
