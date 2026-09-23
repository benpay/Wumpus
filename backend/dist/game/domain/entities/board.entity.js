import { Perception } from '../enums/perception.enum.js';
export class Board {
    size;
    wumpusPosition;
    goldPosition;
    pits;
    wumpusAlive = true;
    goldPickedUp = false;
    constructor(config) {
        this.size = config.size;
        this.wumpusPosition = { ...config.wumpusPosition };
        this.goldPosition = { ...config.goldPosition };
        this.pits = config.pits.map((p) => ({ ...p }));
    }
    static isSamePosition(a, b) {
        return a.x === b.x && a.y === b.y;
    }
    isWithinBounds(pos) {
        return pos.x >= 0 && pos.x < this.size && pos.y >= 0 && pos.y < this.size;
    }
    getAdjacentPositions(pos) {
        const candidates = [
            { x: pos.x, y: pos.y + 1 },
            { x: pos.x + 1, y: pos.y },
            { x: pos.x, y: pos.y - 1 },
            { x: pos.x - 1, y: pos.y },
        ];
        return candidates.filter((p) => this.isWithinBounds(p));
    }
    get isWumpusAlive() {
        return this.wumpusAlive;
    }
    killWumpus() {
        this.wumpusAlive = false;
    }
    get isGoldPickedUp() {
        return this.goldPickedUp;
    }
    pickUpGold() {
        this.goldPickedUp = true;
    }
    hasPit(pos) {
        return this.pits.some((p) => Board.isSamePosition(p, pos));
    }
    hasWumpus(pos) {
        return Board.isSamePosition(this.wumpusPosition, pos);
    }
    hasGold(pos) {
        return Board.isSamePosition(this.goldPosition, pos);
    }
    getPerceptionsAt(pos) {
        const perceptions = [];
        if (this.wumpusAlive) {
            if (this.hasWumpus(pos) ||
                this.getAdjacentPositions(this.wumpusPosition).some((p) => Board.isSamePosition(p, pos))) {
                perceptions.push(Perception.STENCH);
            }
        }
        const isAdjacentToPit = this.pits.some((pit) => this.getAdjacentPositions(pit).some((p) => Board.isSamePosition(p, pos)));
        if (isAdjacentToPit) {
            perceptions.push(Perception.BREEZE);
        }
        if (!this.goldPickedUp && this.hasGold(pos)) {
            perceptions.push(Perception.GLIMMER);
        }
        return perceptions;
    }
    static generateRandomBoard(size, pitCount, startPosition) {
        const availableCells = [];
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                if (!Board.isSamePosition({ x, y }, startPosition)) {
                    availableCells.push({ x, y });
                }
            }
        }
        const shuffle = (array) => {
            const copy = [...array];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        };
        const shuffled = shuffle(availableCells);
        const wumpusPosition = shuffled.pop();
        const goldPosition = shuffled.pop();
        const actualPitCount = Math.min(pitCount, shuffled.length);
        const pits = [];
        for (let i = 0; i < actualPitCount; i++) {
            pits.push(shuffled.pop());
        }
        return new Board({
            size,
            wumpusPosition,
            goldPosition,
            pits,
        });
    }
}
//# sourceMappingURL=board.entity.js.map