
import React, { useState, useRef, useEffect } from 'react';
import { Player, ScoreState, ScoreAction } from '../types.ts';

interface ScoreboardProps {
  state: ScoreState;
  dispatch: React.Dispatch<ScoreAction>;
  onNewGame: () => void;
  onNextInnings: (finalState: ScoreState) => void;
  onPredictMotm: () => void;
  onShowScorecard: () => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ state, dispatch, onNewGame, onNextInnings, onPredictMotm, onShowScorecard }) => {
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

    const handleUndoLastBall = () => {
        dispatch({ type: 'UNDO_LAST_BALL' });
    };

    const handleUndoOver = () => {
        dispatch({ type: 'UNDO_OVER' });
    };

    const currentBatsman = state.battingStats[state.currentBatsmanId];
    const currentBowler = state.bowlingStats[state.currentBowlerId];
    const battingTeamName = state.battingTeam.name;
    const oversDisplay = `${state.oversCompleted}.${state.ballsInCurrentOver}`;
    const innings = state.target === null ? 1 : 2;
    
    const dotsInCurrentOver = state.currentOverEvents.filter(e => e === '0' || e === 'Wkt').length;
    const foursInCurrentOver = state.currentOverEvents.filter(e => e === '4' || e === '4n').length;

    const threeOverBowlersCount = Object.values(state.bowlingStats).filter(b => b.overs >= 3).length;

    const availableBowlers = state.bowlingTeam.players
        .filter(p => p.id !== state.currentBowlerId)
        .filter(p => {
            const bowlerStats = state.bowlingStats[p.id];
            const oversBowled = bowlerStats?.overs || 0;

            if (oversBowled < 2) {
                // Can always bowl another over if they have bowled 0 or 1.
                return true;
            }
            
            if (oversBowled === 2) {
                // Can only bowl their 3rd over if the quota of 3-over-bowlers is not yet full.
                return threeOverBowlersCount < 3;
            }

            // If oversBowled is > 2, they cannot bowl.
            return false;
        });

    const eventStyle = (event: string) => {
        if (event === '4' || event === '4n') return 'bg-emerald-500/80 border-emerald-400 text-white';
        if (event === 'Wkt') return 'bg-red-500/80 border-red-400 text-white';
        if (event === 'Wd') return 'bg-yellow-500/80 border-yellow-400 text-slate-900';
        return 'bg-slate-700/80 border-slate-600 text-slate-200';
    }

    const ActionButton: React.FC<{onClick: () => void, disabled?: boolean, children: React.ReactNode, className?: string}> = ({onClick, disabled, children, className}) => (
      <button onClick={onClick} disabled={disabled} className={`h-20 sm:h-24 rounded-xl text-lg font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1 transform hover:scale-105 focus:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}>
        {children}
      </button>
    )

    const Modal: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in-up">
        <div className="card rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-6">{title}</h3>
            {children}
          </div>
        </div>
      </div>
    );

    return (
        <div className="card p-4 sm:p-6 rounded-2xl shadow-2xl w-full border-cyan-500/20">
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-slate-300">
                    <span className="font-bold text-cyan-400">{battingTeamName}</span> Batting (Innings {innings})
                </h2>
                {innings === 2 && state.target && <p className="text-slate-400 mt-1">Target: <span className="text-white font-bold">{state.target} Runs</span></p>}
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-6 my-6">
                <div className="text-center">
                    <p className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-emerald-400">{state.fours}</p>
                    <p className="text-base sm:text-lg text-slate-300 font-semibold tracking-wide sm:-mt-2">Fours</p>
                </div>
                <div className="text-4xl sm:text-5xl md:text-6xl font-thin text-slate-600">/</div>
                <div className="text-center">
                    <p className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-amber-400">{state.wickets}</p>
                    <p className="text-base sm:text-lg text-slate-300 font-semibold tracking-wide sm:-mt-2">Wickets</p>
                </div>
            </div>
            <p className="text-lg text-slate-400 text-center">
                Overs: <span className="font-bold text-white">{oversDisplay} / {state.maxOvers}</span>
                <span className="mx-2 text-slate-600">|</span>
                <span className="text-yellow-400" title="3 wides in an over add 4 bonus runs and count as a four">Wides: <span className="font-bold text-white">{state.widesInCurrentOver}</span></span>
            </p>

            <div className="my-6">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-center">This Over</h4>
                <div className="flex flex-wrap justify-center gap-2 mt-3 p-3 bg-slate-900/50 rounded-lg min-h-[52px] items-center">
                    {state.currentOverEvents.length > 0 ? (
                        state.currentOverEvents.map((event, index) => (
                            <span key={index} className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shadow-md border ${eventStyle(event)}`}>
                                {event}
                            </span>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm">Waiting for first ball...</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center mb-8">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/80">
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Batting</p>
                    <p className="text-xl text-emerald-300 font-bold truncate">{currentBatsman?.playerName || 'N/A'}</p>
                    <p className="text-slate-300 mt-1 text-sm">
                        <span className="font-bold">{currentBatsman?.fours || 0}</span> Fours (<span className="font-bold">{currentBatsman?.ballsFaced || 0}</span> balls)
                    </p>
                </div>
                 <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/80">
                    <p className="text-sm text-slate-400 uppercase tracking-wider">Bowling</p>
                    <p className="text-xl text-cyan-300 font-bold truncate">{currentBowler?.playerName || 'N/A'}</p>
                    <p className="text-slate-300 mt-1 text-sm">
                        W: <span className="font-bold">{currentBowler?.wickets || 0}</span> | 4s: <span className="font-bold">{currentBowler?.foursConceded || 0}</span>
                    </p>
                    <p className="text-slate-400 mt-1 text-xs">
                        This Over: <span className="font-semibold text-emerald-400">{foursInCurrentOver} Fours</span>, <span className="font-semibold text-slate-200">{dotsInCurrentOver} Dots</span>
                    </p>
                </div>
            </div>

            {state.inningsOver ? (
                 <div className="text-center p-6 sm:p-8 bg-slate-900/50 rounded-lg animate-fade-in-up border border-cyan-500/30">
                    <h3 className="text-2xl sm:text-3xl font-bold text-yellow-400">{state.statusMessage}</h3>
                    <p className="text-lg mt-2 text-slate-300">Final Score: {state.fours} Fours / {state.wickets} Wickets</p>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                        {innings === 1 && !state.matchOver ? (
                          <button onClick={() => onNextInnings(state)} className="btn-primary w-full sm:w-auto bg-green-600 hover:bg-green-500 shadow-green-600/20">
                              Start Second Innings
                          </button>
                        ) : (
                          <>
                            <button onClick={onNewGame} className="btn-primary w-full sm:w-auto">
                                Start New Game
                            </button>
                             <button onClick={onPredictMotm} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg shadow-purple-600/20">
                                ✨ Predict Man of the Match
                            </button>
                          </>
                        )}
                    </div>
                 </div>
            ) : showNextBatsmanModal ? (
                <Modal title="Select Next Batsman">
                    <div className="flex flex-col items-center gap-4">
                         <select
                            value={nextBatsmanId}
                            onChange={(e) => setNextBatsmanId(e.target.value)}
                            className="input-base"
                        >
                            <option value="">Select batsman...</option>
                            {state.remainingBatsmen.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            {state.retiredBatsmen.length > 0 && <option disabled>--- Retired ---</option>}
                            {state.retiredBatsmen.map(p => <option key={p.id} value={p.id}>{p.name} (R)</option>)}
                        </select>
                        <button onClick={confirmNextBatsman} disabled={!nextBatsmanId} className="btn-primary w-full">
                            Confirm
                        </button>
                    </div>
                </Modal>
            ) : showNextBowlerModal ? (
                <Modal title="Over Complete! Select New Bowler">
                    <div className="flex flex-col items-center gap-4">
                         <select
                            value={nextBowlerId}
                            onChange={(e) => setNextBowlerId(e.target.value)}
                            className="input-base"
                        >
                            <option value="">Select next bowler...</option>
                            {availableBowlers.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({state.bowlingStats[p.id]?.overs || 0} overs bowled)
                                </option>
                            ))}
                        </select>
                        {availableBowlers.length === 0 && (
                            <p className="text-sm text-yellow-400 text-center mt-2">
                                No bowlers available. The 3-bowler/3-over quota may be met.
                            </p>
                        )}
                        <button onClick={confirmNextBowler} disabled={!nextBowlerId} className="btn-primary w-full">
                            Confirm
                        </button>
                         <button onClick={onShowScorecard} className="btn-secondary w-full mt-2">
                            View Full Scorecard
                        </button>
                    </div>
                </Modal>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <ActionButton onClick={() => dispatch({ type: 'SCORE', payload: 0 })} className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700">
                          <span className="text-3xl sm:text-4xl font-black">0</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-400">DOT BALL</span>
                        </ActionButton>
                        <ActionButton onClick={() => dispatch({ type: 'SCORE', payload: 4 })} className="bg-emerald-600/20 hover:bg-emerald-500/30 border border-emerald-500/50">
                          <span className="text-3xl sm:text-4xl font-black text-emerald-300">4</span>
                          <span className="text-sm font-semibold text-emerald-400">FOUR</span>
                        </ActionButton>
                        <ActionButton onClick={handleWicket} className="bg-red-600/20 hover:bg-red-500/30 border border-red-500/50">
                          <span className="text-xl sm:text-2xl font-black text-red-300">WICKET</span>
                          <span className="text-xs sm:text-sm font-semibold text-red-400">OUT!</span>
                        </ActionButton>
                        <ActionButton onClick={() => dispatch({ type: 'EXTRA', payload: { runs: 1, type: 'Wd' } })} className="bg-yellow-600/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300">WIDE</ActionButton>
                        <ActionButton onClick={() => dispatch({ type: 'EXTRA', payload: { runs: 4, type: 'Nb' } })} className="bg-indigo-600/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300">NO BALL +4</ActionButton>
                        <ActionButton onClick={handleRetire} disabled={state.remainingBatsmen.length === 0 && state.retiredBatsmen.length === 0} className="bg-fuchsia-600/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/50 text-fuchsia-300">RETIRE</ActionButton>
                    </div>
                </>
            )}
            
            <div className="mt-6 pt-6 border-t border-slate-700/80 flex justify-between items-center flex-wrap gap-2">
                 <div className="flex gap-2">
                    <button 
                        onClick={handleUndoLastBall} 
                        disabled={state.inningsOver || state.history.length <= 1}
                        className="btn-secondary text-sm bg-amber-800/80 hover:bg-amber-700/80 text-amber-200"
                    >
                        Undo Last Ball
                    </button>
                    <button 
                        onClick={handleUndoOver} 
                        disabled={state.inningsOver || state.history.length <= 1 || (state.ballsInCurrentOver === 0 && state.currentOverEvents.length === 0)}
                        className="btn-secondary text-sm bg-yellow-900/80 hover:bg-yellow-800/80 text-yellow-200"
                    >
                        Reset Current Over
                    </button>
                </div>
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