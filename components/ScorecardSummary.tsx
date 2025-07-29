import React from 'react';
import { ScoreState } from '../types';

interface ScorecardSummaryProps {
  summary: ScoreState;
  teamName: string;
}

const ScorecardSummary: React.FC<ScorecardSummaryProps> = ({ summary, teamName }) => {
  const oversDisplay = `${summary.oversCompleted}.${summary.ballsInCurrentOver}`;
  
  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700 w-full animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-slate-300 mb-6">1st Innings Summary</h2>
      <div className="bg-slate-900/50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-blue-400 text-center">{teamName}</h3>
        <div className="my-4 text-center">
          <p className="text-5xl md:text-7xl font-black tracking-tighter text-white">
              {summary.fours}
              <span className="text-2xl md:text-3xl text-slate-400 font-semibold tracking-normal ml-2">Fours</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;{summary.wickets}
              <span className="text-2xl md:text-3xl text-slate-400 font-semibold tracking-normal ml-2">Wickets</span>
          </p>
          <p className="text-xl text-slate-300 mt-2">Total Runs: {summary.runs}</p>
          <p className="text-lg text-slate-400 mt-2">
              Overs: {oversDisplay} / {summary.maxOvers}
          </p>
        </div>
        <p className="text-center text-slate-500 mt-4">This innings is complete.</p>
      </div>
    </div>
  );
};

export default ScorecardSummary;
