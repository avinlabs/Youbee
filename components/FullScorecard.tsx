
import React from 'react';
import { ScoreState } from '../types.ts';

interface FullScorecardProps {
  firstInnings: ScoreState | null;
  currentInnings: ScoreState;
  onClose: () => void;
}

const StatTable: React.FC<{ title: string, headers: string[], children: React.ReactNode }> = ({ title, headers, children }) => (
    <div className="mb-6">
        <h4 className="text-lg font-semibold text-emerald-400 mb-2">{title}</h4>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                    <tr>
                        {headers.map(h => <th key={h} scope="col" className="px-4 py-2">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    </div>
);


const InningsCard: React.FC<{ innings: ScoreState, inningsNum: 1 | 2 }> = ({ innings, inningsNum }) => {
    const battingOrder = Object.values(innings.battingStats)
        .sort((a,b) => (a.status === 'Not Out' && b.status !== 'Not Out' ? 1 : -1))
        .sort((a,b) => (a.ballsFaced > 0 ? -1 : 1));

    const bowlingOrder = Object.values(innings.bowlingStats).filter(b => b.overs > 0 || b.ballsInCurrentOver > 0 || b.runsConceded > 0 || b.wickets > 0);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-blue-400">{innings.battingTeam.name} - {inningsNum === 1 ? '1st' : '2nd'} Innings</h3>
                <p className="text-slate-400 text-sm">Total: <span className="font-bold text-white">{innings.runs}/{innings.wickets}</span> in <span className="font-bold text-white">{`${innings.oversCompleted}.${innings.ballsInCurrentOver}`}</span> Overs</p>
            </div>
             
            <StatTable title="Batting" headers={['Batsman', 'Status', 'Runs', 'Fours', 'Balls']}>
                {battingOrder.map(stats => (
                    <tr key={stats.playerId} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <th scope="row" className="px-4 py-2 font-medium whitespace-nowrap">{stats.playerName}</th>
                        <td className="px-4 py-2">{stats.status}</td>
                        <td className="px-4 py-2 font-bold">{stats.runs}</td>
                        <td className="px-4 py-2">{stats.fours}</td>
                        <td className="px-4 py-2">{stats.ballsFaced}</td>
                    </tr>
                ))}
            </StatTable>

            <StatTable title="Bowling" headers={['Bowler', 'Overs', 'Runs', 'Wickets', 'Wides']}>
                 {bowlingOrder.map(stats => (
                    <tr key={stats.playerId} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <th scope="row" className="px-4 py-2 font-medium whitespace-nowrap">{stats.playerName}</th>
                        <td className="px-4 py-2">{`${stats.overs}.${stats.ballsInCurrentOver}`}</td>
                        <td className="px-4 py-2">{stats.runsConceded}</td>
                        <td className="px-4 py-2 font-bold">{stats.wickets}</td>
                        <td className="px-4 py-2">{stats.wides}</td>
                    </tr>
                ))}
            </StatTable>
        </div>
    );
}

const FullScorecard: React.FC<FullScorecardProps> = ({ firstInnings, currentInnings, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sticky top-0 bg-slate-900 z-10 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-100">Full Match Scorecard</h2>
            <button onClick={onClose} className="text-3xl text-slate-400 hover:text-white leading-none">&times;</button>
        </div>
        <div className="p-6">
            {firstInnings && <InningsCard innings={firstInnings} inningsNum={1} />}
            {currentInnings && <InningsCard innings={currentInnings} inningsNum={currentInnings.target ? 2 : 1} />}
        </div>
      </div>
    </div>
  );
};

export default FullScorecard;