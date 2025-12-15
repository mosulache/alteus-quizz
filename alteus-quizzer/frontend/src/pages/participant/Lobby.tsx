import { useGameStore } from "@/store/gameStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Lobby() {
  const { currentPlayer, status } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'ACTIVE') {
      navigate("/game");
    }
  }, [status, navigate]);

  if (!currentPlayer) return <div className="text-center p-10">Please join first</div>;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center animate-in fade-in duration-500 py-10">
      <div className="relative">
        <div 
            className="w-32 h-32 rounded-full shadow-2xl flex items-center justify-center text-5xl font-bold text-white mb-4 animate-bounce border-4 border-white ring-4 ring-slate-100"
            style={{ backgroundColor: currentPlayer.color }}
        >
            {currentPlayer.name.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border text-slate-600 whitespace-nowrap">
            YOU
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">You're in, {currentPlayer.name}!</h2>
        <p className="text-slate-500 text-lg">Waiting for the host to start...</p>
      </div>

      <div className="w-full max-w-xs bg-slate-50 rounded-xl p-6 text-sm text-slate-500 border border-slate-200 mt-8">
        <p className="font-medium mb-2 text-slate-700">How to play:</p>
        <ul className="text-left space-y-2 list-disc pl-4">
            <li>Look at the big screen for questions</li>
            <li>Tap the correct color/shape here</li>
            <li>Answer fast for more points!</li>
        </ul>
      </div>
    </div>
  );
}

