
import React, { useState, useMemo } from 'react';
import { Team } from '../types.ts';

interface CoinTossProps {
  teamA: Team;
  teamB: Team;
  onTossComplete: (battingTeamName: string) => void;
}

type TossStep = 'PRE_TOSS' | 'AWAIT_CALL' | 'FLIPPING' | 'RESULT';

const CoinToss: React.FC<CoinTossProps> = ({ teamA, teamB, onTossComplete }) => {
  const [step, setStep] = useState<TossStep>('PRE_TOSS');
  const [caller, setCaller] = useState<Team | null>(null);
  const [call, setCall] = useState<'Heads' | 'Tails' | null>(null);
  const [result, setResult] = useState<'Heads' | 'Tails' | null>(null);
  const [winner, setWinner] = useState<Team | null>(null);

  const nonCaller = useMemo(() => {
    if (!caller) return null;
    return caller.name === teamA.name ? teamB : teamA;
  }, [caller, teamA, teamB]);

  const beginToss = () => {
    const randomCaller = Math.random() < 0.5 ? teamA : teamB;
    setCaller(randomCaller);
    setStep('AWAIT_CALL');
  };

  const handleCall = (choice: 'Heads' | 'Tails') => {
    setCall(choice);
    setStep('FLIPPING');
    
    setTimeout(() => {
        const flipResult = Math.random() < 0.5 ? 'Heads' : 'Tails';
        setResult(flipResult);
        if (choice === flipResult) {
            setWinner(caller);
        } else {
            setWinner(nonCaller);
        }
        setStep('RESULT');
    }, 2500);
  };

  const handleChoice = (choice: 'Bat' | 'Bowl') => {
    if (!winner) return;
    if (choice === 'Bat') {
        onTossComplete(winner.name);
    } else {
        const otherTeam = winner.name === teamA.name ? teamB.name : teamA.name;
        onTossComplete(otherTeam);
    }
  };

  return (
    <div className="card p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto text-center animate-fade-in-up border-cyan-500/20">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 flex items-center justify-center gap-4">
          <span className="flex items-center justify-center w-10 h-10 text-2xl font-black text-slate-900 bg-cyan-400 rounded-full">3</span>
          The Toss
        </h2>
      </div>
      
      {step === 'PRE_TOSS' && (
        <div className="animate-fade-in-up">
          <p className="text-slate-400 mb-6">Let's see who gets to make the call.</p>
          <button
            onClick={beginToss}
            className="btn-primary w-full sm:w-auto"
          >
            Start Toss
          </button>
        </div>
      )}

      {step === 'AWAIT_CALL' && caller && (
        <div className="animate-fade-in-up">
          <p className="text-lg text-slate-300"><span className="font-bold text-cyan-400">{caller.name}</span> will call the toss.</p>
          <p className="text-slate-400 my-6">What's the call?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => handleCall('Heads')} className="btn-primary w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/20">Heads</button>
            <button onClick={() => handleCall('Tails')} className="btn-secondary w-full sm:w-auto">Tails</button>
          </div>
        </div>
      )}

      {(step === 'FLIPPING' || step === 'RESULT') && (
        <div className="animate-fade-in-up">
            <p className="text-slate-300 mb-4">{caller?.name} called <span className="font-bold text-yellow-400">{call}!</span> The coin is in the air...</p>
            <div className="flex justify-center items-center my-8 [perspective:1000px]">
                <div className="relative w-28 h-28 md:w-40 md:h-40 transition-transform duration-[2500ms] ease-in-out"
                     style={{ transformStyle: 'preserve-3d', transform: step === 'FLIPPING' ? 'rotateY(1800deg)' : (result === 'Heads' ? 'rotateY(360deg)' : 'rotateY(540deg)') }}>
                     {/* Heads */}
                    <div className="absolute w-full h-full rounded-full flex justify-center items-center text-slate-800 font-black text-5xl bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-2xl" style={{backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'}}>
                        H
                    </div>
                     {/* Tails */}
                    <div className="absolute w-full h-full rounded-full flex justify-center items-center text-slate-100 font-black text-5xl bg-gradient-to-br from-slate-500 to-slate-800 shadow-2xl" style={{transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'}}>
                        T
                    </div>
                </div>
            </div>
        </div>
      )}

      {step === 'RESULT' && winner && (
         <div className="animate-fade-in-up mt-8">
            <p className="text-2xl text-slate-300">It's <span className="font-bold text-yellow-400">{result}!</span></p>
            <h3 className="text-3xl font-bold text-white mt-2">
                <span className="text-cyan-400 animate-pulse">{winner.name}</span> has won the toss!
            </h3>
            <p className="text-slate-400 mt-4 mb-6">{winner.name}, what is your decision?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <button
                    onClick={() => handleChoice('Bat')}
                    className="btn-primary w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                    >
                    Bat First
                </button>
                 <button
                    onClick={() => handleChoice('Bowl')}
                    className="btn-secondary w-full sm:w-auto"
                    >
                    Bowl First
                </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default CoinToss;