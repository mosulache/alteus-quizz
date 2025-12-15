import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HostResults() {
    const { participants, reset } = useGameStore();
    const navigate = useNavigate();

    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
    const top3 = sortedParticipants.slice(0, 3);
    const rest = sortedParticipants.slice(3);

    const handleReset = () => {
        reset();
        navigate("/host");
    }

    return (
        <div className="flex flex-col h-full items-center justify-center gap-12 animate-in zoom-in duration-700">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-8 drop-shadow-xl uppercase tracking-widest">
                Final Leaderboard
            </h1>

            <div className="flex items-end gap-8 mb-12">
                {/* 2nd Place */}
                {top3[1] && (
                    <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-12 duration-1000 delay-300">
                        <div className="text-3xl font-bold text-slate-300">{top3[1].name}</div>
                        <div className="w-32 h-48 bg-slate-800 rounded-t-xl border-t-4 border-slate-400 flex flex-col items-center justify-end pb-4 shadow-xl">
                            <div className="text-4xl font-black text-slate-500">2</div>
                            <div className="font-mono text-slate-400 mt-2">{top3[1].score} pts</div>
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {top3[0] && (
                    <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-20 duration-1000 z-10">
                        <Trophy size={64} className="text-yellow-400 mb-2 drop-shadow-lg animate-bounce" />
                        <div className="text-4xl font-bold text-yellow-400">{top3[0].name}</div>
                        <div className="w-40 h-64 bg-slate-800 rounded-t-xl border-t-4 border-yellow-400 flex flex-col items-center justify-end pb-4 shadow-2xl shadow-yellow-500/20">
                            <div className="text-6xl font-black text-yellow-500">1</div>
                            <div className="font-mono text-yellow-200 mt-2 font-bold text-2xl">{top3[0].score} pts</div>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                    <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-8 duration-1000 delay-500">
                        <div className="text-3xl font-bold text-amber-700">{top3[2].name}</div>
                        <div className="w-32 h-32 bg-slate-800 rounded-t-xl border-t-4 border-amber-700 flex flex-col items-center justify-end pb-4 shadow-xl">
                            <div className="text-4xl font-black text-amber-800">3</div>
                            <div className="font-mono text-amber-700 mt-2">{top3[2].score} pts</div>
                        </div>
                    </div>
                )}
            </div>

            {rest.length > 0 && (
                <div className="w-full max-w-2xl bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    {rest.map((p, i) => (
                        <div key={p.id} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0 text-slate-400">
                            <div className="flex items-center gap-4">
                                <span className="font-mono w-8 text-right">{i + 4}.</span>
                                <span className="text-xl">{p.name}</span>
                            </div>
                            <span className="font-mono font-bold">{p.score} pts</span>
                        </div>
                    ))}
                </div>
            )}

            <Button onClick={handleReset} variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white mt-8">
                <RefreshCcw size={16} className="mr-2" /> Play Again
            </Button>
        </div>
    )
}

