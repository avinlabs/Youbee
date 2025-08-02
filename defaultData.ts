import { Player, Team } from './types.ts';

// Creates a player object with a unique-enough ID for local state management.
const createPlayer = (name: string): Player => ({ 
    id: `player-${name.toLowerCase().replace(/[\s\.]/g, '-')}-${Math.random().toString(36).substr(2, 9)}`, 
    name 
});

export const DEFAULT_TEAMS: Team[] = [
    {
        name: '🟦 Team Blue (C: Muzeeb)',
        players: [
            createPlayer('Muzeeb'), createPlayer('Adarsh'), createPlayer('Basuva'),
            createPlayer('Tahmid'), createPlayer('Waseem'), createPlayer('Sidanna'), createPlayer('Thippa Lemon')
        ]
    },
    {
        name: '⚫ Team Black (C: Pintu)',
        players: [
            createPlayer('Pintu'), createPlayer('Avinash'), createPlayer('Raju'),
            createPlayer('Manu'), createPlayer('Sachin'), createPlayer('Akash'), createPlayer('Santhosh')
        ]
    },
    {
        name: '⚪ Team White (C: Rahul)',
        players: [
            createPlayer('Rahul'), createPlayer('Shekar'), createPlayer('Thippesh'),
            createPlayer('Jagga'), createPlayer('Malu'), createPlayer('Veeru'), createPlayer('Shivaraj')
        ]
    }
];