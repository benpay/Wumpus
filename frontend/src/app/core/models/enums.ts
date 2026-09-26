export enum Direction {
  NORTH = 'NORTH',
  EAST = 'EAST',
  SOUTH = 'SOUTH',
  WEST = 'WEST',
}

export enum Action {
  MOVE_NORTH = 'MOVE_NORTH',
  MOVE_SOUTH = 'MOVE_SOUTH',
  MOVE_EAST = 'MOVE_EAST',
  MOVE_WEST = 'MOVE_WEST',
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
