import { Outlet } from "react-router-dom";

export function TVLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden flex flex-col font-sans">
      <header className="px-8 py-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50">
        <div className="flex items-baseline gap-4">
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Alteus</h1>
            <span className="text-slate-500 text-xl font-medium tracking-wide">QUIZZER</span>
        </div>
        <div className="flex items-center gap-4 bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700">
            <span className="text-slate-400 font-mono text-sm uppercase tracking-wider">Session Code</span>
            <span className="text-white font-mono text-2xl font-bold tracking-widest text-shadow-glow">#A1B2</span>
        </div>
      </header>
      <main className="flex-1 p-8 flex flex-col relative w-full h-full">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10"></div>
         <Outlet />
      </main>
    </div>
  );
}

