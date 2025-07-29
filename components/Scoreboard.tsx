
import React, { useState, useRef, useEffect } from 'react';
import { Player, ScoreState, ScoreAction } from '../types.ts';

interface ScoreboardProps {
  state: ScoreState;
  dispatch: React.Dispatch<ScoreAction>;
  onNewGame: () => void;
  onNextInnings: (finalState: ScoreState) => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ state, dispatch, onNewGame, onNextInnings }) => {
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
        if (state.wickets < state.battingTeam.players.length - 1) {
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

    return (
        <div className="bg-slate-800 p-4 md:p-8 rounded-xl shadow-2xl border border-slate-700 w-full animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-300">
                    <span className="text-blue-400">{battingTeamName}</span> Batting
                    {innings === 2 && state.target && <span className="text-slate-400 ml-4">Target: <span className="text-white font-bold">{Math.ceil(state.target / 4)} Fours</span></span>}
                </h2>
                <div className="my-4">
                    <p className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                        {state.fours}
                        <span className="text-2xl md:text-3xl text-slate-400 font-semibold tracking-normal ml-2">Fours</span>
                        &nbsp;&nbsp;/&nbsp;&nbsp;{state.wickets}
                        <span className="text-2xl md:text-3xl text-slate-400 font-semibold tracking-normal ml-2">Wickets</span>
                    </p>
                    <p className="text-lg text-slate-400 mt-2">
                        Overs: {oversDisplay} / {state.maxOvers}
                        <span className="ml-4 text-rose-400" title="3 wides in an over add 4 bonus runs and count as a four">Wides: {state.widesInCurrentOver}</span>
                    </p>
                </div>
                 <div className="mt-4 mb-6">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">This Over</h4>
                    <div className="flex flex-wrap justify-center gap-2 mt-2 p-3 bg-slate-900/50 rounded-lg min-h-[52px] items-center">
                        {state.currentOverEvents.length > 0 ? (
                            state.currentOverEvents.map((event, index) => (
                                <span key={index} className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-slate-700 text-slate-200">
                                    {event}
                                </span>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">Waiting for first ball...</p>
                        )}
                    </div>
                </div>
                <div className="flex justify-around items-start text-center mt-4 p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex-1">
                        <p className="text-sm text-slate-400 uppercase tracking-wider">On Strike</p>
                        <p className="text-lg text-emerald-300 font-bold truncate">{currentBatsman?.playerName || 'N/A'}</p>
                    </div>
                    <div className="flex-1 border-l border-slate-700">
                        <p className="text-sm text-slate-400 uppercase tracking-wider">Bowling</p>
                        <p className="text-lg text-cyan-300 font-bold truncate">{currentBowler?.playerName || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {state.inningsOver ? (
                 <div className="text-center p-8 bg-slate-900/50 rounded-lg">
                    <h3 className="text-3xl font-bold text-yellow-400">{state.statusMessage}</h3>
                    <p className="text-lg mt-2 text-slate-300">Final Score: {state.runs} ({state.fours} Fours) / {state.wickets}</p>
                    {innings === 1 && !state.matchOver ? (
                      <button onClick={() => onNextInnings(state)} className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-md transition duration-200">
                          Start Second Innings
                      </button>
                    ) : (
                      <button onClick={onNewGame} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-md transition duration-200">
                          Start New Game
                      </button>
                    )}
                 </div>
            ) : showNextBatsmanModal ? (
                <div className="text-center p-6 bg-slate-900/50 rounded-lg">
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
                <div className="text-center p-6 bg-slate-900/50 rounded-lg">
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
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                        {/* Scoring Buttons */}
                        <button onClick={() => dispatch({ type: 'SCORE', payload: 0 })} className="py-4 bg-navy-900 hover:bg-navy-800 rounded-lg text-xl font-bold transition duration-200">0</button>
                        <button onClick={() => dispatch({ type: 'SCORE', payload: 4 })} className="py-4 bg-navy-900 hover:bg-navy-800 rounded-lg text-xl font-bold transition duration-200">4</button>
                        
                        {/* Action Buttons */}
                        <button onClick={() => dispatch({ type: 'EXTRA', payload: { runs: 1, type: 'Wd' } })} className="py-4 bg-indigo-900 hover:bg-indigo-800 rounded-lg text-lg font-bold transition duration-200">Wide</button>
                        <button onClick={() => dispatch({ type: 'EXTRA', payload: { runs: 4, type: 'Nb' } })} className="py-4 bg-indigo-900 hover:bg-indigo-800 rounded-lg text-lg font-bold transition duration-200 col-span-2 md:col-span-1">No Ball + 4</button>
                        <button onClick={handleWicket} className="py-4 bg-red-800 hover:bg-red-700 rounded-lg text-lg font-bold transition duration-200">Wicket</button>
                    </div>
                    <div className="mt-4 text-center">
                         <button onClick={handleRetire} disabled={state.remainingBatsmen.length === 0 && state.retiredBatsmen.length === 0} className="py-3 px-6 bg-fuchsia-800 hover:bg-fuchsia-700 rounded-lg text-lg font-bold transition duration-200 w-full">Retire Batsman</button>
                    </div>
                </>
            )}
            
            <div className="mt-8 pt-4 border-t border-slate-700 flex justify-between items-center">
                 <button 
                    onClick={onNewGame} 
                    className="text-slate-500 hover:text-slate-400 text-sm transition duration-200"
                >
                    Reset & New Game
                </button>
                <button 
                    onClick={handleUndo} 
                    disabled={state.inningsOver || state.history.length <= 1}
                    className="text-sm font-semibold bg-yellow-700 hover:bg-yellow-600 text-yellow-100 py-2 px-4 rounded-md transition duration-200 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    Reset Current Over
                </button>
            </div>
        </div>
    );
};

export default Scoreboard;