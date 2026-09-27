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
    expect(board.grid).toHaveSize(4);
    expect(board.grid[0]).toHaveSize(4);
  });

  it('place (0,0) dans le coin inférieur gauche', () => {
    const board = createBoard(4, playerState, []);
    // La première fila del DOM es y = size - 1
    expect(board.grid[0][0]).toEqual(jasmine.objectContaining({ x: 0, y: 3 }));
    expect(board.grid[3][0]).toEqual(jasmine.objectContaining({ x: 0, y: 0 }));
  });

  it('marque comme visitées les cases parcourues', () => {
    const board = createBoard(4, playerState, [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    const flat = board.grid.flat();
    expect(flat.filter((c) => c.isVisited)).toHaveSize(2);
    expect(flat.find((c) => c.x === 1 && c.y === 1)?.isVisited).toBe(true);
  });

  it('marque la case du joueur', () => {
    const board = createBoard(4, playerState, []);
    expect(board.grid.flat().filter((c) => c.isPlayerHere)).toHaveSize(1);
  });

  it('n\'affiche les perceptions que sur la case du joueur', () => {
    const board = createBoard(4, playerState, [{ x: 1, y: 1 }], [
      Perception.STENCH,
      Perception.BREEZE,
    ]);
    const withPerceptions = board.grid.flat().filter((c) => c.perceptions.length > 0);
    expect(withPerceptions).toHaveSize(1);
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
    expect(fixture.componentInstance.grid).toHaveSize(3);

    fixture.componentRef.setInput('boardSize', 5);
    fixture.detectChanges();
    expect(fixture.componentInstance.grid).toHaveSize(5);
  });

  it('expose un symbole pour chaque direction', () => {
    const board = createBoard(4, playerState, []);
    expect(board.getDirectionSymbol(Direction.NORTH)).toBeTruthy();
    expect(board.getDirectionSymbol(Direction.EAST)).toBeTruthy();
    expect(board.getDirectionSymbol(Direction.SOUTH)).toBeTruthy();
    expect(board.getDirectionSymbol(Direction.WEST)).toBeTruthy();
  });
});
