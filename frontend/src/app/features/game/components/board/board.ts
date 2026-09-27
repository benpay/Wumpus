import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { Direction, Perception } from '../../../../core/models/enums';
import { PlayerState, Position } from '../../../../core/models/game-state.model';

interface CellInfo {
  x: number;
  y: number;
  isVisited: boolean;
  isPlayerHere: boolean;
  isStart: boolean;
  perceptions: Perception[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
})
export class BoardComponent implements OnChanges {
  @Input() boardSize: number = 4;
  @Input() playerState!: PlayerState;
  @Input() visitedPositions: Position[] = [];
  @Input() perceptions: Perception[] = [];
  @Input() startPosition?: Position;

  readonly Perception = Perception;
  grid: CellInfo[][] = [];

  get cellPadding(): string {
    if (this.boardSize >= 9) return '0.15rem';
    if (this.boardSize >= 7) return '0.3rem';
    return '0.5rem';
  }

  ngOnChanges(): void {
    this.buildGrid();
  }

  buildGrid(): void {
    const size = this.boardSize;
    const newGrid: CellInfo[][] = [];

    // Render à partir de ligne y = size - 1 jusqu'à 0 pour que (0,0) soit en bas à gauche
    for (let y = size - 1; y >= 0; y--) {
      const row: CellInfo[] = [];
      for (let x = 0; x < size; x++) {
        const isVisited = this.visitedPositions.some(
          (p) => p.x === x && p.y === y,
        );
        const isPlayerHere =
          !!this.playerState &&
          this.playerState.position.x === x &&
          this.playerState.position.y === y;
        const isStart = !!this.startPosition && this.startPosition.x === x && this.startPosition.y === y;

        row.push({
          x,
          y,
          isVisited,
          isPlayerHere,
          isStart,
          perceptions: isPlayerHere ? this.perceptions : [],
        });
      }
      newGrid.push(row);
    }
    this.grid = newGrid;
  }

  hasPerception(cell: CellInfo, perception: Perception): boolean {
    return cell.perceptions.includes(perception);
  }

  getDirectionSymbol(direction: Direction): string {
    switch (direction) {
      case Direction.NORTH:
        return '⬆️';
      case Direction.EAST:
        return '➡️';
      case Direction.SOUTH:
        return '⬇️';
      case Direction.WEST:
        return '⬅️';
      default:
        return '⬆️';
    }
  }
}

