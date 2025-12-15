import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, QrCode } from "lucide-react";

export function HostLobby() {
    const { participants, startQuiz, sessionCode } = useGameStore();
    const navigate = useNavigate();

    const handleStart = () => {
        startQuiz();
        navigate("/host/game");
    }

    return (
        <div className="flex flex-col h-full gap-12 items-center justify-center">
            <div className="flex flex-col md:flex-row gap-16 items-center">
                <div className="bg-white p-6 rounded-3xl shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500">
                    {/* Placeholder QR */}
                    <div className="w-72 h-72 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-4">
                        <QrCode size={120} className="text-slate-700" />
                        <span className="font-mono text-sm">SCAN TO JOIN</span>
                    </div>
                </div>
                <div className="flex flex-col gap-6 text-left">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-bold text-slate-400">Join at <span className="text-white">alteus.quiz</span></h2>
                        <h2 className="text-4xl font-bold text-slate-400">with code:</h2>
                    </div>
                    <div className="text-9xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 tracking-wider drop-shadow-2xl">
                        {sessionCode}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-10 min-h-[250px] shadow-2xl">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-4 text-slate-300">
                        <Users size={32} />
                        <span className="text-2xl font-bold">Players Waiting</span>
                    </div>
                    <div className="text-4xl font-black text-white">{participants.length}</div>
                </div>
                
                <div className="flex flex-wrap gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {participants.map(p => (
                        <div key={p.id} className="bg-slate-800/80 border border-slate-700/50 px-6 py-3 rounded-full text-xl font-bold text-white flex items-center gap-3 animate-in zoom-in slide-in-from-bottom-4 duration-300 shadow-lg">
                            <div className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{background: p.color, boxShadow: `0 0 10px ${p.color}`}}></div>
                            {p.name}
                        </div>
                    ))}
                    {participants.length === 0 && (
                        <div className="w-full text-center py-10">
                            <p className="text-slate-600 text-2xl font-light animate-pulse">Waiting for players to join the game...</p>
                        </div>
                    )}
                </div>
            </div>

            <Button 
                size="lg" 
                className="text-2xl px-16 py-8 rounded-2xl font-black bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.7)]" 
                onClick={handleStart}
                disabled={participants.length === 0}
            >
                START QUIZ
            </Button>
        </div>
    )
}

