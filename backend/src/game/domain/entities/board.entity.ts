import { Perception } from '../enums/perception.enum.js';
import { Position } from '../interfaces/position.interface.js';

export interface BoardConfig {
  size: number;
  wumpusPosition: Position;
  goldPosition: Position;
  pits: Position[];
}

export class Board {
  readonly size: number;
  readonly wumpusPosition: Position;
  readonly goldPosition: Position;
  readonly pits: Position[];
  private wumpusAlive: boolean = true;
  private goldPickedUp: boolean = false;

  constructor(config: BoardConfig) {
    this.size = config.size;
    this.wumpusPosition = { ...config.wumpusPosition };
    this.goldPosition = { ...config.goldPosition };
    this.pits = config.pits.map((p) => ({ ...p }));
  }

  static isSamePosition(a: Position, b: Position): boolean {
    return a.x === b.x && a.y === b.y;
  }

  isWithinBounds(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.size && pos.y >= 0 && pos.y < this.size;
  }

  getAdjacentPositions(pos: Position): Position[] {
    const candidates: Position[] = [
      { x: pos.x, y: pos.y + 1 }, // Nord
      { x: pos.x + 1, y: pos.y }, // Est
      { x: pos.x, y: pos.y - 1 }, // Sud
      { x: pos.x - 1, y: pos.y }, // Ouest
    ];
    return candidates.filter((p) => this.isWithinBounds(p));
  }

  get isWumpusAlive(): boolean {
    return this.wumpusAlive;
  }

  killWumpus(): void {
    this.wumpusAlive = false;
  }

  get isGoldPickedUp(): boolean {
    return this.goldPickedUp;
  }

  pickUpGold(): void {
    this.goldPickedUp = true;
  }

  hasPit(pos: Position): boolean {
    return this.pits.some((p) => Board.isSamePosition(p, pos));
  }

  hasWumpus(pos: Position): boolean {
    return Board.isSamePosition(this.wumpusPosition, pos);
  }

  hasGold(pos: Position): boolean {
    return Board.isSamePosition(this.goldPosition, pos);
  }

  getPerceptionsAt(pos: Position): Perception[] {
    const perceptions: Perception[] = [];

    // STENCH: Si le Wumpus est vivant et il est en la case ou adjacent
    if (this.wumpusAlive) {
      if (
        this.hasWumpus(pos) || // même case
        this.getAdjacentPositions(this.wumpusPosition).some((p) => Board.isSamePosition(p, pos)) // case adjacente
      ) {
        perceptions.push(Perception.STENCH);
      }
    }

    // BREEZE: S'il y a un creux dans la case adjacente
    const isAdjacentToPit = this.pits.some((pit) =>
      this.getAdjacentPositions(pit).some((p) => Board.isSamePosition(p, pos)),
    );
    if (isAdjacentToPit) {
      perceptions.push(Perception.BREEZE);
    }

    // GLIMMER: S'il y a un trésor dans la case et qu'il n'a pas été pris
    if (!this.goldPickedUp && this.hasGold(pos)) {
      perceptions.push(Perception.GLIMMER);
    }

    return perceptions;
  }

  // Génération d'un plateau aléatoire
  static generateRandomBoard(size: number, pitCount: number, startPosition: Position): Board {
    const availableCells: Position[] = [];
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (!Board.isSamePosition({ x, y }, startPosition)) {
          availableCells.push({ x, y });
        }
      }
    }

    // Mélange du tableau
    const shuffle = <T>(array: T[]): T[] => {
      const copy = [...array];
      // On utilise l'algo de Fisher-Yates pour mélanger le tableau
      for (let i = copy.length - 1; i > 0; i--) {
        // On choisit un indice aléatoire entre 0 et i
        const j = Math.floor(Math.random() * (i + 1));
        // On échange les éléments (swap)
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffled = shuffle(availableCells);
    const wumpusPosition = shuffled.pop()!;
    const goldPosition = shuffled.pop()!;

    const actualPitCount = Math.min(pitCount, shuffled.length);
    const pits: Position[] = [];
    for (let i = 0; i < actualPitCount; i++) {
      pits.push(shuffled.pop()!);
    }

    return new Board({
      size,
      wumpusPosition,
      goldPosition,
      pits,
    });
  }
}
