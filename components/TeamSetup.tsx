import React, { useState } from 'react';

interface TeamSetupProps {
  onTeamsSet: (teamAName: string, teamBName: string) => void;
}

const TeamSetup: React.FC<TeamSetupProps> = ({ onTeamsSet }) => {
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [error, setError] = useState('');

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
    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700 w-full animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-emerald-400">1. Setup Your Teams</h2>
      <p className="text-slate-400 mb-6">Start by giving your two competing teams a name.</p>
      
      <div className="space-y-4 mb-4">
        <div>
            <label htmlFor="teamA" className="block text-sm font-medium text-slate-300 mb-1">Team A Name</label>
            <input
              type="text"
              id="teamA"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              placeholder="E.g., Royal Challengers"
              className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
        <div>
            <label htmlFor="teamB" className="block text-sm font-medium text-slate-300 mb-1">Team B Name</label>
            <input
              type="text"
              id="teamB"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              placeholder="E.g., Mumbai Indians"
              className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
      
      <div className="mt-8 text-center">
        <button
          onClick={handleProceed}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-md transition duration-200"
        >
          Next: Add Players
        </button>
      </div>
    </div>
  );
};

export default TeamSetup;
