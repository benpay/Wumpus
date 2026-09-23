import { Action } from '../enums/action.enum.js';
import { Direction } from '../enums/direction.enum.js';
import { GameStatus } from '../enums/game-status.enum.js';
import { Perception } from '../enums/perception.enum.js';
import { Board } from './board.entity.js';
import { Player } from './player.entity.js';
export class Game {
    id;
    board;
    player;
    startPosition;
    status = GameStatus.PLAYING;
    turns = 0;
    visitedPositions = [];
    lastPerceptions = [];
    logs = [];
    constructor(config) {
        this.id = config.id;
        this.board = new Board(config.boardConfig);
        this.player = new Player(config.playerConfig);
        this.startPosition = { ...config.playerConfig.initialPosition };
        this.visitedPositions.push({ ...this.startPosition });
        this.lastPerceptions = this.board.getPerceptionsAt(this.player.position);
        this.logs.push(`La partie commence en (${this.startPosition.x}, ${this.startPosition.y}).`);
    }
    static createGame(id, size = 4, pitCount = 2, arrows = 1, startPosition) {
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
    executeAction(action) {
        if (this.status !== GameStatus.PLAYING) {
            return this.buildResult('La partie est deja terminee.');
        }
        this.turns++;
        let currentTurnPerceptions = [];
        let message = '';
        switch (action) {
            case Action.ADVANCE: {
                const nextPos = this.player.getNextPosition();
                if (!this.board.isWithinBounds(nextPos)) {
                    currentTurnPerceptions.push(Perception.BUMP);
                    message = 'Vous avez essaye d avance mais vous avez choque contre le mur.';
                }
                else {
                    this.player.moveTo(nextPos);
                    this.recordVisited(nextPos);
                    if (this.board.hasPit(nextPos)) {
                        this.status = GameStatus.LOST;
                        message = 'Vous avez choisis d avance mais vous tombez dans un trou sans fond! Vous avez perdu.';
                    }
                    else if (this.board.hasWumpus(nextPos) && this.board.isWumpusAlive) {
                        this.status = GameStatus.LOST;
                        message = 'Vous avez choisis d avance mais le wumpus vous a devore! Vous avez perdu.';
                    }
                    else {
                        if (this.board.hasGold(nextPos) && !this.player.hasGold) {
                            this.player.pickUpGold();
                            this.board.pickUpGold();
                            message = 'Vous avez trouvé et ramassez l\'or!';
                        }
                        else {
                            message = `Vous avez avance a la case (${nextPos.x}, ${nextPos.y}).`;
                        }
                    }
                }
                break;
            }
            case Action.ROTATE_LEFT: {
                this.player.rotateLeft();
                message = `Vous avez tourne a gauche. Vous regardez vers le ${this.player.direction}.`;
                break;
            }
            case Action.ROTATE_RIGHT: {
                this.player.rotateRight();
                message = `Vous avez tourne a droite. Vous regardez vers le ${this.player.direction}.`;
                break;
            }
            case Action.SHOOT: {
                const fired = this.player.shootArrow();
                if (!fired) {
                    message = 'Vous avez essaye de tirer mais vous n\'avez plus de fleches!';
                }
                else {
                    const hit = this.checkArrowHit();
                    if (hit) {
                        this.board.killWumpus();
                        currentTurnPerceptions.push(Perception.SCREAM);
                        message = 'Vous avez tire la fleche et entendu un cri! Le Wumpus est mort!';
                    }
                    else {
                        message = 'Vous avez tire la fleche mais n\'avez rien entendu... Vous avez rate.';
                    }
                }
                break;
            }
            case Action.EXIT: {
                if (!Board.isSamePosition(this.player.position, this.startPosition)) {
                    message = 'Vous ne pouvez sortir de la grotte que depuis la case de sortie initiale.';
                }
                else if (this.player.hasGold) {
                    this.status = GameStatus.WON;
                    message = 'Vous avez quitte la grotte avec l\'or! VOUS AVEZ GAGNE!';
                }
                else {
                    message = 'Vous avez essaye de sortir mais vous n\'avez pas l\'or. Vous devez recuperer l\'or avant de sortir!';
                }
                break;
            }
        }
        const cellPerceptions = this.board.getPerceptionsAt(this.player.position);
        for (const p of cellPerceptions) {
            if (!currentTurnPerceptions.includes(p)) {
                currentTurnPerceptions.push(p);
            }
        }
        this.lastPerceptions = currentTurnPerceptions;
        this.logs.push(`Turno ${this.turns}: ${message}`);
        return this.buildResult(message);
    }
    checkArrowHit() {
        let curr = this.player.getNextPosition();
        while (this.board.isWithinBounds(curr)) {
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
    recordVisited(pos) {
        if (!this.visitedPositions.some((p) => Board.isSamePosition(p, pos))) {
            this.visitedPositions.push({ ...pos });
        }
    }
    buildResult(message) {
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
//# sourceMappingURL=game.entity.js.map