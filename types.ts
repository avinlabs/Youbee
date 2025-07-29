export interface Player {
  id: string;
  name: string;
}

export interface Team {
    name: string;
    players: Player[];
}

export enum AppState {
  TEAM_SETUP,
  PLAYER_SETUP,
  COIN_TOSS,
  MATCH_SETUP,
  SCOREBOARD,
}

export interface MatchConfig {
  teamA: Team;
  teamB: Team;
  overs: number;
  battingTeamName: string;
  openingBatsman: Player;
  openingBowler: Player;
}

export interface BattingStats {
  playerId: string;
  playerName: string;
  fours: number;
  ballsFaced: number;
  status: 'Not Out' | 'Out' | 'Retired';
  runs: number;
}

export interface BowlingStats {
  playerId: string;
  playerName: string;
  overs: number;
  ballsInCurrentOver: number;
  wickets: number;
  runsConceded: number;
  wides: number;
}


// A snapshot of the state at a point in time, without the history array itself
export type ScoreStateSnapshot = Omit<ScoreState, 'history'>;

export interface ScoreState {
  runs: number;
  wickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  maxOvers: number;
  target: number | null;
  currentBatsmanId: string;
  currentBowlerId: string;
  battingTeam: Team;
  bowlingTeam: Team;
  remainingBatsmen: Player[];
  retiredBatsmen: Player[];
  matchOver: boolean;
  inningsOver: boolean;
  statusMessage: string;
  fours: number;
  widesInCurrentOver: number;
  currentOverEvents: string[];
  history: ScoreStateSnapshot[];
  battingStats: Record<string, BattingStats>;
  bowlingStats: Record<string, BowlingStats>;
}

export type ScoreAction =
  | { type: 'SCORE'; payload: number }
  | { type: 'EXTRA'; payload: { runs: number; type: 'Wd' | 'Nb' } }
  | { type: 'WICKET' }
  | { type: 'RETIRE_BATSMAN' }
  | { type: 'SET_NEXT_BATSMAN'; payload: Player }
  | { type: 'SET_NEXT_BOWLER'; payload: Player }
  | { type: 'UNDO_OVER' }
  | { type: 'SET_STATE'; payload: ScoreState | null };