import { AppState, Team, MatchConfig, ScoreState } from './types.ts';

const USERS_KEY = 'youbeeCricketUsers';
const CURRENT_USER_KEY = 'youbeeCricketCurrentUser';
const GAME_STATE_PREFIX = 'youbeeCricketState_';

interface UserData {
  [username: string]: string;
}

export interface GameState {
    appState: AppState;
    teamA: Team;
    teamB: Team;
    matchConfig: MatchConfig | null;
    gameState: ScoreState | null;
    firstInningsSummary: ScoreState | null;
}

// --- User Management ---

export const getUsers = (): UserData => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : {};
    } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        return {};
    }
};

export const saveUsers = (users: UserData): void => {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Failed to save users to localStorage", e);
    }
};

// --- Session Management ---

export const getLoggedInUser = (): string | null => {
    return localStorage.getItem(CURRENT_USER_KEY);
};

export const setLoggedInUser = (username: string): void => {
    localStorage.setItem(CURRENT_USER_KEY, username);
};

export const clearLoggedInUser = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
};


// --- Game State Management ---

export const loadGameState = (username: string): GameState | undefined => {
    try {
        const serializedState = localStorage.getItem(`${GAME_STATE_PREFIX}${username}`);
        return serializedState ? JSON.parse(serializedState) : undefined;
    } catch (err) {
        console.error("Could not load state from localStorage", err);
        return undefined;
    }
};

export const saveGameState = (username: string, state: GameState): void => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(`${GAME_STATE_PREFIX}${username}`, serializedState);
    } catch (err) {
        console.error("Could not save state to localStorage", err);
    }
};

export const removeGameState = (username: string): void => {
    localStorage.removeItem(`${GAME_STATE_PREFIX}${username}`);
};
