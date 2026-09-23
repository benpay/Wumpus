import { Action } from '../enums/action.enum.js';
import { Direction } from '../enums/direction.enum.js';
import { GameStatus } from '../enums/game-status.enum.js';
import { Perception } from '../enums/perception.enum.js';
import { Position } from '../interfaces/position.interface.js';
import { Board, BoardConfig } from './board.entity.js';
import { Player, PlayerConfig } from './player.entity.js';

export interface GameConfig {
  id: string;
  boardConfig: BoardConfig;
  playerConfig: PlayerConfig;
}

export interface GameActionResult {
  status: GameStatus;
  perceptions: Perception[];
  playerState: {
    position: Position;
    direction: Direction;
    arrows: number;
    hasGold: boolean;
  };
  message: string;
  turns: number;
  visitedPositions: Position[];
}

export class Game {
  readonly id: string;
  readonly board: Board;
  readonly player: Player;
  readonly startPosition: Position;
  status: GameStatus = GameStatus.PLAYING;
  turns: number = 0;
  visitedPositions: Position[] = [];
  lastPerceptions: Perception[] = [];
  logs: string[] = [];

  constructor(config: GameConfig) {
    this.id = config.id;
    this.board = new Board(config.boardConfig);
    this.player = new Player(config.playerConfig);
    this.startPosition = { ...config.playerConfig.initialPosition };
    this.visitedPositions.push({ ...this.startPosition });
    this.lastPerceptions = this.board.getPerceptionsAt(this.player.position);
    this.logs.push(`La partie commence en la case (${this.startPosition.x}, ${this.startPosition.y}).`);
  }

  static createGame(
    id: string,
    size: number = 4,
    pitCount: number = 2,
    arrows: number = 1,
    startPosition?: Position,
  ): Game {
    // Si on n'a pas de position de départ, on en génère une aléatoire
    const start = startPosition ?? {
      x: Math.floor(Math.random() * size),
      y: Math.floor(Math.random() * size),
    };

    const board = Board.generateRandomBoard(size, pitCount, start);

    return new Game({
      id,
      boardConfig: {
        size: board.size,
        wumpusPosition: board.wumpusPosition,
        goldPosition: board.goldPosition,
        pits: board.pits,
      },
      playerConfig: {
        initialPosition: start,
        initialDirection: Direction.NORTH,
        arrows,
      },
    });
  }

  executeAction(action: Action): GameActionResult {
    if (this.status !== GameStatus.PLAYING) {
      return this.buildResult('La partie est déjà terminée.');
    }

    this.turns++;
    let currentTurnPerceptions: Perception[] = [];
    let message = '';

    switch (action) {
      case Action.ADVANCE: {
        const nextPos = this.player.getNextPosition();
        if (!this.board.isWithinBounds(nextPos)) {
          currentTurnPerceptions.push(Perception.BUMP);
          message = "Vous avez essayé d'avancer mais vous avez choqué vers le mur.";
        } else {
          this.player.moveTo(nextPos);
          this.recordVisited(nextPos);

          if (this.board.hasPit(nextPos)) {
            this.status = GameStatus.LOST;
            message = "Vous êtes tombé dans un puit! Vous avez perdu la partie.";
          } else if (this.board.hasWumpus(nextPos) && this.board.isWumpusAlive) {
            this.status = GameStatus.LOST;
            message = "Le Wumpus vous a devoré! Vous avez perdu la partie.";
          } else {
            if (this.board.hasGold(nextPos) && !this.player.hasGold) {
              this.player.pickUpGold();
              this.board.pickUpGold();
              message = "Vous avez trouvé et pris l'or!";
            } else {
              message = `Vous avez avancé à la case (${nextPos.x}, ${nextPos.y}).`;
            }
          }
        }
        break;
      }

      case Action.ROTATE_LEFT: {
        this.player.rotateLeft();
        message = `Vous avez tourné à gauche. Vous regardez vers le ${this.player.direction}.`;
        break;
      }

      case Action.ROTATE_RIGHT: {
        this.player.rotateRight();
        message = `Vous avez tourné à droite. Vous regardez vers le ${this.player.direction}.`;
        break;
      }

      case Action.SHOOT: {
        const fired = this.player.shootArrow();
        if (!fired) {
          message = "Vous avez essayé de tirer, mais il ne vous reste plus de flèches!";
        } else {
          const hit = this.checkArrowHit();
          if (hit) {
            this.board.killWumpus();
            currentTurnPerceptions.push(Perception.SCREAM);
            message = "Vous avez tiré la flèche et vous avez entendu un cri! Le Wumpus est mort!";
          } else {
            message = "Vous avez tiré la flèche mais vous n'avez rien entendu... Vous avez raté.";
          }
        }
        break;
      }

      case Action.EXIT: {
        if (!Board.isSamePosition(this.player.position, this.startPosition)) {
          message = "Vous ne pouvez sortir de la grotte qu'en la case de départ.";
        } else if (this.player.hasGold) {
          this.status = GameStatus.WON;
          message = "Vous avez quitté la grotte avec l'or! VOUS AVEZ GAGNÉ!";
        } else {
          message = "Vous avez essayé de sortir mais vous n'avez pas l'or. Vous devez obtenir l'or avant de sortir!";
        }
        break;
      }
    }

    // Ajouter les perceptions environnementales de la case actuelle
    const cellPerceptions = this.board.getPerceptionsAt(this.player.position);
    for (const p of cellPerceptions) {
      if (!currentTurnPerceptions.includes(p)) {
        currentTurnPerceptions.push(p);
      }
    }

    this.lastPerceptions = currentTurnPerceptions;
    this.logs.push(`Tour ${this.turns}: ${message}`);

    return this.buildResult(message);
  }

  private checkArrowHit(): boolean {
    let curr = this.player.getNextPosition();
    while (this.board.isWithinBounds(curr)) {
      // Verifier que le Wumpus se trouve vivant
      if (this.board.hasWumpus(curr) && this.board.isWumpusAlive) {
        return true;
      }
      switch (this.player.direction) {
        case Direction.NORTH:
          curr = { x: curr.x, y: curr.y + 1 };
          break;
        case Direction.EAST:
          curr = { x: curr.x + 1, y: curr.y };
          break;
        case Direction.SOUTH:
          curr = { x: curr.x, y: curr.y - 1 };
          break;
        case Direction.WEST:
          curr = { x: curr.x - 1, y: curr.y };
          break;
      }
    }
    return false;
  }

  private recordVisited(pos: Position): void {
    if (!this.visitedPositions.some((p) => Board.isSamePosition(p, pos))) {
      this.visitedPositions.push({ ...pos });
    }
  }

  private buildResult(message: string): GameActionResult {
    return {
      status: this.status,
      perceptions: [...this.lastPerceptions],
      playerState: {
        position: { ...this.player.position },
        direction: this.player.direction,
        arrows: this.player.arrows,
        hasGold: this.player.hasGold,
      },
      message,
      turns: this.turns,
      visitedPositions: this.visitedPositions.map((p) => ({ ...p })),
    };
  }
}
