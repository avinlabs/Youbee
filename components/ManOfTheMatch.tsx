
import React, { useState, useEffect } from 'react';
import { ShareableScorecardState, ScoreState } from '../types.ts';
import { GoogleGenAI } from "@google/genai";

interface ManOfTheMatchProps {
  matchData: ShareableScorecardState;
  onClose: () => void;
}

const buildPrompt = (data: ShareableScorecardState): string => {
    const { firstInnings, currentInnings } = data;

    if (!firstInnings) return '';

    const formatBatting = (innings: ScoreState) => 
        Object.values(innings.battingStats)
            .filter(p => p.ballsFaced > 0 || p.status !== 'Not Out' || p.fours > 0)
            .map(p => `  - ${p.playerName}: ${p.fours} Fours (${p.ballsFaced} balls), Status: ${p.status}`)
            .join('\n');

    const formatBowling = (innings: ScoreState) =>
        Object.values(innings.bowlingStats)
            .filter(p => p.overs > 0 || p.wickets > 0 || (p.playerId === innings.currentBowlerId && innings.ballsInCurrentOver > 0))
            .map(p => {
                const balls = p.playerId === innings.currentBowlerId ? innings.ballsInCurrentOver : 0;
                return `  - ${p.playerName}: ${p.wickets} Wickets, ${p.wides} wides in ${p.overs}.${balls} overs`;
            })
            .join('\n');

    const prompt = `
You are an expert cricket analyst for a local "gully cricket" tournament where rules are slightly different. Scoring is based on 'Fours' and 'Wickets'. Based on the following match data, please determine the "Man of the Match". A player can win for an outstanding batting performance (scoring lots of fours), a game-changing bowling spell (taking crucial wickets), or a strong all-round performance.

Provide only the player's name and a brief, one-sentence justification for your choice, in the format:
**Player Name:** [Justification]

--- MATCH DATA ---

Match Result: ${currentInnings.statusMessage}

First Innings: ${firstInnings.battingTeam.name}
- Score: ${firstInnings.fours} Fours / ${firstInnings.wickets} Wickets
- Batting Performances:
${formatBatting(firstInnings)}
- Bowling Performances (${firstInnings.bowlingTeam.name}):
${formatBowling(firstInnings)}

Second Innings: ${currentInnings.battingTeam.name}
- Score: ${currentInnings.fours} Fours / ${currentInnings.wickets} Wickets
- Target: ${currentInnings.target}
- Batting Performances:
${formatBatting(currentInnings)}
- Bowling Performances (${currentInnings.bowlingTeam.name}):
${formatBowling(currentInnings)}

--- END OF DATA ---

Man of the Match Prediction:
`;
    return prompt;
};


const ManOfTheMatch: React.FC<ManOfTheMatchProps> = ({ matchData, onClose }) => {
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getPrediction = async () => {
      setLoading(true);
      setError('');

      if (!process.env.API_KEY) {
        setError("API Key not configured. This feature is unavailable.");
        setLoading(false);
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = buildPrompt(matchData);
        
        if (!prompt) {
          setError("Could not generate prompt from match data.");
          setLoading(false);
          return;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const text = response.text;

        if(text) {
             setPrediction(text);
        } else {
            setError("The AI could not determine a Man of the Match from the data.");
        }
      } catch (err) {
        console.error("Error fetching prediction:", err);
        setError("An error occurred while fetching the prediction.");
      } finally {
        setLoading(false);
      }
    };
    getPrediction();
  }, [matchData]);
  
  const formattedPrediction = prediction.replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-400">$1</strong>');


  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up" onClick={onClose}>
        <div className="card rounded-2xl shadow-2xl w-full max-w-md border-purple-500/20" onClick={e => e.stopPropagation()}>
            <div className="p-8 relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-3xl font-bold transition-colors">&times;</button>
                <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-6">✨ Man of the Match</h2>
                <div className="min-h-[150px] flex items-center justify-center bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                    {loading && (
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-t-purple-400 border-slate-600 rounded-full mx-auto animate-spin"></div>
                            <p className="mt-4 text-slate-400">The AI is analyzing the match...</p>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {!loading && !error && (
                        <div className="text-center animate-fade-in-up">
                            <p className="text-lg text-slate-200" dangerouslySetInnerHTML={{ __html: formattedPrediction }}></p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ManOfTheMatch;
