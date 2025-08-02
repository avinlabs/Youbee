
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
    <div className="card p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto animate-fade-in-up border-cyan-500/20">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 flex items-center justify-center gap-4">
          <span className="flex items-center justify-center w-10 h-10 text-2xl font-black text-slate-900 bg-cyan-400 rounded-full">1</span>
          Add Players
        </h2>
        <p className="text-slate-400 mt-3">Create your player roster. You need at least 2 players.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-4 max-w-lg mx-auto">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          placeholder="Enter player name"
          className="input-base flex-grow"
        />
        <button
          onClick={handleAddPlayer}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
        >
          Add Player
        </button>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      <div className="mt-8 max-w-lg mx-auto">
        <h3 className="text-lg font-semibold text-slate-300 mb-3">Player List ({players.length})</h3>
        <div className="max-h-48 md:max-h-60 overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700/80">
            {players.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No players added yet.</p>
            ) : (
                <ul className="space-y-2">
                {players.map((player, index) => (
                    <li key={player.id} className={`flex justify-between items-center p-3 rounded-md transition-colors ${index % 2 === 0 ? 'bg-slate-800/60' : 'bg-slate-800/30'}`}>
                        <span className="text-slate-200 font-semibold">{player.name}</span>
                        <button onClick={() => handleRemovePlayer(player.id)} className="btn-danger">&times;</button>
                    </li>
                ))}
                </ul>
            )}
        </div>
      </div>
      
      <div className="mt-8 md:mt-10 text-center">
        <button
          onClick={handleProceed}
          disabled={players.length < 2}
          className="btn-primary w-full"
        >
          Next: Setup Teams
        </button>
      </div>
    </div>
  );
};

export default PlayerSetup;