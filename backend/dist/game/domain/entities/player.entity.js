import { Direction } from '../enums/direction.enum.js';
export class Player {
    position;
    direction;
    arrows;
    hasGold = false;
    constructor(config) {
        this.position = { ...config.initialPosition };
        this.direction = config.initialDirection ?? Direction.NORTH;
        this.arrows = config.arrows ?? 1;
    }
    rotateLeft() {
        switch (this.direction) {
            case Direction.NORTH:
                this.direction = Direction.WEST;
                break;
            case Direction.WEST:
                this.direction = Direction.SOUTH;
                break;
            case Direction.SOUTH:
                this.direction = Direction.EAST;
                break;
            case Direction.EAST:
                this.direction = Direction.NORTH;
                break;
        }
    }
    rotateRight() {
        switch (this.direction) {
            case Direction.NORTH:
                this.direction = Direction.EAST;
                break;
            case Direction.EAST:
                this.direction = Direction.SOUTH;
                break;
            case Direction.SOUTH:
                this.direction = Direction.WEST;
                break;
            case Direction.WEST:
                this.direction = Direction.NORTH;
                break;
        }
    }
    getNextPosition() {
        switch (this.direction) {
            case Direction.NORTH:
                return { x: this.position.x, y: this.position.y + 1 };
            case Direction.EAST:
                return { x: this.position.x + 1, y: this.position.y };
            case Direction.SOUTH:
                return { x: this.position.x, y: this.position.y - 1 };
            case Direction.WEST:
                return { x: this.position.x - 1, y: this.position.y };
        }
    }
    moveTo(newPosition) {
        this.position = { ...newPosition };
    }
    shootArrow() {
        if (this.arrows > 0) {
            this.arrows--;
            return true;
        }
        return false;
    }
    pickUpGold() {
        this.hasGold = true;
    }
}
//# sourceMappingURL=player.entity.js.map