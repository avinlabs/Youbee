
import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { AppState, Player, MatchConfig, Team, ScoreState, ScoreAction, BattingStats, BowlingStats, ScoreStateSnapshot } from './types.ts';
import PlayerSetup from './components/PlayerSetup.tsx';
import MatchSetup from './components/MatchSetup.tsx';
import Scoreboard from './components/Scoreboard.tsx';
import TeamSetup from './components/TeamSetup.tsx';
import CoinToss from './components/CoinToss.tsx';
import FullScorecard from './components/FullScorecard.tsx';
import Login from './components/Login.tsx';


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

    // A team is all out when wickets taken equals the number of players. Allows "last man standing".
    const allOut = state.wickets >= state.battingTeam.players.length;
    const oversFinished = state.oversCompleted >= state.maxOvers;

    if (allOut || oversFinished) {
        if (state.target) { // Second innings ended
            const runDifference = state.target - 1 - state.runs;
            const message = runDifference > 0 ? `${bowlingTeamName} won by ${runDifference} runs!` : 'Match Tied!';
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
      if (state.history.length <= 1) {
          return state;
      }
  
      const currentOverNumber = state.oversCompleted;
  
      // Find the index of the first state snapshot that belongs to the current over.
      // This snapshot represents the state at the beginning of the over.
      const firstIndexOfOver = state.history.findIndex(s => s.oversCompleted === currentOverNumber);
  
      if (firstIndexOfOver !== -1) {
          // This is the state snapshot from the beginning of the over.
          const restoredSnapshot = state.history[firstIndexOfOver];
          // The new history should be all snapshots up to and including that restored one.
          const newHistory = state.history.slice(0, firstIndexOfOver + 1);
          return { ...restoredSnapshot, history: newHistory };
      }
  
      // Fallback: If for some reason we can't find the start of the current over (e.g., first over),
      // we reset to the absolute initial state of the innings.
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
        intermediateState.fours += 1; // This is a house rule where a no ball + 4 counts as a four.
        intermediateState.runs += action.payload.runs; // Add the automatic 4 runs for no ball
        updateBowlerStats(intermediateState.currentBowlerId, { runsConceded: intermediateState.bowlingStats[intermediateState.currentBowlerId].runsConceded + action.payload.runs });
        event = '4n';
      }

      if (action.payload.type === 'Wd') {
        intermediateState.widesInCurrentOver += 1;
        updateBowlerStats(intermediateState.currentBowlerId, { wides: intermediateState.bowlingStats[intermediateState.currentBowlerId].wides + 1 });
        event = 'Wd';
        if (intermediateState.widesInCurrentOver === 3) {
            intermediateState.runs += 4;
            updateBowlerStats(intermediateState.currentBowlerId, { runsConceded: intermediateState.bowlingStats[intermediateState.currentBowlerId].runsConceded + 4 });
            intermediateState.fours += 1; // This is a house rule
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
    // Load state from localStorage on initial render
    const loadState = () => {
        try {
            const serializedState = localStorage.getItem('youbeeCricketState');
            if (serializedState === null) {
                return undefined;
            }
            return JSON.parse(serializedState);
        } catch (err) {
            console.error("Could not load state from localStorage", err);
            return undefined;
        }
    };

    const savedState = loadState();

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(savedState?.isAuthenticated || false);
    const [appState, setAppState] = useState<AppState>(savedState?.appState || AppState.TEAM_SETUP);
    const [players, setPlayers] = useState<Player[]>(savedState?.players || []);
    const [teamA, setTeamA] = useState<Team>(savedState?.teamA || { name: '', players: [] });
    const [teamB, setTeamB] = useState<Team>(savedState?.teamB || { name: '', players: [] });
    const [tossWinnerBatting, setTossWinnerBatting] = useState<string | null>(savedState?.tossWinnerBatting || null);
    const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(savedState?.matchConfig || null);
    const [gameState, dispatch] = useReducer(scoreReducer, savedState?.gameState || null);
    const [firstInningsSummary, setFirstInningsSummary] = useState<ScoreState | null>(savedState?.firstInningsSummary || null);
    const [showFullScorecard, setShowFullScorecard] = useState(false);
    
    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (!isAuthenticated) return; // Don't save state if not logged in
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
                isAuthenticated,
            };
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem('youbeeCricketState', serializedState);
        } catch (err) {
            console.error("Could not save state to localStorage", err);
        }
    }, [appState, players, teamA, teamB, tossWinnerBatting, matchConfig, gameState, firstInningsSummary, isAuthenticated]);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);
  
  const handleLogout = useCallback(() => {
    try {
        localStorage.removeItem('youbeeCricketState');
    } catch (err) {
        console.error("Could not remove state from localStorage", err);
    }
    setAppState(AppState.TEAM_SETUP);
    setPlayers([]);
    setMatchConfig(null);
    setTeamA({ name: '', players: [] });
    setTeamB({ name: '', players: [] });
    setTossWinnerBatting(null);
    setFirstInningsSummary(null);
    dispatch({ type: 'SET_STATE', payload: null });
    setIsAuthenticated(false);
  }, []);

  const handleTeamsSet = useCallback((nameA: string, nameB: string) => {
    setTeamA({ name: nameA, players: [] });
    setTeamB({ name: nameB, players: [] });
    setAppState(AppState.PLAYER_SETUP);
  }, []);

  const handlePlayersSet = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setAppState(AppState.COIN_TOSS);
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
    setAppState(AppState.TEAM_SETUP);
    setPlayers([]);
    setMatchConfig(null);
    setTeamA({ name: '', players: [] });
    setTeamB({ name: '', players: [] });
    setTossWinnerBatting(null);
    setFirstInningsSummary(null);
    dispatch({ type: 'SET_STATE', payload: null });
  }, []);

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
      case AppState.TEAM_SETUP:
        return <TeamSetup onTeamsSet={handleTeamsSet} />;
      case AppState.PLAYER_SETUP:
        return <PlayerSetup onPlayersSet={handlePlayersSet} teamAName={teamA.name} teamBName={teamB.name} />;
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
          <>
             <div className="w-full flex justify-end mb-4">
                  <button 
                    onClick={() => setShowFullScorecard(true)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition bg-slate-700 hover:bg-slate-600 text-slate-300`}
                  >
                    Show Full Scorecard
                  </button>
               </div>
            
            <Scoreboard 
                state={gameState}
                dispatch={dispatch}
                onNewGame={handleNewGame}
                onNextInnings={handleNextInnings}
                firstInningsSummary={firstInningsSummary}
            />
          </>
        )
      default:
        return <div>Something went wrong</div>;
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
            <Login onLoginSuccess={handleLogin} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 font-sans">
        <header className="w-full max-w-4xl text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Youbee Cricket Score Card
            </h1>
            <p className="text-slate-400 mt-2">The ultimate tool for your local cricket matches.</p>
        </header>
        <main className="w-full max-w-4xl">
            {renderContent()}
        </main>
        {showFullScorecard && gameState && (
            <FullScorecard
                firstInnings={firstInningsSummary}
                currentInnings={gameState}
                onClose={() => setShowFullScorecard(false)}
            />
        )}
        <footer className="w-full max-w-4xl flex justify-between items-center mt-auto pt-8 text-slate-500">
            <p>developed by Avinash</p>
             <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-500 p-2 rounded-full transition duration-200"
                aria-label="Logout"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </footer>
    </div>
  );
};

export default App;
