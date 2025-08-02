import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { AppState, Player, MatchConfig, Team, ScoreState, ScoreAction, BattingStats, BowlingStats, ScoreStateSnapshot, ShareableScorecardState } from './types.ts';
import * as storage from './storage.ts';
import MatchSetup from './components/MatchSetup.tsx';
import Scoreboard from './components/Scoreboard.tsx';
import FullScorecard from './components/FullScorecard.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import ManOfTheMatch from './components/ManOfTheMatch.tsx';
import TeamSelection from './components/TeamSelection.tsx';


// Reducer Logic
const createInitialState = (config: MatchConfig, target: number | null): ScoreState => {
    const battingTeam = config.battingTeamName === config.teamA.name ? config.teamA : config.teamB;
    const bowlingTeam = config.battingTeamName === config.teamA.name ? config.teamB : config.teamA;
    const openingBatsman = config.openingBatsman;
    const openingBowler = config.openingBowler;

    const initialBattingStats: Record<string, BattingStats> = battingTeam.players.reduce((acc, player) => {
        acc[player.id] = { playerId: player.id, playerName: player.name, runs: 0, fours: 0, ballsFaced: 0, status: 'Not Out' };
        return acc;
    }, {} as Record<string, BattingStats>);

    const initialBowlingStats: Record<string, BowlingStats> = bowlingTeam.players.reduce((acc, player) => {
        acc[player.id] = { playerId: player.id, playerName: player.name, overs: 0, wickets: 0, runsConceded: 0, wides: 0, dotBalls: 0, foursConceded: 0 };
        return acc;
    }, {} as Record<string, BowlingStats>);

    const initialState: ScoreStateSnapshot = {
        runs: 0,
        wickets: 0,
        oversCompleted: 0,
        ballsInCurrentOver: 0,
        maxOvers: config.overs,
        target: target,
        currentBatsmanId: openingBatsman.id,
        currentBowlerId: openingBowler.id,
        battingTeam: battingTeam,
        bowlingTeam: bowlingTeam,
        remainingBatsmen: battingTeam.players.filter(p => p.id !== openingBatsman.id),
        retiredBatsmen: [],
        matchOver: false,
        inningsOver: false,
        statusMessage: target ? `Target: ${target}` : 'Match in Progress...',
        fours: 0,
        widesInCurrentOver: 0,
        currentOverEvents: [],
        battingStats: initialBattingStats,
        bowlingStats: initialBowlingStats,
    };
    return { ...initialState, history: [initialState] };
};

function checkCompletion(state: ScoreStateSnapshot, battingTeamName: string, bowlingTeamName: string): ScoreStateSnapshot {
    if (state.target && state.runs >= state.target) {
        const wicketsInHand = state.battingTeam.players.length - state.wickets;
        return { ...state, inningsOver: true, matchOver: true, statusMessage: `${battingTeamName} won by ${wicketsInHand} wickets!` };
    }

    const allOut = state.wickets >= state.battingTeam.players.length; // Last man standing rule
    const oversFinished = state.oversCompleted >= state.maxOvers;

    if (allOut || oversFinished) {
        if (state.target) { // Second innings ended
            const runDifference = state.target - 1 - state.runs;
            const message = runDifference > 0 ? `${bowlingTeamName} won!` : 'Match Tied!';
            return { ...state, inningsOver: true, matchOver: true, statusMessage: message };
        } else { // First innings ended
            const message = allOut ? 'All Out!' : 'Innings Over!';
            return { ...state, inningsOver: true, matchOver: false, statusMessage: message };
        }
    }
    
    return state;
}

function scoreReducer(state: ScoreState | null, action: ScoreAction): ScoreState | null {
  // Handle state initialization and reset first.
  if (action.type === 'SET_STATE') {
      return action.payload;
  }

  // If state is not initialized, do nothing.
  if (!state) {
    return null;
  }
  
  // Handle undos before other actions
  if (action.type === 'UNDO_LAST_BALL') {
      if (state.history.length <= 1) return state;
      const newHistory = state.history.slice(0, -1);
      const restoredSnapshot = newHistory[newHistory.length - 1];
      return { ...restoredSnapshot, history: newHistory };
  }
  
  if (action.type === 'UNDO_OVER') {
    if (state.history.length <= 1) return state;
    
    let overToReset = state.oversCompleted;
    // If we are exactly at the start of a new over (e.g. 5.0), we intend to reset the previous one (over 4).
    if (state.ballsInCurrentOver === 0 && state.currentOverEvents.length === 0 && overToReset > 0) {
        overToReset -= 1;
    }

    const startOfOverIndex = state.history.findIndex(s => s.oversCompleted === overToReset && s.ballsInCurrentOver === 0);
    
    if (startOfOverIndex === -1) return state;

    const newHistory = state.history.slice(0, startOfOverIndex + 1);
    const restoredState = newHistory[newHistory.length - 1];
    
    return { ...restoredState, history: newHistory };
  }
  
  // After handling undos, prevent most actions when an innings is over.
  if (state.inningsOver) {
    return state;
  }
  
  const { history, ...currentState } = state;
  let nextState: ScoreStateSnapshot = { ...currentState };

  switch (action.type) {
    case 'SCORE': {
        const { payload: runsScored } = action;
        const { currentBatsmanId, currentBowlerId, battingStats, bowlingStats } = currentState;
        const newBalls = currentState.ballsInCurrentOver + 1;
        const isOverEnd = newBalls === 6;

        nextState = {
            ...currentState,
            runs: currentState.runs + runsScored,
            ballsInCurrentOver: isOverEnd ? 0 : newBalls,
            oversCompleted: isOverEnd ? currentState.oversCompleted + 1 : currentState.oversCompleted,
            fours: currentState.fours + (runsScored === 4 ? 1 : 0),
            currentOverEvents: isOverEnd ? [] : [...currentState.currentOverEvents, `${runsScored}`],
            widesInCurrentOver: isOverEnd ? 0 : currentState.widesInCurrentOver,
            battingStats: {
                ...battingStats,
                [currentBatsmanId]: {
                    ...battingStats[currentBatsmanId],
                    runs: battingStats[currentBatsmanId].runs + runsScored,
                    ballsFaced: battingStats[currentBatsmanId].ballsFaced + 1,
                    ...(runsScored === 4 && { fours: battingStats[currentBatsmanId].fours + 1 }),
                },
            },
            bowlingStats: {
                ...bowlingStats,
                [currentBowlerId]: {
                    ...bowlingStats[currentBowlerId],
                    runsConceded: bowlingStats[currentBowlerId].runsConceded + runsScored,
                    dotBalls: bowlingStats[currentBowlerId].dotBalls + (runsScored === 0 ? 1 : 0),
                    foursConceded: bowlingStats[currentBowlerId].foursConceded + (runsScored === 4 ? 1 : 0),
                    overs: isOverEnd ? bowlingStats[currentBowlerId].overs + 1 : bowlingStats[currentBowlerId].overs,
                },
            },
        };
        break;
    }
    case 'EXTRA': {
        const { runs, type } = action.payload;
        const { currentBowlerId, bowlingStats } = currentState;
        
        let event = '';
        let runsToAdd = runs;
        let isFour = false;
        let isWide = type === 'Wd';

        const bowlerStats = { ...bowlingStats[currentBowlerId] };
        
        if (isWide) {
            event = 'Wd';
            const newWidesCount = currentState.widesInCurrentOver + 1;
            bowlerStats.wides += 1;
            if (newWidesCount === 3) {
                runsToAdd += 4;
                isFour = true;
            }
        } else if (type === 'Nb') { // 'Nb' with 4 runs
            event = '4n';
            isFour = true;
        }

        bowlerStats.runsConceded += runsToAdd;
        if (isFour) {
            bowlerStats.foursConceded += 1;
        }

        nextState = {
            ...currentState,
            runs: currentState.runs + runsToAdd,
            fours: currentState.fours + (isFour ? 1 : 0),
            widesInCurrentOver: isWide ? (currentState.widesInCurrentOver + 1) % 3 : currentState.widesInCurrentOver,
            currentOverEvents: [...currentState.currentOverEvents, event],
            bowlingStats: {
                ...bowlingStats,
                [currentBowlerId]: bowlerStats
            }
        };
        break;
    }
    case 'WICKET': {
        const { currentBatsmanId, currentBowlerId, battingStats, bowlingStats } = currentState;
        const newBalls = currentState.ballsInCurrentOver + 1;
        const isOverEnd = newBalls === 6;

        nextState = {
            ...currentState,
            wickets: currentState.wickets + 1,
            ballsInCurrentOver: isOverEnd ? 0 : newBalls,
            oversCompleted: isOverEnd ? currentState.oversCompleted + 1 : currentState.oversCompleted,
            currentOverEvents: isOverEnd ? [] : [...currentState.currentOverEvents, 'Wkt'],
            widesInCurrentOver: isOverEnd ? 0 : currentState.widesInCurrentOver,
            battingStats: {
                ...battingStats,
                [currentBatsmanId]: {
                    ...battingStats[currentBatsmanId],
                    status: 'Out',
                    ballsFaced: battingStats[currentBatsmanId].ballsFaced + 1,
                },
            },
            bowlingStats: {
                ...bowlingStats,
                [currentBowlerId]: {
                    ...bowlingStats[currentBowlerId],
                    wickets: bowlingStats[currentBowlerId].wickets + 1,
                    dotBalls: bowlingStats[currentBowlerId].dotBalls + 1,
                    overs: isOverEnd ? bowlingStats[currentBowlerId].overs + 1 : bowlingStats[currentBowlerId].overs,
                },
            },
        };
        break;
    }
    case 'RETIRE_BATSMAN': {
      const { currentBatsmanId, battingTeam, battingStats, retiredBatsmen } = nextState;
      const batsmanToRetire = battingTeam.players.find(p => p.id === currentBatsmanId)!;
      nextState = {
        ...nextState,
        battingStats: {
            ...battingStats,
            [currentBatsmanId]: { ...battingStats[currentBatsmanId], status: 'Retired' }
        },
        retiredBatsmen: [...retiredBatsmen, batsmanToRetire],
      };
      break;
    }
    case 'SET_NEXT_BATSMAN':
      nextState = {
        ...nextState,
        currentBatsmanId: action.payload.id,
        remainingBatsmen: nextState.remainingBatsmen.filter(p => p.id !== action.payload.id),
        retiredBatsmen: nextState.retiredBatsmen.filter(p => p.id !== action.payload.id),
      };
      break;
    case 'SET_NEXT_BOWLER':
      nextState = {
        ...nextState,
        currentBowlerId: action.payload.id,
        statusMessage: nextState.target ? `Target: ${nextState.target}` : 'Match in Progress...',
      };
      break;
  }
  const completedState = checkCompletion(nextState, nextState.battingTeam.name, nextState.bowlingTeam.name);
  const snapshot: ScoreStateSnapshot = { ...completedState };
  return { ...completedState, history: [...history, snapshot] };
}

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [publicScorecardData, setPublicScorecardData] = useState<ShareableScorecardState | null>(null);

    const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
    const [teamA, setTeamA] = useState<Team>({ name: '', players: [] });
    const [teamB, setTeamB] = useState<Team>({ name: '', players: [] });
    const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
    const [gameState, dispatch] = useReducer(scoreReducer, null);
    const [firstInningsSummary, setFirstInningsSummary] = useState<ScoreState | null>(null);
    const [showFullScorecard, setShowFullScorecard] = useState(false);
    const [showMotmModal, setShowMotmModal] = useState(false);

    useEffect(() => {
        // Public Scorecard Routing
        const handleHashChange = () => {
          const hash = window.location.hash;
          if (hash.startsWith('#share/')) {
            try {
              const encodedData = hash.substring(7);
              const jsonString = decodeURIComponent(atob(encodedData));
              const data = JSON.parse(jsonString);
              setPublicScorecardData(data);
            } catch (error) {
              console.error("Failed to parse shared scorecard data:", error);
              // Clear hash if invalid
              window.location.hash = '';
            }
          }
        };

        handleHashChange(); // Check on initial load
        window.addEventListener('hashchange', handleHashChange);

        return () => {
          window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    useEffect(() => {
        if (publicScorecardData) return; // Don't try to load user data if on a public page
        const loggedInUser = storage.getLoggedInUser();
        if (loggedInUser) {
            handleLoginSuccess(loggedInUser);
        }
    }, [publicScorecardData]);

    useEffect(() => {
        if (!currentUser || publicScorecardData) return;
        const stateToSave: storage.GameState = {
            appState,
            teamA,
            teamB,
            matchConfig,
            gameState,
            firstInningsSummary,
        };
        storage.saveGameState(currentUser, stateToSave);
    }, [appState, teamA, teamB, matchConfig, gameState, firstInningsSummary, currentUser, publicScorecardData]);

    const handleLoginSuccess = (username: string) => {
        setCurrentUser(username);
        storage.setLoggedInUser(username);
        const userGameState = storage.loadGameState(username);
        if (userGameState) {
            setAppState(userGameState.appState || AppState.TEAM_SELECTION);
            setTeamA(userGameState.teamA || { name: '', players: [] });
            setTeamB(userGameState.teamB || { name: '', players: [] });
            setMatchConfig(userGameState.matchConfig || null);
            dispatch({ type: 'SET_STATE', payload: userGameState.gameState || null });
            setFirstInningsSummary(userGameState.firstInningsSummary || null);
        } else {
            setAppState(AppState.TEAM_SELECTION);
            // Reset all game state for new user
            setTeamA({ name: '', players: [] });
            setTeamB({ name: '', players: [] });
            setMatchConfig(null);
            dispatch({ type: 'SET_STATE', payload: null });
            setFirstInningsSummary(null);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        storage.clearLoggedInUser();
        setAppState(AppState.LOGIN);
    };

    const handleTeamsSelected = useCallback((teamA: Team, teamB: Team) => {
      setTeamA(teamA);
      setTeamB(teamB);
      setAppState(AppState.MATCH_SETUP);
    }, []);
    
    const handleMatchStart = useCallback((config: MatchConfig) => {
        setMatchConfig(config);
        const target = firstInningsSummary ? firstInningsSummary.runs + 1 : null;
        dispatch({ type: 'SET_STATE', payload: createInitialState(config, target) });
        setAppState(AppState.SCOREBOARD);
    }, [firstInningsSummary]);

    const handleNewGame = useCallback(() => {
        if (currentUser) {
            storage.removeGameState(currentUser);
        }
        setAppState(AppState.TEAM_SELECTION);
        setMatchConfig(null);
        setTeamA({ name: '', players: [] });
        setTeamB({ name: '', players: [] });
        setFirstInningsSummary(null);
        dispatch({ type: 'SET_STATE', payload: null });
    }, [currentUser]);

    const handleNextInnings = useCallback((firstInningsFinalState: ScoreState) => {
        if (!matchConfig) return;
        setFirstInningsSummary(firstInningsFinalState);
        setAppState(AppState.MATCH_SETUP);
    }, [matchConfig]);

    const renderContent = () => {
        switch (appState) {
            case AppState.LOGIN:
                return <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAppState(AppState.REGISTER)} />;
            case AppState.REGISTER:
                return <Register onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setAppState(AppState.LOGIN)} />;
            case AppState.TEAM_SELECTION:
                return <TeamSelection onTeamsSelected={handleTeamsSelected} />;
            case AppState.MATCH_SETUP:
                return <MatchSetup
                    onMatchStart={handleMatchStart}
                    teamA={teamA}
                    teamB={teamB}
                    firstInningsSummary={firstInningsSummary}
                />;
            case AppState.SCOREBOARD:
                if (!gameState || !matchConfig) return <div>Error: Match not configured</div>;
                return (
                    <div className="animate-fade-in-up">
                        <div className="w-full flex justify-end mb-4">
                             <button
                                onClick={() => setShowFullScorecard(true)}
                                className="btn-secondary py-2 px-5"
                            >
                                Show Full Scorecard
                            </button>
                        </div>
                        <Scoreboard
                            state={gameState}
                            dispatch={dispatch}
                            onNewGame={handleNewGame}
                            onNextInnings={handleNextInnings}
                            onPredictMotm={() => setShowMotmModal(true)}
                            onShowScorecard={() => setShowFullScorecard(true)}
                        />
                    </div>
                );
            default:
                return <div>Something went wrong</div>;
        }
    };

    if (publicScorecardData) {
        return (
            <div className="min-h-screen text-slate-100 flex flex-col items-center p-4 font-sans">
                 <header className="w-full max-w-4xl mx-auto text-center mb-8">
                    <div className="flex justify-center items-center py-6">
                        <div className="text-center">
                             <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500">
                                Super Sunday League 4
                            </h1>
                            <p className="text-slate-400 mt-1">SSL 4 - 2025 | Public Match Scorecard</p>
                        </div>
                    </div>
                </header>
                <main className="w-full max-w-4xl mx-auto">
                    <FullScorecard
                        firstInnings={publicScorecardData.firstInnings}
                        currentInnings={publicScorecardData.currentInnings}
                        teamA={publicScorecardData.teamA}
                        teamB={publicScorecardData.teamB}
                        onClose={() => (window.location.hash = '')}
                        isPublicView={true}
                    />
                </main>
                <footer className="mt-8 text-slate-500 text-sm text-center">
                    <p>Crafted with ❤️ for SSL</p>
                </footer>
            </div>
        );
    }


    return (
        <div className="min-h-screen text-slate-100 flex flex-col items-center font-sans">
            <header className="w-full max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center py-4 border-b border-slate-800">
                    <div className="text-left">
                        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500">
                           Super Sunday League 4
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">SSL 4 - 2025 | The ultimate gully cricket scorecard.</p>
                    </div>
                    {currentUser && (
                       <div className="text-right flex items-center gap-4">
                             <p className="text-slate-300 hidden sm:block">Welcome, <span className="font-bold text-cyan-400">{currentUser}</span></p>
                            <button onClick={handleLogout} className="btn-secondary">
                              Logout
                            </button> 
                        </div> 
                    )}
                </div>
            </header>
            <main className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-8">
                {renderContent()}
            </main>
            {showFullScorecard && gameState && (
                <FullScorecard
                    firstInnings={firstInningsSummary}
                    currentInnings={gameState}
                    teamA={teamA}
                    teamB={teamB}
                    onClose={() => setShowFullScorecard(false)}
                />
            )}
            {showMotmModal && gameState && firstInningsSummary && (
              <ManOfTheMatch
                matchData={{
                  firstInnings: firstInningsSummary,
                  currentInnings: gameState,
                  teamA,
                  teamB,
                }}
                onClose={() => setShowMotmModal(false)}
              />
            )}
             <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-slate-500 text-sm text-center border-t border-slate-800">
                <p>Crafted with ❤️ for SSL</p>
            </footer>
        </div>
    );
};

export default App;