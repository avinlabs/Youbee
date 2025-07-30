
import React, { useState, useRef, useEffect } from 'react';
import { Player, ScoreState, ScoreAction } from '../types.ts';

interface ScoreboardProps {
  state: ScoreState;
  dispatch: React.Dispatch<ScoreAction>;
  onNewGame: () => void;
  onNextInnings: (finalState: ScoreState) => void;
  onPredictMotm: () => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ state, dispatch, onNewGame, onNextInnings, onPredictMotm }) => {
    const [showNextBatsmanModal, setShowNextBatsmanModal] = useState(false);
    const [nextBatsmanId, setNextBatsmanId] = useState('');

    const [showNextBowlerModal, setShowNextBowlerModal] = useState(false);
    const [nextBowlerId, setNextBowlerId] = useState('');
    
    const prevOvers = useRef(state.oversCompleted);
    const prevWickets = useRef(state.wickets);
    const prevRetired = useRef(state.retiredBatsmen.length);

    // Effect to handle end-of-over bowler change
    useEffect(() => {
        if (state.oversCompleted > prevOvers.current && !state.inningsOver) {
            setShowNextBowlerModal(true);
        }
        prevOvers.current = state.oversCompleted;
    }, [state.oversCompleted, state.inningsOver]);

    // Effect to handle new batsman after wicket or retirement
    useEffect(() => {
      const wicketTaken = state.wickets > prevWickets.current;
      const batsmanRetired = state.retiredBatsmen.length > prevRetired.current;

      if ((wicketTaken || batsmanRetired) && !state.inningsOver) {
        if (state.wickets < state.battingTeam.players.length) { // Last man standing logic
          setShowNextBatsmanModal(true);
        }
      }
      prevWickets.current = state.wickets;
      prevRetired.current = state.retiredBatsmen.length;
    }, [state.wickets, state.retiredBatsmen.length, state.inningsOver, state.battingTeam.players.length]);


    const handleWicket = () => {
        dispatch({ type: 'WICKET' });
    };

    const handleRetire = () => {
        if (state.remainingBatsmen.length > 0 || state.retiredBatsmen.length > 0) {
            dispatch({ type: 'RETIRE_BATSMAN' });
        }
    };
    
    const confirmNextBatsman = () => {
        const nextPlayer = [...state.remainingBatsmen, ...state.retiredBatsmen].find(p => p.id === nextBatsmanId);
        if(nextPlayer) {
            dispatch({ type: 'SET_NEXT_BATSMAN', payload: nextPlayer });
            setShowNextBatsmanModal(false);
            setNextBatsmanId('');
        }
    };
    
    const confirmNextBowler = () => {
        const nextPlayer = state.bowlingTeam.players.find(p => p.id === nextBowlerId);
        if(nextPlayer) {
            dispatch({ type: 'SET_NEXT_BOWLER', payload: nextPlayer });
            setShowNextBowlerModal(false);
            setNextBowlerId('');
        }
    };

    const handleUndo = () => {
        dispatch({ type: 'UNDO_OVER' });
    };

    const currentBatsman = state.battingStats[state.currentBatsmanId];
    const currentBowler = state.bowlingStats[state.currentBowlerId];
    const battingTeamName = state.battingTeam.name;
    const oversDisplay = `${state.oversCompleted}.${state.ballsInCurrentOver}`;
    const innings = state.target === null ? 1 : 2;

    const eventStyle = (event: string) => {
        if (event === '4' || event === '4n') return 'bg-green-500 text-white';
        if (event === 'Wkt') return 'bg-red-500 text-white';
        if (event === 'Wd') return 'bg-yellow-500 text-slate-900';
        return 'bg-slate-700 text-slate-200';
    }

    return (
        <div className="card p-4 md:p-6 rounded-xl shadow-2xl w-full">
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-slate-300">
                    <span className="font-bold text-blue-400">{battingTeamName}</span> Batting (Innings {innings})
                </h2>
                {innings === 2 && state.target && <p className="text-slate-400 mt-1">Target: <span className="text-white font-bold">{state.target} Runs</span> ({Math.ceil(state.target/4)} Fours)</p>}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6">
                <div className="text-center">
                    <p className="text-6xl md:text-8xl font-black tracking-tighter text-white">{state.fours}</p>
                    <p className="text-xl text-slate-400 font-semibold tracking-normal -mt-2">Fours</p>
                </div>
                <div className="text-4xl md:text-5xl font-thin text-slate-600">/</div>
                <div className="text-center">
                    <p className="text-6xl md:text-8xl font-black tracking-tighter text-white">{state.wickets}</p>
                    <p className="text-xl text-slate-400 font-semibold tracking-normal -mt-2">Wickets</p>
                </div>
            </div>
            <p className="text-lg text-slate-400 mt-2 text-center">
                Overs: <span className="font-bold text-white">{oversDisplay} / {state.maxOvers}</span>
                <span className="ml-4 text-rose-400" title="3 wides in an over add 4 bonus runs and count as a four">Wides: <span className="font-bold text-white">{state.widesInCurrentOver}</span></span>
            </p>

            <div className="my-6">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-center">This Over</h4>
                <div className="flex flex-wrap justify-center gap-2 mt-2 p-3 bg-slate-900/50 rounded-lg min-h-[52px] items-center">
                    {state.currentOverEvents.length > 0 ? (
                        state.currentOverEvents.map((event, index) => (
                            <span key={index} className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-md ${eventStyle(event)}`}>
                                {event}
                            </span>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm">Waiting for first ball...</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Batting</p>
                    <p className="text-xl text-emerald-300 font-bold truncate">{currentBatsman?.playerName || 'N/A'}</p>
                    <p className="text-slate-200 mt-1">
                        <span className="font-bold">{currentBatsman?.fours || 0}</span> Fours (<span className="font-bold">{currentBatsman?.ballsFaced || 0}</span> balls)
                    </p>
                </div>
                 <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Bowling</p>
                    <p className="text-xl text-cyan-300 font-bold truncate">{currentBowler?.playerName || 'N/A'}</p>
                    <p className="text-slate-200 mt-1">
                        <span className="font-bold">{currentBowler?.wickets || 0}</span> Wkts for <span className="font-bold">{currentBowler?.runsConceded || 0}</span> runs
                    </p>
                </div>
            </div>

            {state.inningsOver ? (
                 <div className="text-center p-8 bg-slate-900/50 rounded-lg animate-fade-in-up">
                    <h3 className="text-3xl font-bold text-yellow-400">{state.statusMessage}</h3>
                    <p className="text-lg mt-2 text-slate-300">Final Score: {state.fours} Fours / {state.wickets} Wickets</p>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                        {innings === 1 && !state.matchOver ? (
                          <button onClick={() => onNextInnings(state)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-md transition duration-200 shadow-lg shadow-green-600/20">
                              Start Second Innings
                          </button>
                        ) : (
                          <>
                            <button onClick={onNewGame} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-md transition duration-200 shadow-lg shadow-blue-600/20">
                                Start New Game
                            </button>
                             <button onClick={onPredictMotm} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-md transition duration-200 shadow-lg shadow-purple-600/20">
                                ✨ Predict Man of the Match
                            </button>
                          </>
                        )}
                    </div>
                 </div>
            ) : showNextBatsmanModal ? (
                <div className="text-center p-6 bg-slate-900/50 rounded-lg animate-fade-in-up">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">Select Next Batsman</h3>
                    <div className="flex justify-center gap-2">
                         <select
                            value={nextBatsmanId}
                            onChange={(e) => setNextBatsmanId(e.target.value)}
                            className="bg-slate-700 text-white border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Select batsman</option>
                            {state.remainingBatsmen.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            {state.retiredBatsmen.length > 0 && <option disabled>--- Retired ---</option>}
                            {state.retiredBatsmen.map(p => <option key={p.id} value={p.id}>{p.name} (R)</option>)}
                        </select>
                        <button onClick={confirmNextBatsman} disabled={!nextBatsmanId} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:bg-slate-600">
                            Confirm
                        </button>
                    </div>
                </div>
            ) : showNextBowlerModal ? (
                <div className="text-center p-6 bg-slate-900/50 rounded-lg animate-fade-in-up">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">Over Complete! Select New Bowler</h3>
                    <div className="flex justify-center gap-2">
                         <select
                            value={nextBowlerId}
                            onChange={(e) => setNextBowlerId(e.target.value)}
                            className="bg-slate-700 text-white border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Select next bowler</option>
                            {state.bowlingTeam.players
                                .filter(p => p.id !== state.currentBowlerId)
                                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={confirmNextBowler} disabled={!nextBowlerId} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:bg-slate-600">
                            Confirm
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {/* Scoring Buttons */}
                        <button onClick={() => dispatch({ type: 'SCORE', payload: 0 })} className="h-24 bg-navy-900/70 hover:bg-navy-800/80 border border-slate-700 rounded-lg text-xl font-bold transition duration-200 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black">0</span>
                          <span className="text-sm font-semibold text-slate-400">DOT BALL</span>
                        </button>
                        <button onClick={() => dispatch({ type: 'SCORE', payload: 4 })} className="h-24 bg-green-600/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-xl font-bold transition duration-200 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-green-300">4</span>
                          <span className="text-sm font-semibold text-green-400">FOUR</span>
                        </button>
                        <button onClick={handleWicket} className="h-24 bg-red-600/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-lg font-bold transition duration-200 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-red-300">WICKET</span>
                          <span className="text-sm font-semibold text-red-400">OUT!</span>
                        </button>
                        <button onClick={() => dispatch({ type: 'EXTRA', payload: { runs: 1, type: 'Wd' } })} className="h-24 bg-yellow-600/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-lg font-bold transition duration-200 text-yellow-300">WIDE</button>
                        <button onClick={() => dispatch({ type: 'EXTRA', payload: { runs: 4, type: 'Nb' } })} className="h-24 bg-indigo-600/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-lg font-bold transition duration-200 text-indigo-300">NO BALL + 4</button>
                        <button onClick={handleRetire} disabled={state.remainingBatsmen.length === 0 && state.retiredBatsmen.length === 0} className="h-24 bg-fuchsia-600/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/50 rounded-lg text-lg font-bold transition duration-200 text-fuchsia-300 disabled:opacity-50 disabled:cursor-not-allowed">RETIRE</button>
                    </div>
                </>
            )}
            
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
                 <button 
                    onClick={handleUndo} 
                    disabled={state.inningsOver || state.history.length <= 1}
                    className="text-sm font-semibold bg-yellow-700/80 hover:bg-yellow-600 text-yellow-100 py-2 px-4 rounded-md transition duration-200 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    Reset Current Over
                </button>
                <button 
                    onClick={onNewGame} 
                    className="text-slate-500 hover:text-slate-400 text-sm transition duration-200"
                >
                    Reset & New Game
                </button>
            </div>
        </div>
    );
};

export default Scoreboard;