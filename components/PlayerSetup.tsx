import React, { useState, useCallback } from 'react';
import { Player } from '../types';

interface PlayerSetupProps {
  onPlayersSet: (players: Player[]) => void;
  teamAName: string;
  teamBName: string;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onPlayersSet, teamAName, teamBName }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleAddPlayer = useCallback(() => {
    if (newPlayerName.trim() === '') {
      setError('Player name cannot be empty.');
      return;
    }
    if (players.some(p => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
        setError('Player with this name already exists.');
        return;
    }
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: newPlayerName.trim(),
    };
    setPlayers(prev => [...prev, newPlayer]);
    setNewPlayerName('');
    setError('');
  }, [newPlayerName, players]);

  const handleRemovePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleProceed = () => {
    if (players.length < 2) {
        setError('You need at least 2 players to start a match.');
        return;
    }
    onPlayersSet(players);
  };

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700 w-full animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-emerald-400">2. Add Players</h2>
      <p className="text-slate-400 mb-6">Create your player roster for <span className="font-bold text-blue-400">{teamAName}</span> and <span className="font-bold text-green-400">{teamBName}</span>. You need at least 2 players to form two teams.</p>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          placeholder="Enter player name"
          className="flex-grow bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={handleAddPlayer}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-md transition duration-200"
        >
          Add Player
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Player List ({players.length})</h3>
        <div className="max-h-60 overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700">
            {players.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No players added yet.</p>
            ) : (
                <ul className="divide-y divide-slate-700">
                {players.map(player => (
                    <li key={player.id} className="flex justify-between items-center p-2">
                    <span className="text-slate-200">{player.name}</span>
                    <button onClick={() => handleRemovePlayer(player.id)} className="text-red-500 hover:text-red-400 text-xs">Remove</button>
                    </li>
                ))}
                </ul>
            )}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={handleProceed}
          disabled={players.length < 2}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-md transition duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Proceed to Coin Toss
        </button>
      </div>
    </div>
  );
};

export default PlayerSetup;
