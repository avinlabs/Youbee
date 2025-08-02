
import React, { useState } from 'react';
import { ScoreState, Team, ShareableScorecardState } from '../types.ts';

interface FullScorecardProps {
  firstInnings: ScoreState | null;
  currentInnings: ScoreState;
  teamA: Team;
  teamB: Team;
  onClose: () => void;
  isPublicView?: boolean;
}

const StatTable: React.FC<{ title: string, headers: string[], children: React.ReactNode }> = ({ title, headers, children }) => (
    <div className="mb-8">
        <h4 className="text-lg font-semibold text-cyan-400 mb-3">{title}</h4>
        <div className="overflow-x-auto rounded-lg border border-slate-700/80">
            <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                    <tr>
                        {headers.map(h => <th key={h} scope="col" className="px-6 py-4">{h}</th>)}
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
    const battingOrder = Object.values(innings.battingStats).sort((a, b) => {
        if(a.status === 'Not Out' && b.status !== 'Not Out') return -1;
        if(b.status === 'Not Out' && a.status !== 'Not Out') return 1;
        return 0;
    });
    const bowlingOrder = Object.values(innings.bowlingStats).filter(b => b.overs > 0 || b.wickets > 0 || b.runsConceded > 0 || (innings.currentBowlerId === b.playerId && innings.ballsInCurrentOver > 0 && !innings.inningsOver));

    return (
        <div className="bg-slate-900/40 p-6 rounded-xl mb-8 border border-slate-700/80">
            <h3 className="text-xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500">{innings.battingTeam.name} - {inningsNum === 1 ? '1st' : '2nd'} Innings</h3>
             
            <StatTable title="Batting" headers={['Batsman', 'Status', 'Fours', 'Balls']}>
                {battingOrder.map(stats => (
                    <tr key={stats.playerId} className="border-b border-slate-700/80 last:border-b-0 hover:bg-slate-800/40 transition-colors">
                        <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-white">{stats.playerName}{stats.status === 'Not Out' ? '*' : ''}</th>
                        <td className={`px-6 py-4 ${stats.status === 'Out' ? 'text-red-400' : 'text-slate-300'}`}>{stats.status}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">{stats.fours}</td>
                        <td className="px-6 py-4">{stats.ballsFaced}</td>
                    </tr>
                ))}
            </StatTable>

            <StatTable title="Bowling" headers={['Bowler', 'Overs', 'Wickets', 'Dots', '4s', 'Wides']}>
                 {bowlingOrder.map(stats => {
                    const balls = (stats.playerId === innings.currentBowlerId && !innings.inningsOver) ? innings.ballsInCurrentOver : 0;
                    return (
                        <tr key={stats.playerId} className="border-b border-slate-700/80 last:border-b-0 hover:bg-slate-800/40 transition-colors">
                            <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-white">{stats.playerName}</th>
                            <td className="px-6 py-4">{`${stats.overs}.${balls}`}</td>
                            <td className="px-6 py-4 font-semibold text-cyan-400">{stats.wickets}</td>
                            <td className="px-6 py-4">{stats.dotBalls || 0}</td>
                            <td className="px-6 py-4">{stats.foursConceded || 0}</td>
                            <td className="px-6 py-4">{stats.wides}</td>
                        </tr>
                    )
                 })}
            </StatTable>

            <div className="text-right font-semibold text-slate-300 text-lg mt-4 pr-4">
                Total: <span className="font-bold text-white text-xl">{innings.fours} Fours / {innings.wickets} Wickets</span> in <span className="font-bold text-white text-xl">{`${innings.oversCompleted}.${innings.ballsInCurrentOver}`}</span> Overs
            </div>
        </div>
    );
}

const FullScorecard: React.FC<FullScorecardProps> = ({ firstInnings, currentInnings, teamA, teamB, onClose, isPublicView = false }) => {
  const [copyStatus, setCopyStatus] = useState('Share Match');
  
  const handleShare = () => {
    const dataToShare: ShareableScorecardState = {
      firstInnings,
      currentInnings,
      teamA,
      teamB,
    };
    try {
      const jsonString = JSON.stringify(dataToShare);
      const encodedData = btoa(encodeURIComponent(jsonString));
      const shareUrl = `${window.location.origin}${window.location.pathname}#share/${encodedData}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Share Match'), 2000);
      }, () => {
        setCopyStatus('Failed to copy');
        setTimeout(() => setCopyStatus('Share Match'), 2000);
      });
    } catch (error) {
        console.error("Error creating share link:", error);
        setCopyStatus('Error!');
        setTimeout(() => setCopyStatus('Share Match'), 2000);
    }
  };

  const containerClasses = isPublicView
    ? "card rounded-2xl shadow-2xl w-full max-w-4xl mx-auto overflow-y-auto border-cyan-500/20"
    : "fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up";

  const mainContentClasses = isPublicView
    ? ""
    : "card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-cyan-500/20";

  const ScorecardContent = () => (
    <div className={mainContentClasses} onClick={isPublicView ? undefined : e => e.stopPropagation()}>
      <div className="p-6 sticky top-0 bg-slate-900/70 backdrop-blur-sm z-10 border-b border-slate-700/80 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-100">Full Match Scorecard</h2>
          {!isPublicView && (
            <button
              onClick={handleShare}
              className="text-sm font-semibold bg-emerald-600/80 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition duration-200"
            >
              {copyStatus}
            </button>
          )}
        </div>
        {!isPublicView && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-bold">&times;</button>
        )}
      </div>
      <div className="p-4 sm:p-8">
        {firstInnings && <InningsCard innings={firstInnings} inningsNum={1} />}
        {currentInnings && <InningsCard innings={currentInnings} inningsNum={currentInnings.target ? 2 : 1} />}
        {currentInnings.statusMessage && (
          <div className="text-center p-6 bg-slate-800/60 rounded-xl border border-yellow-500/30">
            <h3 className="text-2xl font-bold text-yellow-400">{currentInnings.statusMessage}</h3>
          </div>
        )}
      </div>
    </div>
  );

  if (isPublicView) {
    return <ScorecardContent />;
  }

  return (
    <div className={containerClasses} onClick={onClose}>
      <ScorecardContent />
    </div>
  );
};

export default FullScorecard;