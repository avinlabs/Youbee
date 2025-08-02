import React, { useState, useMemo } from 'react';
import { Team } from '../types.ts';
import { DEFAULT_TEAMS } from '../defaultData.ts';

interface TeamSelectionProps {
  onTeamsSelected: (teamA: Team, teamB: Team) => void;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({ onTeamsSelected }) => {
  const [selectedTeamNames, setSelectedTeamNames] = useState<string[]>([]);

  const handleTeamSelect = (teamName: string) => {
    setSelectedTeamNames(currentSelected => {
      if (currentSelected.includes(teamName)) {
        return currentSelected.filter(name => name !== teamName);
      }
      if (currentSelected.length < 2) {
        return [...currentSelected, teamName];
      }
      return currentSelected;
    });
  };

  const handleProceed = () => {
    if (selectedTeamNames.length === 2) {
      const teamA = DEFAULT_TEAMS.find(t => t.name === selectedTeamNames[0]);
      const teamB = DEFAULT_TEAMS.find(t => t.name === selectedTeamNames[1]);
      if (teamA && teamB) {
        onTeamsSelected(teamA, teamB);
      }
    }
  };
  
  const getTeamColor = (name: string) => {
    if (name.includes('Blue')) return 'border-cyan-500';
    if (name.includes('Black')) return 'border-slate-500';
    if (name.includes('White')) return 'border-slate-200';
    return 'border-slate-700';
  }

  return (
    <div className="card p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-5xl mx-auto animate-fade-in-up border-cyan-500/20">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 flex items-center justify-center gap-4">
          <span className="flex items-center justify-center w-10 h-10 text-2xl font-black text-slate-900 bg-cyan-400 rounded-full">1</span>
          Select Teams
        </h2>
        <p className="text-slate-400 mt-3">Choose the two teams that will face off in today's match.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEFAULT_TEAMS.map(team => {
            const isSelected = selectedTeamNames.includes(team.name);
            const isFull = selectedTeamNames.length === 2 && !isSelected;
            return (
                <div 
                    key={team.name}
                    onClick={() => !isFull && handleTeamSelect(team.name)}
                    className={`p-6 rounded-xl border-4 transition-all duration-300 cursor-pointer ${ isSelected ? getTeamColor(team.name) + ' scale-105 shadow-2xl' : 'border-slate-800 hover:border-slate-700' } ${ isFull ? 'opacity-50 cursor-not-allowed' : '' }`}
                >
                    <h3 className="text-xl font-bold text-center mb-4">{team.name}</h3>
                    <ul className="space-y-2 text-sm max-h-48 overflow-y-auto bg-slate-900/50 p-2 rounded-lg">
                        {team.players.map(player => (
                            <li key={player.id} className="text-slate-300 p-1.5 rounded bg-slate-800/50 text-center font-medium">{player.name}</li>
                        ))}
                    </ul>
                </div>
            )
        })}
      </div>

      <div className="mt-8 md:mt-10 text-center">
        <button
          onClick={handleProceed}
          disabled={selectedTeamNames.length !== 2}
          className="btn-primary w-full sm:w-auto"
        >
          Next: Finalize Match
        </button>
      </div>
    </div>
  );
};

export default TeamSelection;
