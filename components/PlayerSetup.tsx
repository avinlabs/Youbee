
import React, { useState, useCallback, useEffect } from 'react';
import { Player } from '../types.ts';

interface PlayerSetupProps {
  onPlayersSet: (players: Player[]) => void;
  players: Player[];
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onPlayersSet, players: initialPlayers }) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

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
    <div className="card p-6 md:p-8 rounded-xl shadow-2xl w-full animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-emerald-400">
          <span className="text-4xl font-black text-slate-500 mr-2">1</span>
          Add Players
        </h2>
        <p className="text-slate-400 mt-2">Create your player roster. You need at least 2 players.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-4 max-w-lg mx-auto">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          placeholder="Enter player name"
          className="flex-grow bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={handleAddPlayer}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-md transition duration-200"
        >
          Add Player
        </button>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      <div className="mt-6 max-w-lg mx-auto">
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Player List ({players.length})</h3>
        <div className="max-h-60 overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700">
            {players.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No players added yet.</p>
            ) : (
                <ul className="divide-y divide-slate-700">
                {players.map(player => (
                    <li key={player.id} className="flex justify-between items-center p-3">
                    <span className="text-slate-200 font-semibold">{player.name}</span>
                    <button onClick={() => handleRemovePlayer(player.id)} className="text-red-500 hover:text-red-400 font-bold text-lg">&times;</button>
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
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-12 rounded-md transition duration-200 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          Next: Setup Teams
        </button>
      </div>
    </div>
  );
};

export default PlayerSetup;