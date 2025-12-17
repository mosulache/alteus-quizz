import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HostGame() {
    const { 
        quiz, 
        currentQuestionIndex, 
        currentQuestion,
        timeRemaining, 
        status, 
        nextQuestion, 
        participants,
        skipTimer,
        settings
    } = useGameStore();
    
    const navigate = useNavigate();
    
    // Use currentQuestion from store directly, as quiz.questions might be empty or partial
    const question = currentQuestion;

    useEffect(() => {
        if (status === 'FINISHED') {
            navigate("/host/results");
        }
    }, [status, navigate]);

    if (!question) return null;

    if (status === 'REVIEW') {
        // Show correct answer and stats
        const leaderboardMode = settings?.leaderboardFrequency || "every_round";
        const showLeaderboard = leaderboardMode !== "end_only";
        const sorted = [...participants].sort((a, b) => b.score - a.score);
        const board = leaderboardMode === "top_3" ? sorted.slice(0, 3) : sorted;
        
        return (
            <div className="flex flex-col h-full gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <h2 className="text-4xl font-bold text-slate-300 text-center mb-4">{question.text}</h2>
                
                <div className="grid grid-cols-2 gap-8 flex-1 max-w-6xl mx-auto w-full">
                    {question.options.map((option, idx) => (
                        <div 
                            key={option.id}
                            className={cn(
                                "rounded-2xl p-8 flex items-center justify-between text-2xl font-bold border-2 transition-all duration-500",
                                option.isCorrect 
                                    ? "bg-green-600 border-green-400 text-white shadow-[0_0_30px_rgba(22,163,74,0.4)] scale-105" 
                                    : "bg-slate-800/50 border-slate-700 text-slate-500 opacity-50 grayscale"
                            )}
                        >
                            <div className="flex items-center gap-6">
                                <span className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold",
                                    option.isCorrect ? "bg-white text-green-700" : "bg-slate-700 text-slate-400"
                                )}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span>{option.text}</span>
                            </div>
                            {option.isCorrect && <Check size={40} />}
                        </div>
                    ))}
                </div>

                {question.explanation && (
                    <div className="max-w-4xl mx-auto w-full bg-slate-800/80 border border-slate-700 p-6 rounded-2xl flex gap-4 items-start animate-in slide-in-from-bottom-4 delay-300">
                        <div className="bg-yellow-500/10 p-3 rounded-lg text-yellow-500">
                            <Lightbulb size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-yellow-500 uppercase tracking-wider mb-1">Explanation</h3>
                            <p className="text-xl text-slate-200 leading-relaxed">{question.explanation}</p>
                        </div>
                    </div>
                )}

                {showLeaderboard && (
                    <div className="max-w-5xl mx-auto w-full bg-slate-900/50 rounded-2xl border border-slate-800 p-6 animate-in fade-in delay-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-slate-200 uppercase tracking-widest">
                                Leaderboard {leaderboardMode === "top_3" ? "(Top 3)" : ""}
                            </h3>
                            <div className="text-xs text-slate-500 font-mono">
                                {settings?.pointsSystem ? `Points: ${settings.pointsSystem}` : ""}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {board.map((p, idx) => (
                                <div key={p.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-slate-500 w-8 text-right">{idx + 1}.</span>
                                        <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                                        <span className="text-slate-200 font-bold">{p.name}</span>
                                    </div>
                                    <span className="font-mono font-black text-slate-300">{p.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-center mt-4">
                    <Button onClick={nextQuestion} size="lg" className="text-xl px-12 py-8 bg-blue-600 hover:bg-blue-500 rounded-full font-bold shadow-xl flex items-center gap-3">
                        Next Question <ArrowRight size={24} />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-12">
                 <div className="text-2xl font-bold text-slate-500 uppercase tracking-widest">
                    Question {currentQuestionIndex + 1} / {(quiz?.totalQuestions ?? 0)}
                 </div>
                 <div className="flex items-center gap-4">
                     {/* Mock Answers Counter */}
                     <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 text-2xl font-mono text-blue-400">
                        {Math.floor(Math.random() * participants.length)} / {participants.length} Answers
                     </div>
                 </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-16">
                <h1 className="text-6xl font-black text-center text-white leading-tight max-w-5xl drop-shadow-2xl">
                    {question.text}
                </h1>

                {/* Timer */}
                <div className="relative w-full max-w-3xl h-8 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                    <div 
                        className={cn(
                            "h-full transition-all duration-1000 ease-linear",
                            timeRemaining < 10 ? "bg-red-500" : "bg-blue-500"
                        )}
                        style={{ width: `${(timeRemaining / question.timeLimit) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white drop-shadow-md">
                        {timeRemaining}s
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-6xl">
                    {question.options.map((option, idx) => (
                        <div key={option.id} className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl flex items-center gap-6">
                             <span className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center font-bold text-white text-xl">
                                {String.fromCharCode(65 + idx)}
                             </span>
                             <span className="text-2xl font-medium text-slate-200">{option.text}</span>
                        </div>
                    ))}
                </div>
            </div>
            
             <div className="mt-8 flex justify-end">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-400" onClick={skipTimer}>
                    Skip Timer
                </Button>
            </div>
        </div>
    );
}
