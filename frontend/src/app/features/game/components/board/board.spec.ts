import { TestBed } from '@angular/core/testing';
import { BoardComponent } from './board';
import { Direction, Perception } from '../../../../core/models/enums';
import { PlayerState } from '../../../../core/models/game-state.model';

describe('BoardComponent', () => {
  const playerState: PlayerState = {
    position: { x: 1, y: 1 },
    direction: Direction.NORTH,
    arrows: 2,
    hasGold: false,
  };

  const createBoard = (
    boardSize: number,
    player: PlayerState,
    visited: Array<{ x: number; y: number }>,
    perceptions: Perception[] = [],
  ) => {
    const fixture = TestBed.createComponent(BoardComponent);
    fixture.componentRef.setInput('boardSize', boardSize);
    fixture.componentRef.setInput('playerState', player);
    fixture.componentRef.setInput('visitedPositions', visited);
    fixture.componentRef.setInput('perceptions', perceptions);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BoardComponent] }).compileComponents();
  });

  it('construit une grille boardSize x boardSize', () => {
    const board = createBoard(4, playerState, [{ x: 0, y: 0 }]);
    expect(board.grid).toHaveLength(4);
    expect(board.grid[0]).toHaveLength(4);
  });

  it('coloca (0,0) en la esquina inferior izquierda', () => {
    const board = createBoard(4, playerState, []);
    // La première fila del DOM es y = size - 1
    expect(board.grid[0][0]).toMatchObject({ x: 0, y: 3 });
    expect(board.grid[3][0]).toMatchObject({ x: 0, y: 0 });
  });

  it('marca comme visitées les cases parcourues', () => {
    const board = createBoard(4, playerState, [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    const flat = board.grid.flat();
    expect(flat.filter((c) => c.isVisited)).toHaveLength(2);
    expect(flat.find((c) => c.x === 1 && c.y === 1)?.isVisited).toBe(true);
  });

  it('marque la case du joueur', () => {
    const board = createBoard(4, playerState, []);
    expect(board.grid.flat().filter((c) => c.isPlayerHere)).toHaveLength(1);
  });

  it('n\'affiche les perceptions que sur la case du joueur', () => {
    const board = createBoard(4, playerState, [{ x: 1, y: 1 }], [
      Perception.STENCH,
      Perception.BREEZE,
    ]);
    const withPerceptions = board.grid.flat().filter((c) => c.perceptions.length > 0);
    expect(withPerceptions).toHaveLength(1);
    expect(withPerceptions[0].isPlayerHere).toBe(true);
    expect(board.hasPerception(withPerceptions[0], Perception.STENCH)).toBe(true);
    expect(board.hasPerception(withPerceptions[0], Perception.GLIMMER)).toBe(false);
  });

  it('reconstruit la grille quand les entrées changent', () => {
    const fixture = TestBed.createComponent(BoardComponent);
    fixture.componentRef.setInput('boardSize', 3);
    fixture.componentRef.setInput('playerState', playerState);
    fixture.componentRef.setInput('visitedPositions', []);
    fixture.componentRef.setInput('perceptions', []);
    fixture.detectChanges();
    expect(fixture.componentInstance.grid).toHaveLength(3);

    fixture.componentRef.setInput('boardSize', 5);
    fixture.detectChanges();
    expect(fixture.componentInstance.grid).toHaveLength(5);
  });

  it('expose un symbole pour chaque direction', () => {
    const board = createBoard(4, playerState, []);
    expect(board.getDirectionSymbol(Direction.NORTH)).toBeTruthy();
    expect(board.getDirectionSymbol(Direction.EAST)).toBeTruthy();
    expect(board.getDirectionSymbol(Direction.SOUTH)).toBeTruthy();
    expect(board.getDirectionSymbol(Direction.WEST)).toBeTruthy();
  });
});
