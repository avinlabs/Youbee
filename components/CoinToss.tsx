
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
    }, 2000);
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
    <div className="card p-6 md:p-8 rounded-xl shadow-2xl w-full text-center animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-emerald-400">
          <span className="text-4xl font-black text-slate-500 mr-2">3</span>
          The Toss
        </h2>
      </div>
      
      {step === 'PRE_TOSS' && (
        <div className="animate-fade-in-up">
          <p className="text-slate-400 mb-6">Let's see who gets to make the call.</p>
          <button
            onClick={beginToss}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-12 rounded-md transition duration-200"
          >
            Start Toss
          </button>
        </div>
      )}

      {step === 'AWAIT_CALL' && caller && (
        <div className="animate-fade-in-up">
          <p className="text-lg text-slate-300"><span className="font-bold text-emerald-400">{caller.name}</span> will call the toss.</p>
          <p className="text-slate-400 my-6">What's the call?</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => handleCall('Heads')} className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-md">Heads</button>
            <button onClick={() => handleCall('Tails')} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-8 rounded-md">Tails</button>
          </div>
        </div>
      )}

      {(step === 'FLIPPING' || step === 'RESULT') && (
        <div className="animate-fade-in-up">
            <p className="text-slate-300 mb-4">{caller?.name} called <span className="font-bold text-yellow-400">{call}!</span> The coin is in the air...</p>
            <div className="flex justify-center items-center my-8 [perspective:800px]">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex justify-center items-center text-slate-800 font-black text-4xl shadow-lg transition-transform duration-1000 ${step === 'FLIPPING' ? 'animate-spin' : ''}`}
                     style={{ transformStyle: 'preserve-3d', transform: step === 'RESULT' ? 'rotateY(360deg)' : ''}}>
                    {step === 'FLIPPING' ? '?' : result?.[0]}
                </div>
            </div>
        </div>
      )}

      {step === 'RESULT' && winner && (
         <div className="animate-fade-in-up">
            <p className="text-2xl text-slate-300">It's <span className="font-bold text-yellow-400">{result}!</span></p>
            <h3 className="text-3xl font-bold text-white mt-2">
                <span className="text-emerald-400">{winner.name}</span> has won the toss!
            </h3>
            <p className="text-slate-400 mt-4 mb-6">{winner.name}, what is your decision?</p>
            <div className="flex justify-center gap-4">
                 <button
                    onClick={() => handleChoice('Bat')}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-md transition duration-200"
                    >
                    Bat First
                </button>
                 <button
                    onClick={() => handleChoice('Bowl')}
                    className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-md transition duration-200"
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