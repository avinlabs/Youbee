import React, { useState, useEffect } from 'react';
import { Team } from '../types';

interface TeamSetupProps {
  onTeamsSet: (teamAName: string, teamBName: string) => void;
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
    <div className="card p-6 md:p-8 rounded-xl shadow-2xl w-full animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-emerald-400">
          <span className="text-4xl font-black text-slate-500 mr-2">2</span>
          Setup Your Teams
        </h2>
        <p className="text-slate-400 mt-2">Give your two competing teams a name.</p>
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
              className="w-full bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center my-6">{error}</p>}
      
      <div className="mt-8 text-center">
        <button
          onClick={handleProceed}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-12 rounded-md transition duration-200"
        >
          Next: Coin Toss
        </button>
      </div>
    </div>
  );
};

export default TeamSetup;