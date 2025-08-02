import React, { useState, useEffect } from 'react';
import { Team } from '../types.ts';

interface TeamSetupProps {
  onTeamsSet: (teamAName: string, teamBName:string) => void;
  teamA: Team;
  teamB: Team;
}

const TeamSetup: React.FC<TeamSetupProps> = ({ onTeamsSet, teamA, teamB }) => {
  const [teamAName, setTeamAName] = useState(teamA?.name || '');
  const [teamBName, setTeamBName] = useState(teamB?.name || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setTeamAName(teamA?.name || '');
    setTeamBName(teamB?.name || '');
  }, [teamA, teamB]);

  const handleProceed = () => {
    const nameA = teamAName.trim();
    const nameB = teamBName.trim();
    if (nameA === '' || nameB === '') {
      setError('Both team names are required.');
      return;
    }
    if (nameA.toLowerCase() === nameB.toLowerCase()) {
      setError('Team names must be different.');
      return;
    }
    onTeamsSet(nameA, nameB);
  };

  return (
    <div className="card p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-lg mx-auto animate-fade-in-up border-cyan-500/20">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 flex items-center justify-center gap-4">
          <span className="flex items-center justify-center w-10 h-10 text-2xl font-black text-slate-900 bg-cyan-400 rounded-full">2</span>
          Setup Your Teams
        </h2>
        <p className="text-slate-400 mt-3">Give your two competing teams a name.</p>
      </div>
      
      <div className="space-y-6 mb-4 max-w-lg mx-auto">
        <div>
            <label htmlFor="teamA" className="block text-sm font-medium text-slate-300 mb-2">Team A Name</label>
            <input
              type="text"
              id="teamA"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              placeholder="E.g., Royal Challengers"
              className="input-base"
            />
        </div>
        <div>
            <label htmlFor="teamB" className="block text-sm font-medium text-slate-300 mb-2">Team B Name</label>
            <input
              type="text"
              id="teamB"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              placeholder="E.g., Mumbai Indians"
              className="input-base"
            />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center my-6">{error}</p>}
      
      <div className="mt-8 md:mt-10 text-center">
        <button
          onClick={handleProceed}
          className="btn-primary w-full"
        >
          Next: Coin Toss
        </button>
      </div>
    </div>
  );
};

export default TeamSetup;