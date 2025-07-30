
import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { AppState, Player, MatchConfig, Team, ScoreState, ScoreAction, BattingStats, BowlingStats, ScoreStateSnapshot, ShareableScorecardState } from './types.ts';
import PlayerSetup from './components/PlayerSetup.tsx';
import MatchSetup from './components/MatchSetup.tsx';
import Scoreboard from './components/Scoreboard.tsx';
import TeamSetup from './components/TeamSetup.tsx';
import CoinToss from './components/CoinToss.tsx';
import FullScorecard from './components/FullScorecard.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import ManOfTheMatch from './components/ManOfTheMatch.tsx';


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
        acc[player.id] = { playerId: player.id, playerName: player.name, overs: 0, ballsInCurrentOver: 0, wickets: 0, runsConceded: 0, wides: 0 };
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

  // If state is not initialized and the action is not SET_STATE, do nothing.
  if (!state) {
    return null;
  }
  
  // After initialization, prevent most actions when an innings is over.
  if (state.inningsOver && action.type !== 'UNDO_OVER') {
    return state;
  }

  if (action.type === 'UNDO_OVER') {
      const overToReset = state.oversCompleted;
      if (state.history.length <= 1) return state;
      let lastStateOfPreviousOverIndex = -1;
      for (let i = state.history.length - 2; i >= 0; i--) {
        if (state.history[i].oversCompleted < overToReset) {
          lastStateOfPreviousOverIndex = i;
          break;
        }
      }
      
      if(lastStateOfPreviousOverIndex !== -1) {
          const restoredSnapshot = state.history[lastStateOfPreviousOverIndex + 1] ?? state.history[0];
          const newHistory = state.history.slice(0, lastStateOfPreviousOverIndex + 2);
          return { ...restoredSnapshot, history: newHistory };
      }
      const initialSnapshot = state.history[0];
      return { ...initialSnapshot, history: [initialSnapshot] };
  }
  
  const { history, ...currentState } = state;
  let intermediateState: ScoreStateSnapshot = { ...currentState };

  const updateBowlerStats = (bowlerId: string, updates: Partial<BowlingStats>) => {
      const bowler = intermediateState.bowlingStats[bowlerId];
      intermediateState.bowlingStats[bowlerId] = { ...bowler, ...updates };
  };
  const updateBatsmanStats = (batsmanId: string, updates: Partial<BattingStats>) => {
      const batsman = intermediateState.battingStats[batsmanId];
      intermediateState.battingStats[batsmanId] = { ...batsman, ...updates };
  };

  switch (action.type) {
    case 'SCORE': {
      let newBalls = intermediateState.ballsInCurrentOver + 1;
      intermediateState.runs += action.payload;
      updateBatsmanStats(intermediateState.currentBatsmanId, { runs: intermediateState.battingStats[intermediateState.currentBatsmanId].runs + action.payload, ballsFaced: intermediateState.battingStats[intermediateState.currentBatsmanId].ballsFaced + 1 });
      updateBowlerStats(intermediateState.currentBowlerId, { runsConceded: intermediateState.bowlingStats[intermediateState.currentBowlerId].runsConceded + action.payload });

      if (action.payload === 4) {
          intermediateState.fours += 1;
          updateBatsmanStats(intermediateState.currentBatsmanId, { fours: intermediateState.battingStats[intermediateState.currentBatsmanId].fours + 1 });
      }

      intermediateState.currentOverEvents.push(`${action.payload}`);

      if (newBalls === 6) {
          newBalls = 0;
          intermediateState.oversCompleted += 1;
          updateBowlerStats(intermediateState.currentBowlerId, { ballsInCurrentOver: 0, overs: intermediateState.bowlingStats[intermediateState.currentBowlerId].overs + 1 });
          intermediateState.widesInCurrentOver = 0;
          intermediateState.currentOverEvents = [];
      } else {
          updateBowlerStats(intermediateState.currentBowlerId, { ballsInCurrentOver: newBalls });
      }
      intermediateState.ballsInCurrentOver = newBalls;
      break;
    }
    case 'EXTRA': {
      intermediateState.runs += action.payload.runs;
      updateBowlerStats(intermediateState.currentBowlerId, { runsConceded: intermediateState.bowlingStats[intermediateState.currentBowlerId].runsConceded + action.payload.runs });
      let event = '';

      if (action.payload.type === 'Nb') {
        intermediateState.fours += 1;
        event = '4n';
      }

      if (action.payload.type === 'Wd') {
        intermediateState.widesInCurrentOver += 1;
        updateBowlerStats(intermediateState.currentBowlerId, { wides: intermediateState.bowlingStats[intermediateState.currentBowlerId].wides + 1 });
        event = 'Wd';
        if (intermediateState.widesInCurrentOver === 3) {
            intermediateState.runs += 4;
            updateBowlerStats(intermediateState.currentBowlerId, { runsConceded: intermediateState.bowlingStats[intermediateState.currentBowlerId].runsConceded + 4 });
            intermediateState.fours += 1;
            intermediateState.widesInCurrentOver = 0;
        }
      }
      intermediateState.currentOverEvents.push(event);
      break;
    }
    case 'WICKET': {
      let newBalls = intermediateState.ballsInCurrentOver + 1;
      intermediateState.wickets += 1;
      updateBatsmanStats(intermediateState.currentBatsmanId, { status: 'Out', ballsFaced: intermediateState.battingStats[intermediateState.currentBatsmanId].ballsFaced + 1 });
      updateBowlerStats(intermediateState.currentBowlerId, { wickets: intermediateState.bowlingStats[intermediateState.currentBowlerId].wickets + 1 });
      
      intermediateState.currentOverEvents.push('Wkt');

      if (newBalls === 6) {
          newBalls = 0;
          intermediateState.oversCompleted += 1;
          updateBowlerStats(intermediateState.currentBowlerId, { ballsInCurrentOver: 0, overs: intermediateState.bowlingStats[intermediateState.currentBowlerId].overs + 1 });
          intermediateState.widesInCurrentOver = 0;
          intermediateState.currentOverEvents = [];
      } else {
           updateBowlerStats(intermediateState.currentBowlerId, { ballsInCurrentOver: newBalls });
      }
      intermediateState.ballsInCurrentOver = newBalls;
      break;
    }
    case 'RETIRE_BATSMAN': {
      const batsmanToRetire = intermediateState.battingTeam.players.find(p => p.id === intermediateState.currentBatsmanId)!;
      updateBatsmanStats(intermediateState.currentBatsmanId, { status: 'Retired' });
      intermediateState.retiredBatsmen.push(batsmanToRetire);
      break;
    }
    case 'SET_NEXT_BATSMAN':
      intermediateState.currentBatsmanId = action.payload.id;
      intermediateState.remainingBatsmen = intermediateState.remainingBatsmen.filter(p => p.id !== action.payload.id);
      intermediateState.retiredBatsmen = intermediateState.retiredBatsmen.filter(p => p.id !== action.payload.id);
      break;
    case 'SET_NEXT_BOWLER':
      intermediateState.currentBowlerId = action.payload.id;
      intermediateState.statusMessage = intermediateState.target ? `Target: ${intermediateState.target}` : 'Match in Progress...';
      break;
  }
  const completedState = checkCompletion(intermediateState, intermediateState.battingTeam.name, intermediateState.bowlingTeam.name);
  const snapshot: ScoreStateSnapshot = { ...completedState };
  return { ...completedState, history: [...history, snapshot] };
}

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [publicScorecardData, setPublicScorecardData] = useState<ShareableScorecardState | null>(null);


    const loadGameState = (username: string) => {
        try {
            const serializedState = localStorage.getItem(`youbeeCricketState_${username}`);
            return serializedState ? JSON.parse(serializedState) : undefined;
        } catch (err) {
            console.error("Could not load state from localStorage", err);
            return undefined;
        }
    };

    const savedState = currentUser ? loadGameState(currentUser) : undefined;

    const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
    const [players, setPlayers] = useState<Player[]>(savedState?.players || []);
    const [teamA, setTeamA] = useState<Team>(savedState?.teamA || { name: '', players: [] });
    const [teamB, setTeamB] = useState<Team>(savedState?.teamB || { name: '', players: [] });
    const [tossWinnerBatting, setTossWinnerBatting] = useState<string | null>(savedState?.tossWinnerBatting || null);
    const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(savedState?.matchConfig || null);
    const [gameState, dispatch] = useReducer(scoreReducer, savedState?.gameState || null);
    const [firstInningsSummary, setFirstInningsSummary] = useState<ScoreState | null>(savedState?.firstInningsSummary || null);
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
        const loggedInUser = localStorage.getItem('youbeeCricketCurrentUser');
        if (loggedInUser) {
            handleLoginSuccess(loggedInUser);
        }
    }, [publicScorecardData]);

    useEffect(() => {
        if (!currentUser || publicScorecardData) return;
        try {
            const stateToSave = {
                appState,
                players,
                teamA,
                teamB,
                tossWinnerBatting,
                matchConfig,
                gameState,
                firstInningsSummary,
            };
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem(`youbeeCricketState_${currentUser}`, serializedState);
        } catch (err) {
            console.error("Could not save state to localStorage", err);
        }
    }, [appState, players, teamA, teamB, tossWinnerBatting, matchConfig, gameState, firstInningsSummary, currentUser, publicScorecardData]);

    const handleLoginSuccess = (username: string) => {
        setCurrentUser(username);
        localStorage.setItem('youbeeCricketCurrentUser', username);
        const userGameState = loadGameState(username);
        if (userGameState) {
            setAppState(userGameState.appState || AppState.PLAYER_SETUP);
            setPlayers(userGameState.players || []);
            setTeamA(userGameState.teamA || { name: '', players: [] });
            setTeamB(userGameState.teamB || { name: '', players: [] });
            setTossWinnerBatting(userGameState.tossWinnerBatting || null);
            setMatchConfig(userGameState.matchConfig || null);
            dispatch({ type: 'SET_STATE', payload: userGameState.gameState || null });
            setFirstInningsSummary(userGameState.firstInningsSummary || null);
        } else {
            setAppState(AppState.PLAYER_SETUP);
            // Reset all game state for new user
            setPlayers([]);
            setTeamA({ name: '', players: [] });
            setTeamB({ name: '', players: [] });
            setTossWinnerBatting(null);
            setMatchConfig(null);
            dispatch({ type: 'SET_STATE', payload: null });
            setFirstInningsSummary(null);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('youbeeCricketCurrentUser');
        setAppState(AppState.LOGIN);
    };

    const handleTeamsSet = useCallback((nameA: string, nameB: string) => {
        setTeamA({ name: nameA, players: [] });
        setTeamB({ name: nameB, players: [] });
        setAppState(AppState.COIN_TOSS);
    }, []);

    const handlePlayersSet = useCallback((newPlayers: Player[]) => {
        setPlayers(newPlayers);
        setAppState(AppState.TEAM_SETUP);
    }, []);

    const handleTossComplete = useCallback((battingTeamName: string) => {
        setTossWinnerBatting(battingTeamName);
        setAppState(AppState.MATCH_SETUP);
    }, []);

    const handleMatchStart = useCallback((config: MatchConfig) => {
        setMatchConfig(config);
        setFirstInningsSummary(null);
        dispatch({ type: 'SET_STATE', payload: createInitialState(config, null) });
        setAppState(AppState.SCOREBOARD);
    }, []);

    const handleNewGame = useCallback(() => {
        if (currentUser) {
            localStorage.removeItem(`youbeeCricketState_${currentUser}`);
        }
        setAppState(AppState.PLAYER_SETUP);
        setPlayers([]);
        setMatchConfig(null);
        setTeamA({ name: '', players: [] });
        setTeamB({ name: '', players: [] });
        setTossWinnerBatting(null);
        setFirstInningsSummary(null);
        dispatch({ type: 'SET_STATE', payload: null });
    }, [currentUser]);

    const handleNextInnings = useCallback((firstInningsFinalState: ScoreState) => {
        if (!matchConfig) return;

        setFirstInningsSummary(firstInningsFinalState);
        const newBattingTeamName = firstInningsFinalState.bowlingTeam.name;
        const newBattingTeam = newBattingTeamName === matchConfig.teamA.name ? matchConfig.teamA : matchConfig.teamB;
        const newBowlingTeam = newBattingTeamName === matchConfig.teamA.name ? matchConfig.teamB : matchConfig.teamA;

        const newConfig: MatchConfig = {
            ...matchConfig,
            battingTeamName: newBattingTeamName,
            openingBatsman: newBattingTeam.players[0],
            openingBowler: newBowlingTeam.players[0],
        };

        setMatchConfig(newConfig);
        const target = firstInningsFinalState.runs + 1;
        dispatch({ type: 'SET_STATE', payload: createInitialState(newConfig, target) });
    }, [matchConfig]);

    const renderContent = () => {
        switch (appState) {
            case AppState.LOGIN:
                return <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAppState(AppState.REGISTER)} />;
            case AppState.REGISTER:
                return <Register onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setAppState(AppState.LOGIN)} />;
            case AppState.PLAYER_SETUP:
                return <PlayerSetup onPlayersSet={handlePlayersSet} players={players} />;
            case AppState.TEAM_SETUP:
                return <TeamSetup onTeamsSet={handleTeamsSet} teamA={teamA} teamB={teamB} />;
            case AppState.COIN_TOSS:
                return <CoinToss teamA={teamA} teamB={teamB} onTossComplete={handleTossComplete} />;
            case AppState.MATCH_SETUP:
                return <MatchSetup
                    allPlayers={players}
                    onMatchStart={handleMatchStart}
                    teamA={teamA}
                    teamB={teamB}
                    battingTeamName={tossWinnerBatting!}
                />;
            case AppState.SCOREBOARD:
                if (!gameState || !matchConfig) return <div>Error: Match not configured</div>;
                return (
                    <div className="animate-fade-in-up">
                        <div className="w-full flex justify-end mb-4">
                            <button
                                onClick={() => setShowFullScorecard(true)}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300`}
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
                <header className="w-full max-w-5xl text-center mb-8 bg-slate-900/30 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-center items-center">
                        <div className="text-center">
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                Youbee Cricket
                            </h1>
                            <p className="text-slate-400 mt-1">Public Match Scorecard</p>
                        </div>
                    </div>
                </header>
                <main className="w-full max-w-3xl">
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
                    <p>Crafted with ❤️ for Youbee</p>
                </footer>
            </div>
        );
    }


    return (
        <div className="min-h-screen text-slate-100 flex flex-col items-center p-4 font-sans">
            <header className="w-full max-w-5xl text-center mb-8 bg-slate-900/30 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-center">
                    <div className="text-left">
                      <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                          Youbee Cricket
                      </h1>
                      <p className="text-slate-400 mt-1">The ultimate gully cricket scorecard.</p>
                    </div>
                    {currentUser && (
                        <div className="text-right">
                            <p className="text-slate-300">Welcome, <span className="font-bold text-emerald-400">{currentUser}</span></p>
                            <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white transition">Logout</button>
                        </div>
                    )}
                </div>
            </header>
            <main className="w-full max-w-5xl">
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
            <footer className="mt-8 text-slate-500 text-sm text-center">
                <p>Crafted with ❤️ for Youbee</p>
            </footer>
        </div>
    );
};

export default App;
