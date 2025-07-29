
import React, { useState, useCallback, useReducer } from 'react';
import { AppState, Player, MatchConfig, Team, ScoreState, ScoreAction, BattingStats, BowlingStats, ScoreStateSnapshot } from './types.ts';
import PlayerSetup from './components/PlayerSetup.tsx';
import MatchSetup from './components/MatchSetup.tsx';
import Scoreboard from './components/Scoreboard.tsx';
import TeamSetup from './components/TeamSetup.tsx';
import CoinToss from './components/CoinToss.tsx';
import FullScorecard from './components/FullScorecard.tsx';


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
        const wicketsInHand = state.battingTeam.players.length - 1 - state.wickets;
        return { ...state, inningsOver: true, matchOver: true, statusMessage: `${battingTeamName} won by ${wicketsInHand} wickets!` };
    }

    const allOut = state.wickets >= state.battingTeam.players.length - 1;
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

function scoreReducer(state: ScoreState, action: ScoreAction): ScoreState {
  // Handle state initialization and reset first to prevent errors on a null state.
  if (action.type === 'SET_STATE') {
      return action.payload;
  }

  // If state is not initialized, do not process other actions.
  if (!state) {
    return state;
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
  const [appState, setAppState] = useState<AppState>(AppState.TEAM_SETUP);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState<Team>({ name: '', players: [] });
  const [teamB, setTeamB] = useState<Team>({ name: '', players: [] });
  const [tossWinnerBatting, setTossWinnerBatting] = useState<string | null>(null);
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);

  const [gameState, dispatch] = useReducer(scoreReducer, null, () => (null as unknown as ScoreState));
  const [firstInningsSummary, setFirstInningsSummary] = useState<ScoreState | null>(null);

  const [showFullScorecard, setShowFullScorecard] = useState(false);


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
            />
          </>
        )
      default:
        return <div>Something went wrong</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <header className="w-full max-w-4xl text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Cricket Score Card
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
                teamA={teamA}
                teamB={teamB}
                onClose={() => setShowFullScorecard(false)}
            />
        )}
        <footer className="mt-8 text-slate-500 text-sm">
            <p>Built with React, TypeScript, and Tailwind CSS</p>
        </footer>
    </div>
  );
};

export default App;