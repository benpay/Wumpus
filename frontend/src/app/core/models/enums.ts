export enum Direction {
  NORTH = 'NORTH',
  EAST = 'EAST',
  SOUTH = 'SOUTH',
  WEST = 'WEST',
}

export enum Action {
  ADVANCE = 'ADVANCE',
  ROTATE_LEFT = 'ROTATE_LEFT',
  ROTATE_RIGHT = 'ROTATE_RIGHT',
  SHOOT = 'SHOOT',
  EXIT = 'EXIT',
}

export enum Perception {
  STENCH = 'STENCH',
  BREEZE = 'BREEZE',
  GLIMMER = 'GLIMMER',
  BUMP = 'BUMP',
  SCREAM = 'SCREAM',
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}
