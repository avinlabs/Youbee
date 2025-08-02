import React, { useState, useMemo, useEffect } from 'react';
import { Player, MatchConfig, Team, ScoreState } from '../types.ts';

interface MatchSetupProps {
  onMatchStart: (config: MatchConfig) => void;
  teamA: Team;
  teamB: Team;
  firstInningsSummary: ScoreState | null;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchStart, teamA, teamB, firstInningsSummary }) => {
  const isSecondInnings = firstInningsSummary !== null;
  
  const [overs, setOvers] = useState<number>(isSecondInnings ? firstInningsSummary.maxOvers : 12);
  const [tossWinnerName, setTossWinnerName] = useState<string>('');
  const [tossWinnerChoice, setTossWinnerChoice] = useState<'Bat' | 'Bowl'>('Bat');
  const [openingBatsmanId, setOpeningBatsmanId] = useState<string>('');
  const [openingBowlerId, setOpeningBowlerId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset selections if teams change, but not for second innings setup
    if (!isSecondInnings) {
        setTossWinnerName('');
    }
    setOpeningBatsmanId('');
    setOpeningBowlerId('');
  }, [teamA, teamB, isSecondInnings]);

  const { battingTeam, bowlingTeam } = useMemo(() => {
    if (isSecondInnings && firstInningsSummary) {
        return { 
            battingTeam: firstInningsSummary.bowlingTeam, 
            bowlingTeam: firstInningsSummary.battingTeam 
        };
    }
    
    if (!tossWinnerName) return { battingTeam: null, bowlingTeam: null };
    
    const loserTeamName = tossWinnerName === teamA.name ? teamB.name : teamA.name;
    const battingTeamName = tossWinnerChoice === 'Bat' ? tossWinnerName : loserTeamName;
    
    const battingT = battingTeamName === teamA.name ? teamA : teamB;
    const bowlingT = battingTeamName === teamA.name ? teamB : teamA;
    
    return { battingTeam: battingT, bowlingTeam: bowlingT };
  }, [tossWinnerName, tossWinnerChoice, teamA, teamB, isSecondInnings, firstInningsSummary]);

  useEffect(() => {
    setOpeningBatsmanId('');
    setOpeningBowlerId('');
  }, [battingTeam, bowlingTeam]);


  const handleStartMatch = () => {
    setError('');
    if (!isSecondInnings) {
      if (!tossWinnerName) {
        setError('Please select the team that won the toss.');
        return;
      }
      if (overs <= 0) {
        setError('Overs must be greater than 0.');
        return;
      }
    }
    const openingBatsman = battingTeam?.players.find(p => p.id === openingBatsmanId);
    if (!openingBatsman) {
      setError('Please select an opening batsman.');
      return;
    }
    const openingBowler = bowlingTeam?.players.find(p => p.id === openingBowlerId);
    if (!openingBowler) {
      setError('Please select an opening bowler.');
      return;
    }
    if (!battingTeam || !bowlingTeam) {
      setError('An error occurred setting up teams.');
      return;
    }

    onMatchStart({
      teamA,
      teamB,
      overs,
      battingTeamName: battingTeam.name,
      openingBatsman,
      openingBowler,
    });
  };

  const TeamRoster: React.FC<{ team: Team }> = ({ team }) => (
    <div>
        <h3 className="text-xl font-semibold text-slate-300 mb-3">{team.name}</h3>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/80 max-h-48 overflow-y-auto">
            <ul className="space-y-1">
                {team.players.map(p => (
                    <li key={p.id} className="text-slate-200 p-2 rounded bg-slate-800/80 font-medium text-sm">{p.name}</li>
                ))}
            </ul>
        </div>
    </div>
  );

  return (
    <div className="card p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-5xl mx-auto animate-fade-in-up border-cyan-500/20">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 flex items-center justify-center gap-4">
          <span className="flex items-center justify-center w-10 h-10 text-2xl font-black text-slate-900 bg-cyan-400 rounded-full">2</span>
          {isSecondInnings ? 'Setup Second Innings' : 'Finalize Match'}
        </h2>
        <p className="text-slate-400 mt-3">
          {isSecondInnings 
            ? `The target is set. Select your openers to begin the chase.` 
            : 'Set the toss result and match rules to begin.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <TeamRoster team={teamA} />
        <TeamRoster team={teamB} />
      </div>

      <div className="mt-8 pt-8 border-t border-slate-700/80">
        {isSecondInnings ? (
            <div className="animate-fade-in-up">
              <h3 className="text-xl font-semibold text-slate-300 mb-6 text-center">Second Innings Chase</h3>
              <p className="mb-6 bg-slate-800/60 p-4 rounded-lg text-center text-lg text-cyan-300 border border-cyan-500/30">
                  Target to Win: <span className="font-bold text-2xl">{firstInningsSummary.runs + 1}</span> runs in <span className="font-bold text-2xl">{firstInningsSummary.maxOvers}</span> overs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div>
                  <label htmlFor="openingBatsman" className="block text-sm font-medium text-slate-400 mb-2">Opening Batsman ({battingTeam?.name})</label>
                  <select
                    id="openingBatsman"
                    value={openingBatsmanId}
                    onChange={e => setOpeningBatsmanId(e.target.value)}
                    className="input-base"
                  >
                    <option value="">Select Batsman...</option>
                    {battingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="openingBowler" className="block text-sm font-medium text-slate-400 mb-2">Opening Bowler ({bowlingTeam?.name})</label>
                  <select
                    id="openingBowler"
                    value={openingBowlerId}
                    onChange={e => setOpeningBowlerId(e.target.value)}
                    className="input-base"
                  >
                    <option value="">Select Bowler...</option>
                    {bowlingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-slate-300 mb-6">Toss & Match Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {/* Toss Winner */}
                <div>
                  <label htmlFor="tossWinner" className="block text-sm font-medium text-slate-400 mb-2">Toss Won By</label>
                  <select
                    id="tossWinner"
                    value={tossWinnerName}
                    onChange={e => setTossWinnerName(e.target.value)}
                    className="input-base"
                  >
                    <option value="">Select winner...</option>
                    <option value={teamA.name}>{teamA.name}</option>
                    <option value={teamB.name}>{teamB.name}</option>
                  </select>
                </div>

                {/* Toss Choice */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Winner's Choice</label>
                    <div className="flex items-center gap-4 h-full">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="tossChoice" value="Bat" checked={tossWinnerChoice === 'Bat'} onChange={e => setTossWinnerChoice(e.target.value as 'Bat' | 'Bowl')} className="w-5 h-5 accent-cyan-500 bg-slate-700" />
                            <span className="font-semibold">Bat First</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="tossChoice" value="Bowl" checked={tossWinnerChoice === 'Bowl'} onChange={e => setTossWinnerChoice(e.target.value as 'Bat' | 'Bowl')} className="w-5 h-5 accent-cyan-500 bg-slate-700" />
                            <span className="font-semibold">Bowl First</span>
                        </label>
                    </div>
                </div>
            </div>

            {battingTeam && bowlingTeam && (
              <div className="mt-6 animate-fade-in-up">
                <p className="mb-6 bg-slate-800/60 p-4 rounded-lg text-center text-lg text-cyan-300 border border-cyan-500/30">
                    <span className="font-bold">{battingTeam.name}</span> will bat first.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="overs" className="block text-sm font-medium text-slate-400 mb-2">Total Overs</label>
                    <input
                      type="number"
                      id="overs"
                      value={overs}
                      onChange={e => setOvers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label htmlFor="openingBatsman" className="block text-sm font-medium text-slate-400 mb-2">Opening Batsman</label>
                    <select
                      id="openingBatsman"
                      value={openingBatsmanId}
                      onChange={e => setOpeningBatsmanId(e.target.value)}
                      className="input-base"
                    >
                      <option value="">Select Batsman...</option>
                      {battingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="openingBowler" className="block text-sm font-medium text-slate-400 mb-2">Opening Bowler</label>
                    <select
                      id="openingBowler"
                      value={openingBowlerId}
                      onChange={e => setOpeningBowlerId(e.target.value)}
                      className="input-base"
                    >
                      <option value="">Select Bowler...</option>
                      {bowlingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {error && <p className="text-red-400 text-center mt-6">{error}</p>}

      <div className="mt-10 text-center">
        <button
          onClick={handleStartMatch}
          disabled={!battingTeam}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-16 rounded-lg transition duration-200 shadow-lg shadow-emerald-600/20 transform hover:scale-105"
        >
          {isSecondInnings ? 'Start Chase' : 'Start Match'}
        </button>
      </div>
    </div>
  );
};

export default MatchSetup;