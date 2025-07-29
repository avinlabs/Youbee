import React, { useState, useMemo } from 'react';
import { Player, MatchConfig, Team } from '../types';

interface MatchSetupProps {
  allPlayers: Player[];
  onMatchStart: (config: MatchConfig) => void;
  teamA: Team;
  teamB: Team;
  battingTeamName: string;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ allPlayers, onMatchStart, teamA, teamB, battingTeamName }) => {
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [overs, setOvers] = useState<number>(5);
  const [openingBatsmanId, setOpeningBatsmanId] = useState<string>('');
  const [openingBowlerId, setOpeningBowlerId] = useState<string>('');
  const [error, setError] = useState('');

  const availablePlayers = useMemo(() => {
    const selectedIds = new Set([...teamAPlayers.map(p => p.id), ...teamBPlayers.map(p => p.id)]);
    return allPlayers.filter(p => !selectedIds.has(p.id));
  }, [allPlayers, teamAPlayers, teamBPlayers]);
  
  const battingTeamPlayers = battingTeamName === teamA.name ? teamAPlayers : teamBPlayers;
  const bowlingTeamPlayers = battingTeamName === teamA.name ? teamBPlayers : teamAPlayers;


  const handlePlayerAssign = (playerId: string, team: 'A' | 'B') => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;
    if (team === 'A') {
      setTeamAPlayers(prev => [...prev, player]);
    } else {
      setTeamBPlayers(prev => [...prev, player]);
    }
  };

  const handlePlayerRemove = (playerId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if(openingBatsmanId === playerId && battingTeamName === teamA.name) setOpeningBatsmanId('');
      if(openingBowlerId === playerId && battingTeamName === teamB.name) setOpeningBowlerId('');
      setTeamAPlayers(prev => prev.filter(p => p.id !== playerId));
    } else {
      if(openingBatsmanId === playerId && battingTeamName === teamB.name) setOpeningBatsmanId('');
      if(openingBowlerId === playerId && battingTeamName === teamA.name) setOpeningBowlerId('');
      setTeamBPlayers(prev => prev.filter(p => p.id !== playerId));
    }
  };

  const handleStartMatch = () => {
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      setError('Both teams must have at least one player.');
      return;
    }
    if (overs <= 0) {
      setError('Overs must be greater than 0.');
      return;
    }
    const openingBatsman = battingTeamPlayers.find(p => p.id === openingBatsmanId);
    if (!openingBatsman) {
      setError('Please select an opening batsman.');
      return;
    }
    const openingBowler = bowlingTeamPlayers.find(p => p.id === openingBowlerId);
    if (!openingBowler) {
      setError('Please select an opening bowler.');
      return;
    }

    onMatchStart({
      teamA: { ...teamA, players: teamAPlayers },
      teamB: { ...teamB, players: teamBPlayers },
      overs,
      battingTeamName,
      openingBatsman,
      openingBowler,
    });
  };

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700 w-full animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-emerald-400">4. Finalize Teams & Match Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team Selection */}
        <div className="space-y-4">
          <TeamSelector title={teamA.name} players={teamAPlayers} onRemove={pId => handlePlayerRemove(pId, 'A')} />
          <TeamSelector title={teamB.name} players={teamBPlayers} onRemove={pId => handlePlayerRemove(pId, 'B')} />
        </div>
        
        {/* Available Players */}
        <div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Available Players</h3>
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 min-h-[16rem]">
                {availablePlayers.length > 0 ? (
                    <ul className="space-y-2">
                        {availablePlayers.map(p => (
                            <li key={p.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                                <span>{p.name}</span>
                                <div className="space-x-2">
                                    <button onClick={() => handlePlayerAssign(p.id, 'A')} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">To {teamA.name}</button>
                                    <button onClick={() => handlePlayerAssign(p.id, 'B')} className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded">To {teamB.name}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-slate-500 text-center pt-10">No more players available.</p>}
             </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700">
        <h3 className="text-lg font-semibold text-slate-300 mb-4">Match Settings</h3>
         <p className="mb-4 bg-slate-700/50 p-3 rounded-md text-center text-emerald-300">
            <span className="font-bold">{battingTeamName}</span> won the toss and elected to bat first.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="overs" className="block text-sm font-medium text-slate-400 mb-1">Total Overs</label>
            <input
              type="number"
              id="overs"
              value={overs}
              onChange={e => setOvers(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-700 text-white border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="openingBatsman" className="block text-sm font-medium text-slate-400 mb-1">Opening Batsman</label>
            <select
              id="openingBatsman"
              value={openingBatsmanId}
              onChange={e => setOpeningBatsmanId(e.target.value)}
              className="w-full bg-slate-700 text-white border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={battingTeamPlayers.length === 0}
            >
              <option value="">Select Batsman</option>
              {battingTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
           <div>
            <label htmlFor="openingBowler" className="block text-sm font-medium text-slate-400 mb-1">Opening Bowler</label>
            <select
              id="openingBowler"
              value={openingBowlerId}
              onChange={e => setOpeningBowlerId(e.target.value)}
              className="w-full bg-slate-700 text-white border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={bowlingTeamPlayers.length === 0}
            >
              <option value="">Select Bowler</option>
              {bowlingTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      {error && <p className="text-red-400 text-center mt-4">{error}</p>}

      <div className="mt-8 text-center">
        <button
          onClick={handleStartMatch}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-md transition duration-200"
        >
          Start Match
        </button>
      </div>
    </div>
  );
};


const TeamSelector: React.FC<{title: string, players: Player[], onRemove: (playerId: string) => void}> = ({ title, players, onRemove}) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">{title} ({players.length})</h3>
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 min-h-[6rem]">
                {players.length > 0 ? (
                    <ul className="space-y-1">
                    {players.map(p => (
                        <li key={p.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md text-sm">
                            <span>{p.name}</span>
                            <button onClick={() => onRemove(p.id)} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                        </li>
                    ))}
                    </ul>
                ) : <p className="text-slate-500 text-center text-sm pt-5">No players selected.</p>}
            </div>
        </div>
    );
}

export default MatchSetup;
